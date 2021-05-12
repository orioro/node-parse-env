import { readFileSync } from 'fs'

import {
  ResolverCandidate,
  nestedMap,
  arrayResolver,
  objectResolver,
  defaultResolver,
} from '@orioro/nested-map'
import { ParseEnvRequiredError, ParseEnvInvalidInputError } from './errors'

type PlainObject = {
  [key: string]: any
}

type EnvOptions = {
  [key: string]: string | undefined
}

/**
 * @function parseEnvValue
 * @param {String} optionName
 * @param {Boolean} [optional=false]
 * @returns {String | null}
 */
export const parseEnvValue = (optionName: string, optional = false) => (
  env: EnvOptions
): string | null => {
  const optionValue = env[optionName]

  if (!optionValue && !optional) {
    throw new ParseEnvRequiredError(optionName)
  }

  return optionValue !== undefined ? optionValue : null
}

/**
 * @function parseFsRead
 * @param {String} optionName
 * @param {Boolean} [optional=false]
 * @param {BufferEncoding} [encoding='utf8']
 * @returns {Buffer | String | null}
 */
export const parseFsRead = (
  optionName: string,
  optional: boolean = false,
  encoding: BufferEncoding = 'utf8'
) => (env: EnvOptions): string | Buffer | null => {
  const optionValue = parseEnvValue(optionName, optional)(env)

  return typeof optionValue === 'string'
    ? readFileSync(optionValue, encoding)
    : null
}

const DEFAULT_LIST_SEPARATOR = /\s*[,;]\s*/

/**
 * @function parseList
 * @param {String} optionName
 * @param {Boolean} [optional=false]
 * @param {String | RegExp} [separator=/\s[,;]\s/]
 * @returns {String[] | null}
 */
export const parseList = (
  optionName: string,
  optional: boolean = false,
  separator: RegExp | string = DEFAULT_LIST_SEPARATOR
) => (env: EnvOptions): string[] | null => {
  const optionValue = parseEnvValue(optionName, optional)(env)

  return typeof optionValue === 'string' ? optionValue.split(separator) : null
}

/**
 * @function parseBoolean
 * @param {String} optionName
 * @param {Boolean} [optional=false]
 * @returns {Boolean | null}
 */
export const parseBoolean = (optionName: string, optional: boolean = true) => (
  env: EnvOptions
): boolean | null => {
  const optionValue = parseEnvValue(optionName, optional)(env)

  if (optionValue === null) {
    return null
  }

  const parsedValue =
    typeof optionValue === 'string'
      ? {
          true: true,
          false: false,
        }[optionValue.toLowerCase()]
      : null

  if (typeof parsedValue !== 'boolean') {
    throw new ParseEnvInvalidInputError(optionName, optionValue, 'boolean')
  }

  return parsedValue
}

/**
 * @function parseNumber
 * @param {String} optionName
 * @param {Boolean} [optional=false]
 * @returns {Number | null}
 */
export const parseNumber = (optionName: string, optional: boolean = false) => (
  env: EnvOptions
): number | null => {
  const optionValue = parseEnvValue(optionName, optional)(env)

  if (optionValue === null) {
    return null
  }

  const parsedValue = parseFloat(optionValue)

  if (typeof parsedValue !== 'number' || isNaN(parsedValue)) {
    throw new ParseEnvInvalidInputError(optionName, optionValue, 'number')
  }

  return parsedValue
}

/**
 * @function parseJson
 * @param {String} optionName
 * @param {Boolean} [optional=false]
 * @returns {Array | PlainObject | null}
 */
export const parseJson = (optionName: string, optional: boolean = true) => (
  env: EnvOptions
): any[] | PlainObject | null => {
  const optionValue = parseEnvValue(optionName, optional)(env)

  if (typeof optionValue === 'string') {
    try {
      return JSON.parse(optionValue)
    } catch (err) {
      throw new ParseEnvInvalidInputError(
        optionName,
        optionValue,
        'json',
        err.message
      )
    }
  } else {
    return null
  }
}

const RESOLVER_FUNCTION: ResolverCandidate = [
  (value) => typeof value === 'function',
  (value, { env }) => value(env),
]

/**
 * Regular expression used to parse loader strings
 *
 * 1. the protocol
 * 2. an optional indicator that the variable is optional
 * 3. arguments string to be passed to the loader, sparated by commas
 *
 * @type {RegExp}
 */
const RESOLVER_RE = /^(.+?)(\?)?:(.+)$/

const RESOLVER_STRING: ResolverCandidate = [
  (value) => typeof value === 'string',
  (value, { env }) => {
    const match = value.match(RESOLVER_RE)

    if (!match) {
      return value
    }

    const [, resolver, _optional, optionName] = match

    const optional = _optional === '?'

    switch (resolver) {
      case 'env':
        return parseEnvValue(optionName, optional)(env)
      case 'fs':
        return parseFsRead(optionName, optional)(env)
      case 'list':
        return parseList(optionName, optional)(env)
      case 'boolean':
        return parseBoolean(optionName, optional)(env)
      case 'number':
        return parseNumber(optionName, optional)(env)
      case 'json':
        return parseJson(optionName, optional)(env)
      default:
        return value
    }
  },
]

const PARSE_ENV_RESOLVERS = [
  RESOLVER_FUNCTION,
  RESOLVER_STRING,
  arrayResolver(),
  objectResolver(),
  defaultResolver(),
]

/**
 * @function parseEnv
 * @param {PlainObject} map
 * @param {EnvOptions} [env=process.env]
 * @returns {PlainObject}
 */
export const parseEnv = (
  map: PlainObject,
  env: EnvOptions = process.env
): PlainObject =>
  nestedMap(map, {
    resolvers: PARSE_ENV_RESOLVERS,
    env,
  })
