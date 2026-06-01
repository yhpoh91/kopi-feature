import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { validateBody, validateQueryParams, ValidationError } from '../../../src/lib/validate.js'

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /test',
    rawPath: '/test',
    rawQueryString: '',
    headers: {},
    requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    isBase64Encoded: false,
    ...overrides,
  } as APIGatewayProxyEventV2
}

const bodySchema = z.object({ name: z.string().min(1), age: z.number().optional() })
const querySchema = z.object({ limit: z.coerce.number().optional(), cursor: z.string().optional() })

describe('validateBody', () => {
  it('returns parsed object for valid input', () => {
    const event = makeEvent({ body: JSON.stringify({ name: 'Alice', age: 30 }) })
    expect(validateBody(bodySchema, event)).toEqual({ name: 'Alice', age: 30 })
  })

  it('strips unknown fields', () => {
    const event = makeEvent({ body: JSON.stringify({ name: 'Alice', extra: 'stripped' }) })
    const result = validateBody(bodySchema, event)
    expect(result).not.toHaveProperty('extra')
  })

  it('throws ValidationError for missing required field', () => {
    const event = makeEvent({ body: JSON.stringify({ age: 30 }) })
    expect(() => validateBody(bodySchema, event)).toThrow(ValidationError)
  })

  it('ValidationError message includes the field name', () => {
    const event = makeEvent({ body: JSON.stringify({ age: 30 }) })
    try {
      validateBody(bodySchema, event)
    } catch (err) {
      expect((err as ValidationError).message).toContain('name')
    }
  })

  it('throws ValidationError for invalid JSON body', () => {
    const event = makeEvent({ body: 'not-json' })
    expect(() => validateBody(bodySchema, event)).toThrow(ValidationError)
  })

  it('treats missing body as empty object (throws for required fields)', () => {
    const event = makeEvent({ body: undefined })
    expect(() => validateBody(bodySchema, event)).toThrow(ValidationError)
  })

  it('does not expose Zod internals in the error message', () => {
    const event = makeEvent({ body: JSON.stringify({}) })
    try {
      validateBody(bodySchema, event)
    } catch (err) {
      expect((err as ValidationError).message).not.toContain('ZodError')
      expect((err as ValidationError).message).not.toContain('_errors')
    }
  })
})

describe('validateQueryParams', () => {
  it('returns parsed params for valid input', () => {
    const event = makeEvent({ queryStringParameters: { limit: '20' } })
    expect(validateQueryParams(querySchema, event)).toEqual({ limit: 20 })
  })

  it('returns empty object when no query params are present', () => {
    const event = makeEvent({ queryStringParameters: undefined })
    expect(validateQueryParams(querySchema, event)).toEqual({})
  })

  it('throws ValidationError for invalid params', () => {
    const strictSchema = z.object({ required: z.string() })
    const event = makeEvent({ queryStringParameters: {} })
    expect(() => validateQueryParams(strictSchema, event)).toThrow(ValidationError)
  })

  it('coerces string numbers to numbers', () => {
    const event = makeEvent({ queryStringParameters: { limit: '50' } })
    const result = validateQueryParams(querySchema, event)
    expect(result.limit).toBe(50)
    expect(typeof result.limit).toBe('number')
  })
})
