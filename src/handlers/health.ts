import type { APIGatewayProxyResultV2 } from 'aws-lambda'
import { createHandler } from '../lib/handler.js'
import type { Handler } from '../types/middleware.js'

const healthFn: Handler = async (): Promise<APIGatewayProxyResultV2> => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ok', stage: process.env.STAGE ?? 'unknown' }),
  }
}

export const handler = createHandler([], healthFn)
