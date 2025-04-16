import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface Phone {
	id: string
	number: string
	name: string
	online: boolean
	agentId: string
	createdAt: string
	lastOnline?: string
	lastOffline?: string
	lastOnlineChange?: string
}

interface QueueItem {
	id: string
	position: number
	active: boolean
	agentId: string
	phoneId: string
	createdAt: Date
	waitTime?: number
}

export async function GET() {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Buscar todos os telefones do usuário
		const phonesRef = collection(db, 'phoneNumbers')
		const phonesQuery = query(phonesRef, where('agentId', '==', userId))
		const phonesSnapshot = await getDocs(phonesQuery)

		const phones = phonesSnapshot.docs.map((doc) => ({
			id: doc.id,
			...(doc.data() as Phone),
		}))

		// Buscar itens da fila para cada telefone online
		const queue: QueueItem[] = []
		for (const phone of phones) {
			if (phone.online) {
				const queueRef = collection(db, 'phoneNumbers', phone.id, 'queue')
				const queueQuery = query(queueRef, where('active', '==', true))
				const queueSnapshot = await getDocs(queueQuery)

				queue.push(
					...queueSnapshot.docs.map((doc) => ({
						id: doc.id,
						...(doc.data() as QueueItem),
					}))
				)
			}
		}

		// Calcular métricas
		const totalPhones = phones.length
		const totalNumbers = queue.length
		const averageWaitTime =
			queue.length > 0
				? queue.reduce((sum, item) => sum + (item.waitTime || 0), 0) /
				  queue.length
				: 0

		return NextResponse.json({
			totalPhones,
			totalNumbers,
			averageWaitTime,
		})
	} catch (error) {
		console.error('Error fetching metrics:', error)
		return NextResponse.json(
			{ error: 'Error fetching metrics' },
			{ status: 500 }
		)
	}
}
