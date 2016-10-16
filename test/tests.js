// native
const assert = require('assert');
const path   = require('path');

// third-party
const should = require('should');

// tested module
const envOptions = require('../');

describe('envOptions(loaders)', function () {

  beforeEach(function () {

    process.env.SECRET_PATH = path.join(__dirname, 'fixtures/secret-file-1');
    process.env.SOME_OPTION = 'someValue';

  });

  afterEach(function () {

    delete process.env.SECRET_PATH;
    delete process.env.SOME_OPTION;

  });

  it('basics', function () {

    envOptions({
      secret: 'fs:SECRET_PATH',
      someOption: 'env:SOME_OPTION',
      someOtherOption: 'env?:SOME_OTHER_OPTION',
    })
    .should.eql({
      secret: 'secret-1',
      someOption: 'someValue',
      someOtherOption: undefined,
    });

  });

  it('should allow defining multiple loaders', function () {

    envOptions({
      secret: 'fs:SECRET_PATH',
      someOption: 'env:SOME_OPTION',
      someOtherOption: 'env?:SOME_OTHER_OPTION fs:SECRET_PATH',
    })
    .should.eql({
      secret: 'secret-1',
      someOption: 'someValue',
      someOtherOption: 'secret-1',
    });

  });

  it('should error upon not finding required env var', function () {

    assert.throws(function () {
      envOptions({
        secret: 'fs:ENV_VAR_THAT_DOES_NOT_EXIST',
        someOption: 'env:SOME_OPTION',
        someOtherOption: 'env?:SOME_OTHER_OPTION fs:SECRET_PATH',
      });
    }, new RegExp('ENV_VAR_THAT_DOES_NOT_EXIST env var MUST be set'));

  });

});
