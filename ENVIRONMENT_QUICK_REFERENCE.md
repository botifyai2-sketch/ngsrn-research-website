# Environment Variables Quick Reference

## Simple Deployment (Static Site)

### Required
```bash
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_NAME="Your Site Name"
```

### Feature Flags
```bash
NEXT_PUBLIC_ENABLE_CMS="false"
NEXT_PUBLIC_ENABLE_AUTH="false"
NEXT_PUBLIC_ENABLE_SEARCH="false"
NEXT_PUBLIC_ENABLE_AI="false"
NEXT_PUBLIC_ENABLE_MEDIA="false"
```

## Full Deployment (Complete Application)

### Required
```bash
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
NEXT_PUBLIC_SITE_NAME="Your Site Name"
DATABASE_URL="postgresql://user:pass@host:5432/db"
DIRECT_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://yourdomain.com"
```

### Feature Flags
```bash
NEXT_PUBLIC_ENABLE_CMS="true"
NEXT_PUBLIC_ENABLE_AUTH="true"
NEXT_PUBLIC_ENABLE_SEARCH="true"
NEXT_PUBLIC_ENABLE_AI="true"
NEXT_PUBLIC_ENABLE_MEDIA="true"
```

### Optional
```bash
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
GEMINI_API_KEY="your-api-key"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket"
REDIS_URL="redis://host:6379"
ELASTICSEARCH_URL="https://host:9200"
```

## Validation Commands

```bash
# Validate environment
node scripts/env-config.js validate

# Auto-fix issues
node scripts/validate-build.js --auto-fix

# Generate environment file
node scripts/env-config.js generate simple
```
