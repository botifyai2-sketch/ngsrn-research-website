# Database Setup and Schema

This document describes the database schema and setup for the NGSRN Research Website.

## Database Schema Overview

The database is designed to support a research article website with the following core entities:

### Core Tables

1. **Users** - CMS user accounts with role-based access
2. **Authors** - Research authors and leadership team members
3. **Research Divisions** - Thematic research areas aligned with SDGs
4. **Articles** - Research articles and publications
5. **Media Files** - Images, documents, and other media assets

### Junction Tables

- **Article Authors** - Many-to-many relationship between articles and authors
- **Author Divisions** - Many-to-many relationship between authors and research divisions
- **Article Media** - Many-to-many relationship between articles and media files

## Key Features

### Research Divisions
- 5 predefined divisions aligned with UN SDGs
- Each division has a color scheme and icon for UI consistency
- SDG alignment stored as JSON for flexibility

### Articles
- Support for draft, published, and scheduled statuses
- SEO metadata fields for search optimization
- Tags and keywords stored as JSON arrays
- Estimated read time calculation
- Optional downloadable document URLs

### Authors
- Leadership team flag for special display
- LinkedIn profile integration
- Multiple research division affiliations

### Media Management
- File metadata tracking (size, type, original name)
- Alt text for accessibility
- Flexible association with articles

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Environment Setup

Create a `.env` file with:

```env
DATABASE_URL="file:./dev.db"
```

For production, use PostgreSQL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ngsrn_db"
```

## Initial Data

The seed script creates:
- 5 research divisions with SDG alignments
- 5 leadership team members
- 1 admin user account

## Data Access Patterns

### Service Layer
- `src/lib/db/articles.ts` - Article queries and operations
- `src/lib/db/authors.ts` - Author and leadership queries
- `src/lib/db/divisions.ts` - Research division operations
- `src/lib/db/transforms.ts` - JSON field transformations

### Type Safety
- Prisma generates TypeScript types automatically
- Custom types in `src/types/index.ts` handle JSON field transformations
- Transform functions ensure type safety between database and application layers

## Migration Strategy

1. **Development**: Use SQLite for local development
2. **Production**: PostgreSQL with proper array types
3. **Schema Changes**: Always create migrations for schema updates
4. **Data Migrations**: Use seed scripts for reference data updates

## Performance Considerations

- Indexes on frequently queried fields (email, slug, status)
- Cascade deletes for referential integrity
- JSON fields for flexible array storage (SQLite compatibility)
- Proper foreign key relationships for data consistency