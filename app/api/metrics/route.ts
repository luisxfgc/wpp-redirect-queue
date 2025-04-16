import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface Phone {
	id: string
	number: string
	name: string
	online: boolean
	userId: string
	createdAt: string
	lastOnline?: string
	lastOffline?: string
	lastOnlineChange?: string
}

interface QueueItem {
	id: string
	position: number
	active: boolean
	userId: string
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
		const phonesRef = collection(db, 'phones')
		const phonesQuery = query(phonesRef, where('userId', '==', userId))
		const phonesSnapshot = await getDocs(phonesQuery)

		const phones = phonesSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as Phone[]

		// Buscar itens da fila ativos do usuário
		const queueRef = collection(db, 'queue')
		const queueQuery = query(
			queueRef,
			where('userId', '==', userId),
			where('active', '==', true)
		)
		const queueSnapshot = await getDocs(queueQuery)
		const queueItems = queueSnapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
		})) as QueueItem[]

		// Calcular métricas
		const totalPhones = phones.length
		const totalNumbers = queueItems.length
		const averageWaitTime =
			queueItems.length > 0
				? queueItems.reduce((sum, item) => sum + (item.waitTime || 0), 0) /
				  queueItems.length
				: 0

		return NextResponse.json({
			totalPhones,
			totalNumbers,
			averageWaitTime: `${Math.round(averageWaitTime)}min`,
		})
	} catch (error) {
		console.error('Error fetching metrics:', error)
		return NextResponse.json(
			{ error: 'Error fetching metrics' },
			{ status: 500 }
		)
	}
}
