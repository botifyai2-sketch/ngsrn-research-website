# NGSRN Research Website

A comprehensive digital platform for the NextGen Sustainable Research Network (NGSRN) showcasing policy-focused research that shapes sustainable futures for Africa.

## Features

- 🎨 Modern, responsive design with NGSRN branding
- 📚 Research article management and display
- 🔍 AI-powered search and summarization
- 🤖 Gemini-powered research assistant
- 👥 Leadership team profiles
- 📊 Research division organization
- 🔐 Secure content management system
- ♿ WCAG 2.1 AA accessibility compliance
- 🚀 Optimized performance and SEO

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: Google Gemini API
- **Search**: Elasticsearch
- **Storage**: AWS S3
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ngsrn-website
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## GitHub Upload

To upload your NGSRN website project to GitHub:

### Quick Upload (Interactive)
```bash
# Interactive upload with guided setup
node scripts/interactive-github-upload.js
```

### Automated Upload
```bash
# Direct upload with parameters
node scripts/github-upload-complete.js --repository-url https://github.com/username/ngsrn-website.git
```

### Prerequisites for GitHub Upload
- GitHub repository created
- Personal Access Token with `repo` scope
- Git configured with your credentials

📖 **Complete Guide**: See [GITHUB_UPLOAD_GUIDE.md](./GITHUB_UPLOAD_GUIDE.md) for detailed instructions  
⚡ **Quick Reference**: See [GITHUB_UPLOAD_QUICK_REFERENCE.md](./GITHUB_UPLOAD_QUICK_REFERENCE.md) for commands

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── admin/          # CMS admin pages
│   ├── research/       # Research division pages
│   ├── leadership/     # Leadership team pages
│   ├── search/         # Search functionality
│   └── articles/       # Article pages
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   ├── layout/        # Layout components
│   ├── forms/         # Form components
│   ├── search/        # Search components
│   ├── articles/      # Article components
│   ├── cms/           # CMS components
│   └── ai/            # AI assistant components
├── lib/               # Utility libraries
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # Additional styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the established ESLint and Prettier configuration
- Use meaningful component and variable names
- Write JSDoc comments for complex functions

### Component Structure

- Place reusable UI components in `src/components/ui/`
- Use the established design system and color scheme
- Implement proper accessibility attributes
- Follow the component prop interface patterns

### Styling

- Use Tailwind CSS utility classes
- Follow the NGSRN color scheme (Deep Blue, Emerald Green, Gold)
- Ensure responsive design for all components
- Maintain consistent typography using the defined font families

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the development guidelines
3. Run tests and linting: `npm run lint && npm run type-check`
4. Submit a pull request with a clear description

## License

© 2025 NextGen Sustainable Research Network (NGSRN). All rights reserved.
