// native
const assert = require('assert');
const path   = require('path');

// third-party
const should = require('should');

// tested module
const envOptions = require('../');

describe('envOptions(loaders)', function () {

  beforeEach(function () {

  });

  afterEach(function () {

    for (var prop in process.env) {
      delete process.env[prop];
    }

  });

  it('basics', function () {

    process.env.SECRET_PATH = path.join(__dirname, 'fixtures/secret-file-1');
    process.env.SOME_OPTION = 'someValue';
    process.env.ENV_BOOLEAN = 'FALSE';
    process.env.ENV_NUMBER  = '10.9';

    envOptions({
      secret: 'fs:SECRET_PATH',
      fromEnv: 'env:SOME_OPTION',
      optional: 'env?:SOME_OTHER_OPTION || default value',
      envBoolean: 'bool:ENV_BOOLEAN',
      envNumber: 'num:ENV_NUMBER',
      pkgName: 'pkg:name',

      literal: 'literal value',
      literalNumber: 6,
      literalBoolean: true,
    })
    .should.eql({
      secret: 'secret-1',
      fromEnv: 'someValue',
      optional: 'default value',
      envBoolean: false,
      envNumber: 10.9,
      pkgName: 'mocha',

      literal: 'literal value',
      literalNumber: 6,
      literalBoolean: true,
    });

  });

  it('should allow defining multiple loaders', function () {

    process.env.SECRET_PATH = path.join(__dirname, 'fixtures/secret-file-1');
    process.env.SOME_OPTION = 'someValue';

    envOptions({
      secret: 'fs:SECRET_PATH',
      fromEnv: 'env:SOME_OPTION',
      optional: 'env?:SOME_OTHER_OPTION || fs:SECRET_PATH',
    })
    .should.eql({
      secret: 'secret-1',
      fromEnv: 'someValue',
      optional: 'secret-1',
    });

  });

  it('should error upon not finding required env var', function () {

    process.env.SECRET_PATH = path.join(__dirname, 'fixtures/secret-file-1');
    process.env.SOME_OPTION = 'someValue';

    assert.throws(function () {
      envOptions({
        secret: 'fs:ENV_VAR_THAT_DOES_NOT_EXIST',
        fromEnv: 'env:SOME_OPTION',
        optional: 'env?:SOME_OTHER_OPTION fs:SECRET_PATH',
      });
    }, new RegExp('ENV_VAR_THAT_DOES_NOT_EXIST env var MUST be set'));

  });

});
