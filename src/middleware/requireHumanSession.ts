import type { Middleware } from '../types/middleware.js'
import { logger } from '../lib/logger.js'

export const requireHumanSession: Middleware = async (_event, _context, _next) => {
  logger.warn('Auth middleware not yet implemented')
  return {
    statusCode: 501,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not implemented' }),
  }
}
