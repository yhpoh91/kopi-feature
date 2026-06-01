type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

const levelPriority: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

let persistedKeys: Record<string, unknown> = {}
let currentRequestId = ''
let currentTraceId = ''

function minLevel(): LogLevel {
  return process.env.STAGE === 'prod' ? 'INFO' : 'DEBUG'
}

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[minLevel()]
}

function write(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  if (!shouldLog(level)) return

  const entry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId: currentRequestId,
    traceId: currentTraceId,
    service: 'kopi-feature',
    stage: process.env.STAGE ?? 'unknown',
    ...persistedKeys,
    ...extra,
  }

  process.stdout.write(JSON.stringify(entry) + '\n')
}

export const logger = {
  info(message: string, extra?: Record<string, unknown>): void {
    write('INFO', message, extra)
  },
  warn(message: string, extra?: Record<string, unknown>): void {
    write('WARN', message, extra)
  },
  error(message: string, extra?: Record<string, unknown>): void {
    write('ERROR', message, extra)
  },
  debug(message: string, extra?: Record<string, unknown>): void {
    write('DEBUG', message, extra)
  },
  appendKeys(fields: Record<string, unknown>): void {
    persistedKeys = { ...persistedKeys, ...fields }
  },
  resetKeys(): void {
    persistedKeys = {}
  },
  setRequestContext(requestId: string, traceId: string): void {
    currentRequestId = requestId
    currentTraceId = traceId
  },
}
