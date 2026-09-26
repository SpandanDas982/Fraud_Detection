# Deployment and Environments

## Environments

| Environment | Frontend | Backend/data | Evidence |
|---|---|---|---|
| Local mock | Vite dev | mock service | committed synthetic fixtures |
| Local live | Vite dev | deployed dev AWS | synthetic only |
| Preview | Vercel preview | dev AWS | synthetic only |
| Production demo | Vercel production | demo AWS stack | synthetic only |

Do not create a real-data production claim.

## Frontend — Vercel

- Build React/Vite SPA.
- Public configuration: API base URL and safe feature flags only.
- Configure SPA rewrites if using client routes.
- Set allowed API/S3 origins to exact deployed domains; preview-domain strategy must be explicit.
- Never expose AWS or Sarvam secrets through `VITE_*` variables.
- Mock mode should remain selectable at build/runtime through a safe flag.

## Backend — AWS SAM

SAM template should define:

- API Gateway HTTP API;
- Case/API Lambda;
- Processing Lambda with raw S3 event filter;
- Export Lambda;
- private S3 evidence bucket, encryption, CORS, lifecycle, notification;
- DynamoDB table with TTL;
- least-privilege roles/policies;
- log groups/retention;
- environment parameters and outputs.

Avoid adding Step Functions, SQS, Cognito, CloudFront, custom domains, KMS CMKs, VPCs, or WAF unless an observed requirement justifies them.

## Manual configuration gates

- AWS account and deployment role;
- selected Region;
- Nova Lite/Micro model IDs or inference profiles and access;
- Sarvam secret/endpoint/quota;
- Vercel project and origins;
- retention interval;
- file/page/audio/token limits;
- cost budget/alarms if required.

## Deployment sequence

1. Frontend mock: install, test, build, Vercel preview.
2. Validate SAM template and inspect IAM/resource diff.
3. Deploy dev stack.
4. Configure secrets outside repository.
5. Smoke case API and presigned upload with synthetic file.
6. Enable/test each provider adapter independently.
7. Connect frontend live client.
8. Run synthetic end-to-end smoke.
9. Deploy demo frontend/backend with exact origins.
10. Record versions/endpoints/results without secrets.

## Rollback

- Frontend: redeploy previous known-good Vercel deployment.
- Backend code: deploy previous SAM artifact/template version.
- Schema: prefer backward-compatible additive changes; breaking changes require a migration plan before deployment.
- Do not delete evidence/data resources automatically during a rollback.

## Observability

Structured logs: request ID, opaque entity ID, handler, duration, state transition, error code, provider/model ID.  
Metrics: invocation/error/throttle/duration, source outcome by modality, provider timeout/schema failure, export outcome.  
No raw evidence, transcripts, identifiers, prompts, provider payloads, or signed URLs.

## Smoke checklist

- Vercel app loads and mock path works.
- API health/basic case creation succeeds.
- CORS permits only intended origin.
- S3 upload succeeds but object is not public.
- processing produces ready/partial state idempotently.
- review version conflict behaves safely.
- CSV/PDF generate and short-lived download works.
- raw logs contain no planted secrets.
