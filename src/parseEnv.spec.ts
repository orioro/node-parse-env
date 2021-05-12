jest.mock('fs')

import { readFileSync } from 'fs'
import { parseEnv } from './parseEnv'
import { ParseEnvRequiredError, ParseEnvInvalidInputError } from './errors'
import { testCases, fnCallLabel, variableName } from '@orioro/jest-util'

const mockedReadFileSync = readFileSync as jest.Mock

mockedReadFileSync.mockImplementation(
  (path, encoding) => `FILE_CONTENTS of "${path}" (${encoding})`
)

describe('parseEnv', () => {
  describe('function based value resolution', () => {
    const map = {
      opt1: (env) => env.OPT_1.toLowerCase(),
      opt2: (env) => env.OPT_2.toUpperCase(),
      opt3: (env) => parseFloat(env.OPT_3),
    }

    testCases(
      [
        [
          map,
          {
            OPT_1: 'Option 1 Value',
            OPT_2: 'Option 2 Value',
            OPT_3: '16.78',
          },
          {
            opt1: 'option 1 value',
            opt2: 'OPTION 2 VALUE',
            opt3: 16.78,
          },
        ],
      ],
      parseEnv,
      (args, result) =>
        fnCallLabel('parseEnv', [args[0], variableName('env')], result)
    )
  })

  describe('built-in value resolvers', () => {
    const env = {
      SOME_STR_OPTION: 'String option value',
      SECRET_FILE_PATH: '/path/to/some-secret/file.txt',
      AUTHORIZED_ORIGINS: 'example.com,    www.example.com ;api.example.com',
      BOOLEAN_TRUE: 'TRUE',
      BOOLEAN_FALSE: 'false',
      BOOLEAN_INVALID: 'yes',
      NUMBER_INT: '90',
      NUMBER_FLOAT: '90.5',
      JSON: '{ "key": "value" }',
    }

    testCases(
      [
        // literal
        [{ opt: 'some value' }, env, { opt: 'some value' }],
        [{ opt: 'SOME_STR_OPTION' }, env, { opt: 'SOME_STR_OPTION' }],

        // env
        [{ opt: 'env:SOME_STR_OPTION' }, env, { opt: 'String option value' }],
        [
          { opt: 'env:SECRET_FILE_PATH' },
          env,
          { opt: '/path/to/some-secret/file.txt' },
        ],
        [{ opt: 'env:UNDEFINED_OPTION' }, env, ParseEnvRequiredError],
        [{ opt: 'env?:UNDEFINED_OPTION' }, env, { opt: null }],

        // fs
        [
          { opt: 'fs:SECRET_FILE_PATH' },
          env,
          { opt: 'FILE_CONTENTS of "/path/to/some-secret/file.txt" (utf8)' },
        ],
        [{ opt: 'fs:UNDEFINED_OPTION' }, env, ParseEnvRequiredError],
        [{ opt: 'fs?:UNDEFINED_OPTION' }, env, { opt: null }],

        // list
        [
          { opt: 'list:AUTHORIZED_ORIGINS' },
          env,
          { opt: ['example.com', 'www.example.com', 'api.example.com'] },
        ],
        [{ opt: 'list:UNDEFINED_OPTION' }, env, ParseEnvRequiredError],
        [{ opt: 'list?:UNDEFINED_OPTION' }, env, { opt: null }],

        // boolean
        [{ opt: 'boolean:BOOLEAN_TRUE' }, env, { opt: true }],
        [{ opt: 'boolean:BOOLEAN_FALSE' }, env, { opt: false }],
        [{ opt: 'boolean:BOOLEAN_INVALID' }, env, ParseEnvInvalidInputError],
        [{ opt: 'boolean:UNDEFINED_OPTION' }, env, ParseEnvRequiredError],
        [{ opt: 'boolean?:UNDEFINED_OPTION' }, env, { opt: null }],

        // number
        [{ opt: 'number:NUMBER_INT' }, env, { opt: 90 }],
        [{ opt: 'number:NUMBER_FLOAT' }, env, { opt: 90.5 }],
        [{ opt: 'number:AUTHORIZED_ORIGINS' }, env, ParseEnvInvalidInputError],
        [{ opt: 'number:UNDEFINED_OPTION' }, env, ParseEnvRequiredError],
        [{ opt: 'number?:UNDEFINED_OPTION' }, env, { opt: null }],

        // json
        [{ opt: 'json:JSON' }, env, { opt: { key: 'value' } }],
        [{ opt: 'json:AUTHORIZED_ORIGINS' }, env, ParseEnvInvalidInputError],
        [{ opt: 'json:UNDEFINED_OPTION' }, env, ParseEnvRequiredError],
        [{ opt: 'json?:UNDEFINED_OPTION' }, env, { opt: null }],

        // unknown resolver (treated as if it was a literal value)
        [
          { opt: 'unknown:SOME_STR_OPTION' },
          env,
          { opt: 'unknown:SOME_STR_OPTION' },
        ],
      ],
      parseEnv,
      (args, result) =>
        fnCallLabel('parseEnv', [args[0], variableName('env')], result)
    )
  })
})
