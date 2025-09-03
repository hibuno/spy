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

![System Architecture Diagram](https://i.imgur.com/3Z2k2Yy.png)

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
2. Add the following environment variables. These are required for database connection and Supabase integration.

   ```env
   # Supabase credentials from your project's dashboard
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Direct connection string to your PostgreSQL database
   DATABASE_URL="postgresql://user:password@host:port/db"
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

The project uses n8n to automate data ingestion and maintenance. There are four main workflows:

### 1. Spy Daily Ingest (GitHub)

This workflow runs on a schedule to ingest new repositories from GitHub.

- **Trigger:** Runs on a schedule.
- **Process:**
  1. Scrapes a trending page to get a list of repositories.
  2. Filters out repositories that are already in the database.
  3. For each new repository, it fetches the README content from the GitHub API.
  4. An AI model (via OpenRouter) extracts key information from the README.
  5. The new repository data is inserted or updated in the database.

### 2. Spy Daily Ingest (Hugging Face)

This workflow is similar to the GitHub ingest but for Hugging Face.

- **Trigger:** Runs on a schedule.
- **Process:**
  1. Uses an internal paper scraper to get a list of papers.
  2. Makes HTTP requests to get more details.
  3. The new data is inserted or updated in the database.

### 3. Spy Stats Updater

This workflow keeps the repository statistics up-to-date.

- **Trigger:** Runs on a schedule.
- **Process:**
  1. Selects a batch of repositories from the database.
  2. Calls the GitHub API to get the latest stats (stars, forks, etc.).
  3. Updates the database with the new stats.

### 4. Spy Auto Publish

This workflow automatically publishes repositories that meet certain criteria.

- **Trigger:** Runs on a schedule.
- **Process:**
  1. Selects repositories that are not yet published.
  2. Checks if they meet the criteria for publishing (e.g., have a summary, content, etc.).
  3. Updates the `publish` flag to `true` for the selected repositories.

## 7. Available Scripts

- **`dev`**: Starts the Next.js development server with Turbopack.
- **`build`**: Builds the application for production.
- **`start`**: Starts the production server.
- **`lint`**: Lints the codebase using ESLint.

## 8. Contributing

As this is a private project, contributions are not open at this time. For any issues or suggestions, please reach out to the project owner.

## 9. Deployment

The project is deployed on [Vercel](https://vercel.com/). The deployment is automatically triggered on every push to the `main` branch.

## 10. License

This project is proprietary and the source code is not available under an open-source license.
