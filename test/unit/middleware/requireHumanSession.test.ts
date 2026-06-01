import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda'
import { requireHumanSession } from '../../../src/middleware/requireHumanSession.js'

const mockEvent = {} as APIGatewayProxyEventV2
const mockContext = { awsRequestId: 'test' } as unknown as Context
const mockNext = vi.fn()

type StructuredResult = { statusCode: number; body: string }

beforeEach(() => {
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  mockNext.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('requireHumanSession', () => {
  it('returns 501 Not Implemented', async () => {
    const result = (await requireHumanSession(mockEvent, mockContext, mockNext)) as StructuredResult
    expect(result.statusCode).toBe(501)
    expect(JSON.parse(result.body)).toEqual({ error: 'Not implemented' })
  })

  it('does not call next', async () => {
    await requireHumanSession(mockEvent, mockContext, mockNext)
    expect(mockNext).not.toHaveBeenCalled()
  })

  it('logs a WARN containing "not yet implemented"', async () => {
    await requireHumanSession(mockEvent, mockContext, mockNext)
    const spy = process.stdout.write as unknown as { mock: { calls: unknown[][] } }
    const entries = spy.mock.calls.map((c) => JSON.parse(c[0] as string) as Record<string, unknown>)
    const warnEntry = entries.find((e) => e.level === 'WARN')
    expect(warnEntry).toBeDefined()
    expect(warnEntry?.message as string).toMatch(/not yet implemented/i)
  })
})
