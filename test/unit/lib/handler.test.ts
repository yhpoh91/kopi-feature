import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda'
import { createHandler } from '../../../src/lib/handler.js'
import type { Handler, Middleware } from '../../../src/types/middleware.js'
import { ValidationError } from '../../../src/lib/validate.js'

const mockContext: Context = {
  awsRequestId: 'test-request-id',
  functionName: 'test-function',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:ap-southeast-1:123456789012:function:test',
  memoryLimitInMB: '256',
  logGroupName: '/aws/lambda/test',
  logStreamName: '2026/06/01/[$LATEST]test',
  getRemainingTimeInMillis: () => 5000,
  done: vi.fn(),
  fail: vi.fn(),
  succeed: vi.fn(),
  callbackWaitsForEmptyEventLoop: false,
}

const mockEvent = {
  version: '2.0',
  routeKey: 'GET /test',
  rawPath: '/test',
  rawQueryString: '',
  headers: {},
  requestContext: {} as APIGatewayProxyEventV2['requestContext'],
  isBase64Encoded: false,
} as APIGatewayProxyEventV2

type StructuredResult = { statusCode: number; body: string; headers?: Record<string, string> }

beforeEach(() => {
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createHandler', () => {
  describe('error boundary', () => {
    it('returns 500 with safe message for unhandled errors', async () => {
      const handler: Handler = async () => {
        throw new Error('database connection failed — secret detail')
      }
      const result = (await createHandler([], handler)(mockEvent, mockContext)) as StructuredResult
      expect(result.statusCode).toBe(500)
      expect(JSON.parse(result.body)).toEqual({ error: 'Internal server error' })
    })

    it('does not expose internal error details in 500 response', async () => {
      const handler: Handler = async () => {
        throw new Error('secret internal detail')
      }
      const result = (await createHandler([], handler)(mockEvent, mockContext)) as StructuredResult
      expect(result.body).not.toContain('secret internal detail')
    })

    it('returns 400 with message for ValidationError', async () => {
      const handler: Handler = async () => {
        throw new ValidationError('name: Required')
      }
      const result = (await createHandler([], handler)(mockEvent, mockContext)) as StructuredResult
      expect(result.statusCode).toBe(400)
      expect(JSON.parse(result.body)).toEqual({ error: 'name: Required' })
    })

    it('handles non-Error throws gracefully', async () => {
      const handler: Handler = async () => {
        throw 'string error'
      }
      const result = (await createHandler([], handler)(mockEvent, mockContext)) as StructuredResult
      expect(result.statusCode).toBe(500)
    })
  })

  describe('middleware chain', () => {
    it('executes middlewares in array order before the main handler', async () => {
      const order: string[] = []
      const mw1: Middleware = async (e, c, next) => { order.push('mw1'); return next(e, c) }
      const mw2: Middleware = async (e, c, next) => { order.push('mw2'); return next(e, c) }
      const main: Handler = async () => { order.push('main'); return { statusCode: 200, body: '' } }

      await createHandler([mw1, mw2], main)(mockEvent, mockContext)
      expect(order).toEqual(['mw1', 'mw2', 'main'])
    })

    it('short-circuits when a middleware returns without calling next', async () => {
      const mainSpy = vi.fn(async () => ({ statusCode: 200, body: '' }))
      const blockingMw: Middleware = async () => ({ statusCode: 403, body: '{}' })

      const result = (await createHandler([blockingMw], mainSpy)(mockEvent, mockContext)) as StructuredResult
      expect(result.statusCode).toBe(403)
      expect(mainSpy).not.toHaveBeenCalled()
    })

    it('passes event and context through to the main handler', async () => {
      let receivedEvent: APIGatewayProxyEventV2 | undefined
      const main: Handler = async (e) => { receivedEvent = e; return { statusCode: 200, body: '' } }

      await createHandler([], main)(mockEvent, mockContext)
      expect(receivedEvent).toBe(mockEvent)
    })

    it('works with no middlewares', async () => {
      const main: Handler = async () => ({ statusCode: 204, body: '' })
      const result = (await createHandler([], main)(mockEvent, mockContext)) as StructuredResult
      expect(result.statusCode).toBe(204)
    })
  })
})
