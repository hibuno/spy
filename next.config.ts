import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		domains: ["github.com", "huggingface.co", "raw.githubusercontent.com", "api.star-history.com"],
	},
};

export default nextConfig;
