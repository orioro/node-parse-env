export class ParseEnvError extends Error {
  code: string
}

export const PARSE_ENV_REQUIRED_ERROR = 'PARSE_ENV_REQUIRED_ERROR'

export class ParseEnvRequiredError extends ParseEnvError {
  constructor(optionName: string) {
    super(`env.${optionName} must be defined`)

    this.code = PARSE_ENV_REQUIRED_ERROR
  }
}

export const PARSE_ENV_INVALID_INPUT_ERROR = 'PARSE_ENV_INVALID_INPUT_ERROR'

export class ParseEnvInvalidInputError extends ParseEnvError {
  constructor(
    optionName: string,
    optionValue: any, // eslint-disable-line @typescript-eslint/explicit-module-boundary-types
    expectedType: string,
    message?: string
  ) {
    super(
      `Invalid '${expectedType}' env.${optionName}: ${optionValue}${
        message ? ' - ' + message : ''
      }`
    )

    this.code = PARSE_ENV_INVALID_INPUT_ERROR
  }
}
