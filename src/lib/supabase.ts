import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '-'

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Client for browser/client-side operations
export const supabase = createClient(supabaseUrl, supabaseKey)

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
})

export interface ImageItem {
	url: string
	type?: string
	width?: number
	height?: number
}

export interface Repository {
	id: string
	summary: string
	content: string
	languages: string
	experience: string
	usability: string
	deployment: string
	stars: number
	forks: number
	watching: number
	license: string
	homepage: string
	repository: string
	images: ImageItem[] | null
	created_at: string
	updated_at: string
	archived: boolean
	disabled: boolean
	open_issues: number
	default_branch: string
	network_count: number
	subscribers_count: number
	tags: string
	// Paper-related fields
	arxiv_url?: string
	huggingface_url?: string
	paper_authors?: string
	paper_abstract?: string
	paper_scraped_at?: string
}