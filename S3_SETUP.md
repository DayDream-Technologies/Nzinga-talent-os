# Amazon S3 media setup — Nzinga Talent OS

Photos and documents upload to a private S3 bucket via **presigned PUT URLs** from the `s3-upload-url` Supabase Edge Function. CloudFront serves reads. Auth stays on Supabase.

Training videos remain in the Supabase `training-videos` bucket.

**PowerShell:** use the one-line commands below. Bash-style `\` line breaks are not valid in PowerShell.

Run every `aws` command from the **repo root** so `file://aws/...` paths resolve.

## Prerequisites

- AWS CLI configured (`aws configure`) with permission to create S3, IAM, CloudFront, and Lambda
- Supabase CLI (`npx supabase`) and a linked project
- Bucket region should match Amplify (typically `us-east-1`)

If `aws` is not recognized in Cursor, restart Cursor or run:

```powershell
$env:PATH = "$env:LOCALAPPDATA\Programs\Amazon\AWSCLIV2;" + $env:PATH
```

## Step 1 — S3 bucket

```powershell
aws s3api create-bucket --bucket nzinga-talent-os-media --region us-east-1
aws s3api put-public-access-block --bucket nzinga-talent-os-media --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-encryption --bucket nzinga-talent-os-media --server-side-encryption-configuration file://aws/s3-encryption.json
aws s3api put-bucket-lifecycle-configuration --bucket nzinga-talent-os-media --lifecycle-configuration file://aws/s3-lifecycle.json
```

Lifecycle moves objects into Intelligent-Tiering (Frequent / Infrequent Access only). IDs, contracts, and other files stay immediately readable — there is no 90-day archive freeze.

## Step 2 — CORS

```powershell
aws s3api put-bucket-cors --bucket nzinga-talent-os-media --cors-configuration file://aws/s3-cors.json
```

Add extra Amplify preview origins to `[aws/s3-cors.json](aws/s3-cors.json)` if needed, then re-apply.

## Step 3 — CloudFront + Origin Access Control

OAC is not on the S3 bucket page. Open CloudFront:

[https://console.aws.amazon.com/cloudfront/v4/home](https://console.aws.amazon.com/cloudfront/v4/home)

Create it while creating the distribution. The new wizard does not show a field named “Origin access.”

1. Left nav → **Distributions** → **Create distribution**.
2. **Origin domain:** pick `nzinga-talent-os-media.s3.us-east-1.amazonaws.com`  
   (REST endpoint, **not** the website endpoint `s3-website-...`).
3. Leave **Origin path** empty.
4. Check **Allow private S3 bucket access to CloudFront** (that *is* OAC). CloudFront will create the control and update the bucket policy.
5. **Viewer protocol policy:** Redirect HTTP to HTTPS.
6. **Cache policy:** CachingOptimized. Allowed methods: GET, HEAD.
7. Leave Origin Shield and origin mutual TLS off.
8. Create the distribution.

After create, CloudFront shows a banner to **copy the S3 bucket policy**. Apply it (S3 → bucket → Permissions → Bucket policy). It grants `s3:GetObject` only to this distribution.

Distribution domain (`dxxxx.cloudfront.net`) is `VITE_CDN_URL` / `CDN_URL`. Do not make the bucket public.

## Step 4 — IAM user for Edge Functions

```powershell
aws iam create-user --user-name nto-s3-edge
aws iam put-user-policy --user-name nto-s3-edge --policy-name nto-s3-access --policy-document file://aws/iam-s3-edge-policy.json
aws iam create-access-key --user-name nto-s3-edge
```

Save `AccessKeyId` and `SecretAccessKey` in `.env.secrets` (never Amplify `VITE_*` vars).

## Step 5 — process-image Lambda

Build `aws/process-image/function.zip` first (Sharp must be the Linux build). From repo root:

```powershell
cd aws/process-image
npm install --omit=dev
npm install --omit=dev --os=linux --cpu=x64 --libc=glibc sharp
tar.exe -a -c -f function.zip index.mjs package.json node_modules
cd ../..
```

Then deploy (account `851725188290`):

```powershell
aws iam create-role --role-name nto-process-image-role --assume-role-policy-document file://aws/iam-lambda-trust.json
aws iam put-role-policy --role-name nto-process-image-role --policy-name nto-process-image --policy-document file://aws/iam-lambda-process-image-policy.json
aws lambda create-function --function-name nto-process-image --runtime nodejs20.x --handler index.handler --timeout 60 --memory-size 1024 --role arn:aws:iam::851725188290:role/nto-process-image-role --zip-file fileb://aws/process-image/function.zip


aws s3api put-bucket-notification-configuration --bucket nzinga-talent-os-media --notification-configuration file://aws/s3-lambda-notification.json
```

## Step 6 — Supabase secrets

Copy `[.env.secrets.example](.env.secrets.example)` → `.env.secrets` and fill AWS values, then:

```powershell
.\scripts\set-supabase-secrets.ps1
```

Or:

```powershell
npx supabase secrets set AWS_ACCESS_KEY_ID=AKIA...
npx supabase secrets set AWS_SECRET_ACCESS_KEY=...
npx supabase secrets set AWS_REGION=us-east-1
npx supabase secrets set S3_BUCKET=nzinga-talent-os-media
npx supabase secrets set CDN_URL=https://dxxxx.cloudfront.net
```

## Step 7 — Deploy the Edge Function

```powershell
npx supabase functions deploy s3-upload-url
```

`npm run supabase:deploy` includes this function.

## Step 8 — Amplify env

In Amplify → Environment variables:


| Variable         | Example                                            |
| ---------------- | -------------------------------------------------- |
| `VITE_CDN_URL`   | `https://dxxxx.cloudfront.net` (no trailing slash) |
| `VITE_S3_REGION` | `us-east-1`                                        |


Redeploy the frontend after saving.

Local `.env`:

```
VITE_CDN_URL=https://dxxxx.cloudfront.net
VITE_S3_REGION=us-east-1
```

## Key layout

```
talents/{talentId}/profile/
talents/{talentId}/documents/
talents/{talentId}/media/
talents/{talentId}/contracts/
applications/{appId}/{fieldId}/
guardian/{profileId}/
agency/{id}/contracts/
agency/{id}/invoices/
thumbnails/...          (Lambda output)
```

Metadata stored in Supabase is an `s3:{key}` string plus optional `cdnUrl` / `thumbnailUrl` — not file bytes.

## Demo / local without AWS

When `VITE_DEMO_MODE=true` (or Supabase env is unset), uploads still embed as data URLs so the UI works without credentials.

## Smoke test

1. Staff login → talent record → crop and save a profile photo → image loads from CloudFront.
2. Documents tab → upload a PDF → View opens in DocViewer.
3. `/portal` → log in → upload a headshot (cropper) → autosave keeps an `s3:` ref.
4. Guardian verify → upload ID (not base64 in the network payload of `guardian_profiles`).
5. Confirm S3 has objects under the prefixes above and `thumbnails/` shortly after an image upload.

