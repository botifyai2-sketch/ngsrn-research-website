
# NGSRN Website Deployment Instructions

## Phase: SIMPLE

### Prerequisites
- Vercel CLI installed: `npm install -g vercel`
- Vercel account created and logged in: `vercel login`

### Environment Variables
Set these in your Vercel dashboard (Project Settings > Environment Variables):

#### Required Variables:
- NEXT_PUBLIC_BASE_URL: Your Vercel app URL (e.g., https://your-app.vercel.app)
- NEXT_PUBLIC_SITE_NAME: NextGen Sustainable Research Network

#### Feature Flags (for simple deployment):
- NEXT_PUBLIC_ENABLE_CMS: false
- NEXT_PUBLIC_ENABLE_AUTH: false
- NEXT_PUBLIC_ENABLE_SEARCH: false
- NEXT_PUBLIC_ENABLE_AI: false
- NEXT_PUBLIC_ENABLE_MEDIA: false

#### Optional Variables:
- NEXT_PUBLIC_GA_ID: Your Google Analytics 4 measurement ID



### Deployment Steps:

1. **Prepare Environment**
   ```bash
   npm run env:prepare:simple
   ```

2. **Validate Configuration**
   ```bash
   npm run build:validate
   ```

3. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

4. **Verify Deployment**
   - Check that your site loads at the Vercel URL
   - Test navigation and core functionality
   - Verify analytics tracking (if configured)

### Troubleshooting:
- If build fails, check environment variables in Vercel dashboard
- For feature-related issues, verify feature flags are set correctly
- Check Vercel function logs for runtime errors

### Next Steps:

- To enable full features, prepare for full deployment:
  `npm run env:prepare:full`
- Set up Supabase database
- Configure authentication


Generated on: 2025-09-30T09:47:04.271Z
