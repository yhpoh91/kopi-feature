import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda'
import type { Handler, Middleware } from '../types/middleware.js'
import { logger } from './logger.js'
import { ValidationError } from './validate.js'

export function createHandler(middlewares: Middleware[], main: Handler): Handler {
  return async (event: APIGatewayProxyEventV2, context: Context): Promise<APIGatewayProxyResultV2> => {
    logger.resetKeys()
    logger.setRequestContext(context.awsRequestId, process.env._X_AMZN_TRACE_ID ?? '')

    try {
      const chain = middlewares.reduceRight<Handler>(
        (next, middleware) => (e, c) => middleware(e, c, next),
        main,
      )
      return await chain(event, context)
    } catch (err) {
      if (err instanceof ValidationError) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: err.message }),
        }
      }

      const error = err instanceof Error ? err : new Error(String(err))
      logger.error('Unhandled error', { stack: error.stack })

      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Internal server error' }),
      }
    }
  }
}
