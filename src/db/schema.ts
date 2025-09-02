import { pgTable, uuid, text, bigint, jsonb, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const repositoriesTable = pgTable('repositories', {
	id: uuid('id').primaryKey().defaultRandom(),
	summary: text('summary'),
	content: text('content'),
	languages: text('languages'),
	experience: text('experience'),
	usability: text('usability'),
	deployment: text('deployment'),
	stars: bigint('stars', { mode: 'number' }),
	forks: bigint('forks', { mode: 'number' }),
	watching: bigint('watching', { mode: 'number' }),
	license: text('license'),
	homepage: text('homepage'),
	repository: text('repository').unique(),
	images: jsonb('images'),
	created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updated_at: timestamp('updated_at', { withTimezone: false }),
	archived: boolean('archived'),
	disabled: boolean('disabled'),
	open_issues: bigint('open_issues', { mode: 'number' }),
	default_branch: text('default_branch'),
	network_count: bigint('network_count', { mode: 'number' }),
	tags: text('tags'),
	// Paper-related columns
	arxiv_url: text('arxiv_url'),
	huggingface_url: text('huggingface_url'),
	paper_authors: text('paper_authors'),
	paper_abstract: text('paper_abstract'),
	paper_scraped_at: timestamp('paper_scraped_at', { withTimezone: true }),
	// README and publish columns
	readme: text('readme'),
	publish: boolean('publish').default(false),
	ingested: boolean('ingested').default(false),
	enriched: boolean('enriched').default(false),
}, (table) => ({
	repositoryIdx: index('repositories_repository_key').on(table.repository),
	huggingfaceUrlIdx: index('idx_repositories_huggingface_url').on(table.huggingface_url),
	arxivUrlIdx: index('idx_repositories_arxiv_url').on(table.arxiv_url),
	paperScrapedAtIdx: index('idx_repositories_paper_scraped_at').on(table.paper_scraped_at),
}));

export type InsertRepository = typeof repositoriesTable.$inferInsert;
export type SelectRepository = typeof repositoriesTable.$inferSelect;
