# NGSRN Website Deployment Guide

## 🚀 Quick Deployment to Vercel (Web Interface)

Since the CLI had network issues, let's deploy using Vercel's web interface:

### Step 1: Prepare the Project
✅ **Already Done**: Project is prepared for simple deployment

### Step 2: Deploy via Vercel Web Interface

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in to your account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Choose "Import Git Repository"
   - If your code is on GitHub/GitLab, connect and select the repository
   - If not, you can drag and drop the `ngsrn-website` folder

3. **Configure Project Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (or `ngsrn-website` if uploading parent folder)
   - **Build Command**: `npm run build:simple`
   - **Output Directory**: `.next`
   - **Install Command**: `npm ci`

4. **Environment Variables** (Add these in Vercel dashboard)
   ```
   NEXT_PUBLIC_BASE_URL=https://your-project-name.vercel.app
   NEXT_PUBLIC_SITE_NAME=NextGen Sustainable Research Network
   NEXT_PUBLIC_ENABLE_CMS=false
   NEXT_PUBLIC_ENABLE_AUTH=false
   NEXT_PUBLIC_ENABLE_SEARCH=false
   NEXT_PUBLIC_ENABLE_AI=false
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at `https://your-project-name.vercel.app`

### Step 3: Custom Domain (Optional)
- In Vercel dashboard → Project Settings → Domains
- Add your custom domain (e.g., ngsrn.org)

## 🔄 Alternative: GitHub Integration

If you prefer automated deployments:

1. **Push to GitHub**
   - Create a new repository on GitHub
   - Push your `ngsrn-website` folder to the repository

2. **Connect to Vercel**
   - In Vercel dashboard, import from GitHub
   - Select your repository
   - Follow the same configuration steps above

3. **Automatic Deployments**
   - Every push to main branch will trigger a new deployment

## 📋 What's Deployed

**Current Simple Version Includes:**
- ✅ Homepage with NGSRN branding
- ✅ Research divisions overview
- ✅ Contact page
- ✅ Legal pages
- ✅ Responsive design
- ✅ New color scheme and logo system
- ✅ SEO optimization

**Not Included (for Phase 2):**
- ❌ Database-dependent features
- ❌ CMS functionality
- ❌ User authentication
- ❌ Search functionality
- ❌ AI assistant

## 🎯 Next Steps After Deployment

1. **Test the live site**
2. **Add your logo image** to `/public/logo.png`
3. **Set up Supabase database** for full features
4. **Configure Google Analytics**
5. **Add custom domain**

## 🆘 Troubleshooting

**Build Errors:**
- Check that all dependencies are installed
- Ensure environment variables are set correctly

**Deployment Issues:**
- Verify the build command is `npm run build:simple`
- Check that the output directory is `.next`

**Need Help?**
- Vercel has excellent documentation at https://vercel.com/docs
- Their support is very responsive