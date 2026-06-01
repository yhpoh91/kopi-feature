import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logger } from '../../../src/lib/logger.js'

type WriteMock = { mock: { calls: unknown[][] } }

function stdoutMock(): WriteMock {
  return process.stdout.write as unknown as WriteMock
}

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    logger.resetKeys()
    logger.setRequestContext('test-request-id', 'test-trace-id')
    process.env.STAGE = 'preview'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.STAGE
  })

  function getLastEntry(): Record<string, unknown> {
    const calls = stdoutMock().mock.calls
    return JSON.parse(calls[calls.length - 1][0] as string) as Record<string, unknown>
  }

  describe('output format', () => {
    it('writes valid JSON to stdout', () => {
      logger.info('test message')
      expect(stdoutMock().mock.calls.length).toBe(1)
      const entry = getLastEntry()
      expect(entry.level).toBe('INFO')
      expect(entry.message).toBe('test message')
      expect(entry.service).toBe('kopi-feature')
    })

    it('includes all required fields', () => {
      logger.info('test message')
      const entry = getLastEntry()
      expect(entry).toMatchObject({
        level: 'INFO',
        message: 'test message',
        service: 'kopi-feature',
        requestId: 'test-request-id',
        traceId: 'test-trace-id',
        stage: 'preview',
      })
      expect(typeof entry.timestamp).toBe('string')
      expect(entry.timestamp as string).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('ends each entry with a newline', () => {
      logger.info('test')
      const written = stdoutMock().mock.calls[0][0] as string
      expect(written.endsWith('\n')).toBe(true)
    })

    it('writes to stdout only, never stderr', () => {
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
      logger.info('test')
      expect(stdoutMock().mock.calls.length).toBeGreaterThan(0)
      expect(stderrSpy).not.toHaveBeenCalled()
      stderrSpy.mockRestore()
    })

    it('merges inline extra fields at the top level', () => {
      logger.info('test', { userId: 'sub123', count: 5 })
      const entry = getLastEntry()
      expect(entry.userId).toBe('sub123')
      expect(entry.count).toBe(5)
    })
  })

  describe('log levels', () => {
    it('writes INFO level', () => {
      logger.info('msg')
      expect(getLastEntry().level).toBe('INFO')
    })

    it('writes WARN level', () => {
      logger.warn('msg')
      expect(getLastEntry().level).toBe('WARN')
    })

    it('writes ERROR level', () => {
      logger.error('msg')
      expect(getLastEntry().level).toBe('ERROR')
    })

    it('writes DEBUG level in preview', () => {
      process.env.STAGE = 'preview'
      logger.debug('debug msg')
      expect(stdoutMock().mock.calls.length).toBeGreaterThan(0)
      expect(getLastEntry().level).toBe('DEBUG')
    })

    it('suppresses DEBUG in prod', () => {
      process.env.STAGE = 'prod'
      logger.debug('debug msg')
      expect(stdoutMock().mock.calls.length).toBe(0)
    })

    it('writes INFO in prod', () => {
      process.env.STAGE = 'prod'
      logger.info('msg')
      expect(stdoutMock().mock.calls.length).toBeGreaterThan(0)
    })
  })

  describe('appendKeys', () => {
    it('persists keys to subsequent log calls', () => {
      logger.appendKeys({ userId: 'user-1', appId: 'app-1' })
      logger.info('msg 1')
      logger.info('msg 2')

      const calls = stdoutMock().mock.calls.map((c) => JSON.parse(c[0] as string) as Record<string, unknown>)
      expect(calls[0].userId).toBe('user-1')
      expect(calls[0].appId).toBe('app-1')
      expect(calls[1].userId).toBe('user-1')
      expect(calls[1].appId).toBe('app-1')
    })

    it('merges multiple appendKeys calls', () => {
      logger.appendKeys({ a: 1 })
      logger.appendKeys({ b: 2 })
      logger.info('msg')
      const entry = getLastEntry()
      expect(entry.a).toBe(1)
      expect(entry.b).toBe(2)
    })
  })

  describe('resetKeys', () => {
    it('clears all persisted keys', () => {
      logger.appendKeys({ userId: 'user-1' })
      logger.resetKeys()
      logger.info('msg')
      const entry = getLastEntry()
      expect(entry.userId).toBeUndefined()
    })
  })

  describe('setRequestContext', () => {
    it('updates requestId and traceId for subsequent log calls', () => {
      logger.setRequestContext('new-request', 'new-trace')
      logger.info('msg')
      const entry = getLastEntry()
      expect(entry.requestId).toBe('new-request')
      expect(entry.traceId).toBe('new-trace')
    })
  })
})
