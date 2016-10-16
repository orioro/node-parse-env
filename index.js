// native
const fs = require('fs');
const path = require('path');

// third-party
const findRoot   = require('find-root');
const objectPath = require('object-path');

/**
 * Root directory of the main module (module at which this module is installed)
 * @type {String}
 */
const MAIN_ROOT = findRoot(require.main.filename);

/**
 * Regular expression used to parse loader strings
 *
 * 1. the protocol
 * 2. an optional indicator that the variable is optional
 * 3. arguments string to be passed to the loader, sparated by commas
 * 
 * @type {RegExp}
 */
const LOADER_RE = /^(.+?)(\?)?:(.+)$/;

/**
 * Used to split the loaderString
 * @type {RegExp}
 */
const OR_RE = /\s*\|\|\s*/;

/**
 * Used to split array string
 * @type {RegExp}
 */
const COMMA_RE = /\s*,\s*/;

/**
 * Hash with booleans by string
 * @type {Object}
 */
const BOOL_STRS = {
  'false': false,
  'true': true,
};

const LOADER_FNS = {
  env: function (isOptional, envVar) {
    var envValue = process.env[envVar];

    if (!isOptional && typeof envValue === 'undefined') {
      throw new Error(envVar + ' env var MUST be set');
    }

    return envValue;
  },

  fs: function (isOptional, envVar) {
    var envValue = LOADER_FNS.env(isOptional, envVar);
    var value;

    try {
      value = fs.readFileSync(envValue, 'utf8');
    } catch (e) {
      if (!isOptional) {
        throw new TypeError('illegal value "' + envValue + '" for "' + envVar + '" env var - MUST be valid FILEPATH - ERROR: ' + e.code);
      } else {
        return undefined;
      }
    }

    return value;
  },

  num: function (isOptional, envVar) {
    var envValue = LOADER_FNS.env(isOptional, envVar);
    var numValue = parseFloat(envValue);

    if (isNaN(numValue)) {
      if (!isOptional) {
        throw new TypeError('illegal value "' + envValue + '" for "' + envVar + '" env var - MUST be valid NUMBER');
      } else {
        return undefined;
      }
    }

    return numValue;
  },

  bool: function (isOptional, envVar) {
    var envValue  = LOADER_FNS.env(isOptional, envVar) || '';
    var boolValue = BOOL_STRS[envValue.toLowerCase()];

    if (typeof boolValue === 'undefined') {
      if (!isOptional) {
        throw new TypeError('illegal value "' + envValue + '" for "' + envVar + '" env var - MUST be valid BOOLEAN');
      } else {
        return undefined;
      }
    }

    return boolValue;
  },

  pkg: function (isOptional, objPath) {

    if (!MAIN_ROOT) {
      if (!isOptional) {
        throw new Error('could not locate package.json');
      } else {
        return undefined;
      }
    }

    var packageJSON = require(path.join(MAIN_ROOT, 'package.json'));

    var value = objectPath.get(packageJSON, objPath);

    if (typeof value === 'undefined') {
      if (!isOptional) {
        throw new Error(objPath + ' path of package.json MUST be set');
      } else {
        return undefined;
      }
    }

    return value;
  },

  list: function (isOptional, envVar) {
    var envValue = LOADER_FNS.env(isOptional, envVar) || '';

    return envValue.split(COMMA_RE);
  },

  json: function (isOptional, envVar) {
    var envValue = LOADER_FNS.env(isOptional, envVar) || '';

    var value;

    try {
      value = JSON.parse(envValue);
    } catch (e) {
      if (!isOptional) {
        throw new TypeError('illegal value "' + envValue + '" for "' + envVar + '" env var - MUST be valid JSON');
      } else {
        value = undefined;
      }
    }

    return value;
  },

  literal: function (isOptional, value) {
    return value;
  },
};

/**
 * Parses a loader string
 * 
 * @param  {String} loader
 * @return {Object}
 */
function parseLoaderString(loaderString) {
  if (typeof loaderString !== 'string') {
    throw new Error('invalid loaderString ' + loaderString);
  }

  // split into multiple sub loaders
  var subLoaders = loaderString.split(OR_RE).map((subLoaderStr) => {
    var match = subLoaderStr.match(LOADER_RE);

    var protocol;
    var isOptional;
    var args;

    if (match) {
      protocol = match[1];
      isOptional = match[2] ? true : false;
      args = match[3] || '';
      args = args.split(',');

      // isOptional is always the first argument
      args.unshift(isOptional);

    } else {

      protocol   = 'literal';
      args       = [false, subLoaderStr];

      // throw new Error('invalid loader "' + subLoaderStr + '"" from "' + loaderString + '"');
    }

    var fn = LOADER_FNS[protocol];

    if (!fn) {
      throw new Error('invalid loader protocol "' + protocol + '" from "' + subLoaderStr + '"" from "' + loader + '"');
    }

    return {
      fn: fn,
      args: args,
    };
  });

  return subLoaders;
}

/**
 * Runs an array of loaderObjs and retrieves the final value
 * @param  {Array} loaderObjs
 * @return {*}
 */
function runLoaderObjs(loaderObjs) {

  var res;

  loaderObjs.some((obj) => {

    res = obj.fn.apply(null, obj.args);

    // consider `undefined` a non-option
    // in case any other value is found, stop looping
    return (typeof res === 'undefined') ? false : true;
  });

  return res;
}

function envOptions(optionLoaders) {
  var opts = {};

  for (var optName in optionLoaders) {

    var loaderString = optionLoaders[optName];

    if (typeof loaderString === 'string') {
      // only process strings
      var loaderObjs = parseLoaderString(loaderString);
      opts[optName] = runLoaderObjs(loaderObjs);
    } else {
      opts[optName] = loaderString;
    }
  }

  return opts;
}

module.exports = envOptions;
