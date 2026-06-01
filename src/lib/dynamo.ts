import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import AWSXRay from 'aws-xray-sdk-core'

const rawClient = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'ap-southeast-1' })

const tracedClient = AWSXRay.captureAWSv3Client(rawClient) as DynamoDBClient

export const dynamo = DynamoDBDocumentClient.from(tracedClient, {
  marshallOptions: { removeUndefinedValues: true },
})

export const TABLE_NAME = process.env.TABLE_NAME ?? ''
