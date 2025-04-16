import { NextConfig } from 'next'

const config: NextConfig = {
	reactStrictMode: true,
	webpack: undefined,
	images: {
		domains: ['img.clerk.com'],
	},
	experimental: {
		serverActions: {
			bodySizeLimit: '2mb',
		},
	},
	env: {
		CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
		CLERK_CLOCK_SKEW: process.env.CLERK_CLOCK_SKEW,
	},
}

export default config
