import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda'
import { handler } from '../../../src/handlers/health.js'

const mockEvent: APIGatewayProxyEventV2 = {
  version: '2.0',
  routeKey: 'GET /health',
  rawPath: '/health',
  rawQueryString: '',
  headers: { host: 'feature.kopi.life' },
  requestContext: {
    accountId: '123456789012',
    apiId: 'test-api',
    domainName: 'feature.kopi.life',
    domainPrefix: 'feature',
    http: { method: 'GET', path: '/health', protocol: 'HTTP/1.1', sourceIp: '1.2.3.4', userAgent: 'test' },
    requestId: 'test-request',
    routeKey: 'GET /health',
    stage: '$default',
    time: '01/Jun/2026:00:00:00 +0000',
    timeEpoch: 1748736000000,
  },
  isBase64Encoded: false,
}

const mockContext: Context = {
  awsRequestId: 'test-request-id',
  functionName: 'kopi-feature-preview-health',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:ap-southeast-1:123456789012:function:kopi-feature-preview-health',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/kopi-feature-preview-health',
  logStreamName: '2026/06/01/[$LATEST]test',
  getRemainingTimeInMillis: () => 5000,
  done: vi.fn(),
  fail: vi.fn(),
  succeed: vi.fn(),
  callbackWaitsForEmptyEventLoop: false,
}

type StructuredResult = { statusCode: number; body: string; headers?: Record<string, string> }

beforeEach(() => {
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  process.env.STAGE = 'preview'
})

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.STAGE
})

describe('GET /health', () => {
  it('returns HTTP 200', async () => {
    const result = (await handler(mockEvent, mockContext)) as StructuredResult
    expect(result.statusCode).toBe(200)
  })

  it('returns status ok', async () => {
    const result = (await handler(mockEvent, mockContext)) as StructuredResult
    const body = JSON.parse(result.body) as { status: string; stage: string }
    expect(body.status).toBe('ok')
  })

  it('includes the current stage in the response body', async () => {
    process.env.STAGE = 'preview'
    const result = (await handler(mockEvent, mockContext)) as StructuredResult
    const body = JSON.parse(result.body) as { status: string; stage: string }
    expect(body.stage).toBe('preview')
  })

  it('returns Content-Type application/json', async () => {
    const result = (await handler(mockEvent, mockContext)) as StructuredResult
    expect(result.headers?.['Content-Type']).toBe('application/json')
  })

  it('returns valid JSON body', async () => {
    const result = (await handler(mockEvent, mockContext)) as StructuredResult
    expect(() => JSON.parse(result.body)).not.toThrow()
  })
})
