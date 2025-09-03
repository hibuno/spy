import { createClient } from '@supabase/supabase-js'
import { repositoriesTable } from '@/db/schema'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '-'

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Missing Supabase environment variables. Please check your .env file.')
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

// Use Drizzle schema type but make it compatible with existing code
export type Repository = typeof repositoriesTable.$inferSelect & {
	images: ImageItem[]
}