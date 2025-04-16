import { auth as clerkAuth } from '@clerk/nextjs/server'

export async function auth() {
	const { userId } = await clerkAuth()
	if (!userId) return null

	return {
		user: {
			id: userId,
		},
	}
}
