# The Spy Project

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=for-the-badge) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) ![n8n](https://img.shields.io/badge/n8n-1A82E2?style=for-the-badge&logo=n8n&logoColor=white)

## 1. Project Overview

**The Spy Project** is a web application designed to help users discover, explore, and stay updated with trending and popular software repositories. It addresses the challenge of information overload by aggregating data from various platforms like GitHub, arXiv, and Hugging Face. The platform provides a comprehensive and curated overview of projects, including their source code, research papers, and AI models.

The primary goal is to create a centralized platform for developers, researchers, and tech enthusiasts to find "rising stars" and significant open-source projects, track their progress, and access related resources, all in one place.

## 2. Core Features

- **Unified Dashboard:** A single interface to browse trending projects from multiple sources.
- **Rich Previews:** Each project has a detailed page with its README, key stats, and links to external resources.
- **Advanced Filtering:** Users can filter projects by language, experience level, and other criteria.
- **"Rising Stars" Section:** A curated list of promising new projects.
- **PWA Enabled:** The application is a Progressive Web App, allowing for a native-like experience and offline access.
- **User Authentication:** Secure login and registration using Supabase Auth, with support for email/password and social providers like GitHub. Includes a user profile page.
- **Bookmarking:** Logged-in users can bookmark their favorite repositories for easy access later from their profile.
- **Responsive Design:** The UI is fully responsive and works on all screen sizes.

## 3. System Architecture

The project is composed of three main parts:

1. **Frontend:** A Next.js application that serves the user interface.
2. **Backend & Database:** A PostgreSQL database managed by Supabase, with a schema defined and managed by Drizzle ORM.
3. **Automation:** A set of n8n workflows that handle data ingestion, processing, and maintenance.

- **Frontend:** The Next.js application is responsible for rendering the user interface. It uses a combination of server-side rendering (SSR) for fast initial page loads and client-side rendering (CSR) for dynamic interactions like filtering and infinite scrolling.
- **Backend & Database:** The PostgreSQL database, hosted on Supabase, is the single source of truth for all project data. Drizzle ORM is used to provide a type-safe way to interact with the database.
- **Automation (n8n):** The n8n workflows are the backbone of the project, responsible for populating and maintaining the database. They run on a schedule to fetch data from external APIs, process it, and store it in the database.

## 4. Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Bun](https://bun.sh/) (as the project uses `bun.lock`)
- Access to a PostgreSQL database.

### Environment Setup

1. Create a `.env` file in the root of the project.
2. Add the following environment variables. These are required for database connection, Supabase integration, and optional features like analytics and email notifications.

   ```env
   # Required: Your app's domain for CORS validation (e.g., https://yourdomain.com)
   NEXT_PUBLIC_APP_URL=https://yourdomain.com

   # Optional: Databuddy analytics key
   NEXT_PUBLIC_DATABUDDY_KEY=your-databuddy-key

   # Environment setting
   NODE_ENV=production

   # Supabase credentials from your project's dashboard
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Database connection details
   DATABASE_URL="postgresql://user:password@host:port/db"
   SUPABASE_DATABASE_HOST=your-db-host
   SUPABASE_DATABASE_NAME=your-db-name
   SUPABASE_DATABASE_USER=your-db-user
   SUPABASE_DATABASE_PASSWORD=your-db-password
   SUPABASE_DATABASE_PORT=5432

   # GitHub API token for repository data fetching
   GITHUB_TOKEN=your-github-token

   # API key for scraping endpoints (generate with: openssl rand -base64 32)
   API_SECRET_KEY=your-secret-api-key-here

   # AI Content Generation (you can use upstage.ai for free credits)
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_API_URL=https://api.openai.com/v1/chat/completions  # Optional: Custom endpoint
   OPENAI_API_MODEL=gpt-4.1-nano  # Optional: Custom model

   # Email notifications for health monitoring (optional)
   MAILTRAP_USER=your-mailtrap-user
   MAILTRAP_PASSWORD=your-mailtrap-password
   MAILTRAP_HOST=your-mailtrap-host
   MAILTRAP_PORT=587
   ```

### Installation

Install the project dependencies using your preferred package manager:

```bash
npm install
# or
bun install
```

### Running the Development Server

Once the dependencies are installed and the environment is configured, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 4.1. Security Features

This application implements comprehensive security measures to protect API endpoints:

### Domain Validation & CORS Protection

- Requests must originate from the configured `NEXT_PUBLIC_APP_URL` domain
- Automatic subdomain support (e.g., `api.yourdomain.com`)
- Development mode allows `localhost` and `127.0.0.1`

### Rate Limiting

- **General endpoints**: 100 requests per minute per IP
- **Search endpoints**: 30 requests per minute per IP
- **Scraping endpoints**: 10 requests per minute per IP
- **Stats endpoint**: 60 requests per minute per IP

### API Key Protection

Automation endpoints (`/api/automation/*`) require API key authentication:

- Set `API_SECRET_KEY` in environment variables
- Include key in requests: `X-API-Key: your-secret-api-key-here`
- Used by n8n workflows for secure automation

### Security Headers

All API responses include standard security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Testing Security

For detailed security documentation, see [SECURITY.md](./SECURITY.md).

## 5. Database

The database is a PostgreSQL instance managed by Supabase. The schema is defined in `src/db/schema.ts` using Drizzle ORM.

### `repositories` Table Schema

This is the main table that stores all the information about the repositories.

| Column             | Type        | Description                                                                   |
| ------------------ | ----------- | ----------------------------------------------------------------------------- |
| `id`               | `uuid`      | Primary key for the table.                                                    |
| `summary`          | `text`      | A short summary of the repository.                                            |
| `content`          | `text`      | The full content of the README file.                                          |
| `languages`        | `text`      | A comma-separated list of programming languages used.                         |
| `experience`       | `text`      | The required experience level (e.g., "Beginner", "Intermediate", "Advanced"). |
| `usability`        | `text`      | The usability level of the project.                                           |
| `deployment`       | `text`      | The deployment difficulty.                                                    |
| `stars`            | `bigint`    | The number of stars on GitHub.                                                |
| `forks`            | `bigint`    | The number of forks on GitHub.                                                |
| `watching`         | `bigint`    | The number of watchers on GitHub.                                             |
| `license`          | `text`      | The license of the repository.                                                |
| `homepage`         | `text`      | The URL of the project's homepage.                                            |
| `repository`       | `text`      | The unique name of the repository (e.g., `owner/repo`).                       |
| `images`           | `jsonb`     | A JSON array of image URLs for the project.                                   |
| `created_at`       | `timestamp` | The timestamp when the repository was added to the database.                  |
| `updated_at`       | `timestamp` | The timestamp when the repository was last updated.                           |
| `archived`         | `boolean`   | Whether the repository is archived on GitHub.                                 |
| `disabled`         | `boolean`   | Whether the repository is disabled on GitHub.                                 |
| `open_issues`      | `bigint`    | The number of open issues on GitHub.                                          |
| `default_branch`   | `text`      | The default branch of the repository.                                         |
| `network_count`    | `bigint`    | The number of network members on GitHub.                                      |
| `tags`             | `text`      | A comma-separated list of tags for the project.                               |
| `arxiv_url`        | `text`      | The URL of the related research paper on arXiv.                               |
| `huggingface_url`  | `text`      | The URL of the related model on Hugging Face.                                 |
| `paper_authors`    | `text`      | The authors of the research paper.                                            |
| `paper_abstract`   | `text`      | The abstract of the research paper.                                           |
| `paper_scraped_at` | `timestamp` | The timestamp when the paper information was last scraped.                    |
| `readme`           | `text`      | The content of the README file.                                               |
| `publish`          | `boolean`   | Whether the repository should be visible in the app.                          |

### `bookmarks` Table Schema

This table stores the bookmarks that users have created.

| Column          | Type        | Description                                  |
| --------------- | ----------- | -------------------------------------------- |
| `id`            | `uuid`      | Primary key for the table.                   |
| `user_id`       | `uuid`      | Foreign key to the `auth.users` table.       |
| `repository_id` | `uuid`      | Foreign key to the `repositories` table.     |
| `created_at`    | `timestamp` | The timestamp when the bookmark was created. |

### Migrations

Database migrations are managed using `drizzle-kit`. The following scripts are available:

- **`db:generate`**: Generates database migration files based on schema changes.
- **`db:migrate`**: Applies pending migrations to the database.
- **`db:push`**: Pushes schema changes directly to the database (for development).
- **`db:studio`**: Opens the Drizzle Studio to browse the database.

## 6. Automation (n8n)

The project uses n8n to automate data ingestion and maintenance. There are three main workflows:

### API Endpoints for Automation

All automation endpoints require API key authentication (`X-API-Key` header):

- **`POST /api/automation/ingest`** - Process repositories that need ingestion
- **`POST /api/automation/enrich`** - Enrich repositories with AI-generated content
- **`GET /api/automation/status`** - Get current automation statistics
- **`GET /api/automation/health`** - Check system health and configuration

### n8n Workflows

#### 1. Repository Ingestion (Hourly)

- **Schedule**: Every 1 hour
- **Purpose**: Process new repositories from GitHub API
- **Process**: Fetches repository data, README content, screenshots, and metadata
- **Rate Limiting**: 3-second delays between repositories (GitHub API limits)

#### 2. Repository Enrichment (Every 5 minutes)

- **Schedule**: Every 5 minutes (smart - only runs if needed)
- **Purpose**: Generate AI summaries and content for repositories
- **Process**: Uses OpenAI/Upstage API to create human-readable content
- **Rate Limiting**: 3-second delays between API calls

#### 3. Health Monitoring (Every 15 minutes)

- **Schedule**: Every 15 minutes
- **Purpose**: Monitor system health and alert on issues
- **Checks**: Database connectivity, API keys, environment variables
- **Notifications**: Automatic email alerts via Mailtrap when system is unhealthy

### Email Notifications

The health monitoring system can send email notifications when issues are detected:

- **Mailtrap Integration**: Configure SMTP settings for email alerts
- **Automatic Alerts**: Sends notifications when API health checks fail
- **Environment Variables**: Set `MAILTRAP_*` variables to enable notifications

### Setup Instructions

1. **Configure API Key**: Set `API_SECRET_KEY` in environment variables
2. **Import Workflows**: Use the JSON files in `n8n-workflows/` directory
3. **Update URLs**: Replace `https://yourdomain.com` with your actual domain
4. **Set Credentials**: Create "Spy API Key" credential in n8n with your API key
5. **Activate Workflows**: Enable each workflow in n8n

For detailed setup instructions, see [AUTOMATION.md](./AUTOMATION.md).

## 8. Contributing

As this is a private project, contributions are not open at this time. For any issues or suggestions, please reach out to the project owner.

## 9. Deployment

The project is deployed on [Vercel](https://vercel.com/). The deployment is automatically triggered on every push to the `main` branch.

## 10. License

This project is proprietary and the source code is not available under an open-source license.
