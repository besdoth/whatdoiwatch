# Deploying to Cloudflare Pages

## One-time setup

1. Install Wrangler globally (if not already):
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. Create a Trakt app at https://trakt.tv/oauth/applications
   - Set the redirect URI to: `https://your-site.pages.dev/api/auth/callback/trakt`

3. Create the Cloudflare Pages project (first deploy only):
   ```bash
   npm run pages:build
   wrangler pages deploy .vercel/output/static --project-name whatdoiwatch
   ```

4. Set your environment variables as Cloudflare secrets:
   ```bash
   wrangler pages secret put TRAKT_CLIENT_ID
   wrangler pages secret put TRAKT_CLIENT_SECRET
   wrangler pages secret put NEXTAUTH_SECRET   # openssl rand -base64 32
   wrangler pages secret put ANTHROPIC_API_KEY
   wrangler pages secret put NEXTAUTH_URL      # https://your-site.pages.dev
   ```

## Subsequent deploys

```bash
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name whatdoiwatch
```

## Connect via GitHub (recommended for auto-deploys)

In the Cloudflare dashboard → Pages → your project → Settings → Git integration.
Set the build command to:
```
npx @cloudflare/next-on-pages
```
And output directory to:
```
.vercel/output/static
```
Then add your secrets in Settings → Environment variables.
