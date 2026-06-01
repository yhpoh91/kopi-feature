# Runbook

## Check service health

```bash
curl https://feature.kopi.life/health
# Expected: {"status":"ok","stage":"prod"}

curl https://feature-preview.kopi.life/health
# Expected: {"status":"ok","stage":"preview"}
```

Check CloudWatch for Lambda errors:
```
Log group: /aws/lambda/kopi-feature-prod-health
Filter:    { $.level = "ERROR" }
```

## Roll back a deployment

Serverless Framework keeps CloudFormation stack history. To roll back to the previous version:

1. Find the previous deployment in the AWS CloudFormation console under the `kopi-feature-prod` stack.
2. Or use the Serverless Framework rollback command:
   ```bash
   npx serverless rollback --stage prod
   ```
3. To roll back to a specific timestamp:
   ```bash
   npx serverless rollback --stage prod --timestamp <timestamp>
   ```

## Trigger a migration manually

Migrations are run via the GitHub Actions `Migrate DB` workflow:

1. Go to **Actions → Migrate DB → Run workflow**
2. Select stage: `preview` or `prod`
3. Set `allow_destructive` only if the migration requires dropping/truncating data (confirm with the engineer first)

To run locally (with AWS credentials configured):
```bash
npm run migrate:prod    # or migrate:preview
```

## Inspect DLQ messages

*(No DLQs are configured in Milestone 1 — this section will be updated as background job queues are added.)*

General approach:
1. Open **SQS → [queue-name]-dlq** in the AWS console
2. Use **Send and receive messages → Poll for messages** to inspect
3. After triaging, reprocess or purge as appropriate

## Rotate secrets

Secrets are stored in AWS Secrets Manager under the path `kopi-feature/<stage>/<secret-name>`.

To rotate a secret:
1. Update the secret value in Secrets Manager via the AWS console or CLI:
   ```bash
   aws secretsmanager update-secret \
     --secret-id kopi-feature/prod/<secret-name> \
     --secret-string '<new-value>' \
     --region ap-southeast-1
   ```
2. The change takes effect on the next Lambda cold start. To force immediate pickup, redeploy:
   ```bash
   npx serverless deploy --stage prod
   ```
3. **Do not** update GitHub Secrets for the new value — GitHub Secrets only hold the initial value for Secrets Manager bootstrapping. The authoritative value is in Secrets Manager.
