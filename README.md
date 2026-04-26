# PixelVault 🎨

A professional Pinterest-like image discovery platform with AI image generation, built with Next.js 16, TypeScript, Tailwind CSS, and PostgreSQL.

## Features

- **Masonry Grid Layout** — Pinterest-style responsive image grid
- **Category System** — Hierarchical categories with subcategories
- **Search** — Full-text search across images, tags, and categories
- **User Accounts** — Email/password + Google/GitHub OAuth
- **Boards** — Save images into personal collections
- **Like & Save** — Interact with images
- **Download & Share** — Download images or share links
- **AI Image Generation** — "Generate Similar Image" button (provider-agnostic)
- **Admin Dashboard** — Manage images, categories, and users
- **SEO Optimized** — OpenGraph, Twitter cards, structured metadata
- **Fully Responsive** — Mobile-first design
- **API-First** — REST API ready for mobile app integration

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM v7 |
| Auth | NextAuth.js v5 (beta) |
| Storage | Cloudflare R2 (S3-compatible) |
| State | TanStack Query + Zustand |
| UI | Radix UI + Lucide Icons |

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database
- (Optional) Cloudflare R2 account for image storage

### 2. Install dependencies

```bash
cd pixelvault
npm install
```

### 3. Configure environment

Copy `.env` and fill in your values:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pixelvault"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="pixelvault"
R2_PUBLIC_URL="https://your-bucket.r2.dev"

# AI Generation (configure when ready)
AI_PROVIDER="openai"   # openai | stability | replicate | local
AI_API_KEY=""
AI_API_URL=""
```

### 4. Set up the database

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Default credentials after seeding:**
- Admin: `admin@pixelvault.com` / `Admin@123456`
- Demo: `demo@pixelvault.com` / `User@123456`

## Project Structure

```
pixelvault/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data seeder
├── src/
│   ├── app/
│   │   ├── (pages)/           # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth + register
│   │   │   ├── images/        # CRUD + like/save/generate
│   │   │   ├── categories/    # Category management
│   │   │   ├── boards/        # Board management
│   │   │   ├── search/        # Search endpoint
│   │   │   ├── upload/        # R2 presigned URLs
│   │   │   └── admin/         # Admin endpoints
│   │   └── admin/             # Admin dashboard pages
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── layout/            # Navbar, Footer
│   │   ├── images/            # Image card, masonry grid, AI button
│   │   ├── categories/        # Category cards
│   │   └── admin/             # Admin-specific components
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── r2.ts              # Cloudflare R2 helpers
│   │   ├── ai.ts              # AI generation service
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript types
└── .env                       # Environment variables
```

## Database Schema

```
users ──────────────────────────────────────────────────
  id, name, email, password, username, bio, role

images ─────────────────────────────────────────────────
  id, title, description, imageUrl, thumbnailUrl,
  width, height, categoryId, userId,
  viewCount, likeCount, saveCount, downloadCount,
  isPublished, isFeatured, createdAt

categories ─────────────────────────────────────────────
  id, name, slug, description, coverImage,
  parentId (self-relation), sortOrder

tags + image_tags ──────────────────────────────────────
  Many-to-many: images ↔ tags

boards + board_images ──────────────────────────────────
  User collections with many-to-many images

likes, saves ───────────────────────────────────────────
  User interactions with images

ai_generation_logs ─────────────────────────────────────
  Track AI generation requests and results
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/images` | List images (filter, paginate, search) |
| POST | `/api/images` | Create image |
| GET | `/api/images/:id` | Get image detail |
| PATCH | `/api/images/:id` | Update image |
| DELETE | `/api/images/:id` | Delete image |
| POST | `/api/images/:id/like` | Toggle like |
| POST | `/api/images/:id/save` | Toggle save |
| POST | `/api/images/:id/generate` | AI generate similar |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category (admin) |
| GET | `/api/boards` | User's boards |
| POST | `/api/boards` | Create board |
| GET | `/api/search?q=...` | Search images/categories/tags |
| POST | `/api/upload` | Get R2 presigned upload URL |
| GET | `/api/admin/stats` | Dashboard stats (admin) |

## AI Integration

The AI generation system is provider-agnostic. Set `AI_PROVIDER` in `.env`:

- **`openai`** — Uses DALL-E 3 via OpenAI API
- **`stability`** — Uses Stable Diffusion XL via Stability AI
- **`replicate`** — Uses models via Replicate
- **`local`** — Connects to a local model (ComfyUI, Automatic1111)
- **`placeholder`** (default) — Returns a placeholder image for development

The prompt is automatically built from the image's title, description, and tags.

## Mobile App Integration

The REST API is designed for mobile app consumption:
- All endpoints return consistent `{ success, data, error }` responses
- Pagination via `page` and `pageSize` query params
- JWT-based authentication (compatible with React Native / Flutter)
- Image URLs stored separately from metadata

## Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

For deployment, set all environment variables and ensure `DATABASE_URL` points to your production PostgreSQL instance.
