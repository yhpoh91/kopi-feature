import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { type ZodSchema, ZodError } from 'zod'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateBody<T>(schema: ZodSchema<T>, event: APIGatewayProxyEventV2): T {
  let raw: unknown
  try {
    raw = JSON.parse(event.body ?? '{}')
  } catch {
    throw new ValidationError('Request body must be valid JSON')
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new ValidationError(formatZodError(result.error))
  }
  return result.data
}

export function validateQueryParams<T>(schema: ZodSchema<T>, event: APIGatewayProxyEventV2): T {
  const raw = event.queryStringParameters ?? {}
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new ValidationError(formatZodError(result.error))
  }
  return result.data
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
    .join('; ')
}
