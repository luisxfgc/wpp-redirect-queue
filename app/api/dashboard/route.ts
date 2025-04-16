import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { NextResponse } from 'next/server'

interface Phone {
	id: string
	number: string
	name: string
	online: boolean
	userId: string
	lastOnlineChange: string
}

interface DashboardMetrics {
	totalPhones: number
	onlinePhones: number
	lastConnection: string
}

export async function GET() {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get all phones for the user
		const phonesRef = collection(db, 'phones')
		const phonesQuery = query(phonesRef, where('userId', '==', userId))
		const phonesSnapshot = await getDocs(phonesQuery)
		const phones = phonesSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as Phone[]

		// Calculate metrics
		const onlinePhones = phones.filter((phone) => phone.online).length
		const lastConnection =
			phones
				.filter((phone) => phone.lastOnlineChange)
				.sort(
					(a, b) =>
						new Date(b.lastOnlineChange).getTime() -
						new Date(a.lastOnlineChange).getTime()
				)[0]?.lastOnlineChange || ''

		const metrics: DashboardMetrics = {
			totalPhones: phones.length,
			onlinePhones,
			lastConnection,
		}

		return NextResponse.json(metrics)
	} catch (error) {
		console.error('Error fetching dashboard metrics:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch dashboard metrics' },
			{ status: 500 }
		)
	}
}
