# process-image Lambda

Triggered by `s3:ObjectCreated:*` on `nzinga-talent-os-media`. Writes:

- `thumbnails/{original-stem}.webp` — 200×200 cover crop
- `thumbnails/{original-stem}_lg.webp` — max 800px WebP

Skips `thumbnails/` (avoids loops), PDFs, videos, GIFs, and SVGs.

## Package for Amazon Linux

Sharp must be compiled for Lambda’s OS, not Windows:

```bash
cd aws/process-image
npm ci
npm install --os=linux --cpu=x64 --libc=glibc sharp
zip -r function.zip index.mjs package.json node_modules
```

On Windows (from `aws/process-image`):

```powershell
npm install --omit=dev
npm install --omit=dev --os=linux --cpu=x64 --libc=glibc sharp
tar.exe -a -c -f function.zip index.mjs package.json node_modules
```

## Deploy

See [S3_SETUP.md](../../S3_SETUP.md) Step 5.
