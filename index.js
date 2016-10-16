// native
const fs = require('fs');

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

const LOADER_FNS = {
  fs: function (isOptional, filepathVarName) {
    var filepath = process.env[filepathVarName];

    if (!filepath) {
      if (!isOptional) {
        throw new Error(filepathVarName + ' env var MUST be set');
      } else {
        return undefined;
      }
    }

    return fs.readFileSync(filepath, 'utf8');
  },

  env: function (isOptional, varName) {
    var value = process.env[varName];

    if (!isOptional && typeof value === 'undefined') {
      throw new Error(varName + ' env var MUST be set');
    }

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

  // split by whitespaces
  var subLoaders = loaderString.split(/\s+/).map((subLoaderStr) => {
    var match = subLoaderStr.match(LOADER_RE);

    if (!match) {
      throw new Error('invalid loader "' + subLoaderStr + '"" from "' + loaderString + '"');
    }

    var protocol = match[1];
    var isOptional = match[2];
    var args = match[3] || '';
    args = args.split(',');

    // isOptional is always the first argument
    args.unshift(isOptional);

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

    var loaderObjs = parseLoaderString(optionLoaders[optName])

    opts[optName] = runLoaderObjs(loaderObjs);
  }

  return opts;
}

module.exports = envOptions;
