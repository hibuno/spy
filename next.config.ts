import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		// Allow specific trusted domains for optimization
		remotePatterns: [
			{
				protocol: "https",
				hostname: "api.producthunt.com",
			},
			{
				protocol: "https",
				hostname: "github.com",
			},
			{
				protocol: "https",
				hostname: "raw.githubusercontent.com",
			},
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
			{
				protocol: "https",
				hostname: "opengraph.githubassets.com",
			},
			{
				protocol: "https",
				hostname: "*.supabase.co",
			},
		],
		// Use only WebP format to reduce transformations (remove AVIF to save costs)
		formats: ['image/webp'],
		// Set minimum cache TTL to 31 days to reduce transformations and cache writes
		minimumCacheTTL: 2678400, // 31 days
		// Limit quality options to reduce possible transformations
		qualities: [75, 90], // Only allow 75% and 90% quality
		// Configure image sizes to match your actual usage patterns
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
	},

	// PWA optimizations
	async headers() {
		return [
			{
				source: '/sw.js',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=0, must-revalidate',
					},
					{
						key: 'Service-Worker-Allowed',
						value: '/',
					},
				],
			},
			{
				source: '/manifest.json',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
			{
				source: '/:path*',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
				],
			},
		];
	},

	// Enable experimental features for better PWA support
	experimental: {
		optimizePackageImports: ['lucide-react'],
	},

	// PWA specific configurations
	poweredByHeader: false,
	compress: true,
};

export default nextConfig;
