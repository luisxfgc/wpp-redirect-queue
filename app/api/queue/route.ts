import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase'
import {
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	updateDoc,
	where,
	DocumentData,
	QueryDocumentSnapshot,
	collectionGroup,
} from 'firebase/firestore'
import { NextRequest, NextResponse } from 'next/server'

interface QueueItem {
	id: string
	position: number
	active: boolean
	agentId: string
	phoneId: string
	createdAt: Date
	number: string
	name: string
}

interface PhoneData {
	number: string
	name?: string
	agentId: string
	online: boolean
}

export async function GET() {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Buscar todos os números ativos
		const phonesRef = collection(db, 'phoneNumbers')
		const phonesQuery = query(phonesRef, where('agentId', '==', userId))
		const phonesSnapshot = await getDocs(phonesQuery)

		const queue: QueueItem[] = []
		for (const phoneDoc of phonesSnapshot.docs) {
			const phoneData = phoneDoc.data()
			if (phoneData.online) {
				// Buscar itens da fila para este número
				const queueRef = collection(db, 'phoneNumbers', phoneDoc.id, 'queue')
				const queueQuery = query(queueRef, where('active', '==', true))
				const queueSnapshot = await getDocs(queueQuery)

				// Adicionar itens da fila com os dados do telefone
				queue.push(
					...queueSnapshot.docs.map((doc) => {
						const data = doc.data()
						return {
							id: doc.id,
							position: data.position || 0,
							active: data.active || false,
							agentId: data.agentId || userId,
							phoneId: phoneDoc.id,
							createdAt: data.createdAt || new Date(),
							number: phoneData.number || '',
							name: phoneData.name || '',
						}
					})
				)
			}
		}

		// Ordenar a fila por posição
		queue.sort((a, b) => a.position - b.position)

		return NextResponse.json(queue)
	} catch (error) {
		console.error('Error fetching queue:', error)
		return NextResponse.json({ error: 'Error fetching queue' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { phoneId } = body

		if (!phoneId) {
			return NextResponse.json(
				{ error: 'Phone ID is required' },
				{ status: 400 }
			)
		}

		const phoneRef = doc(db, 'phoneNumbers', phoneId)
		const phoneDoc = await getDoc(phoneRef)

		if (!phoneDoc.exists()) {
			return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
		}

		const phoneData = phoneDoc.data() as PhoneData
		if (phoneData.agentId !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		if (!phoneData.online) {
			return NextResponse.json(
				{ error: 'Phone is not online' },
				{ status: 400 }
			)
		}

		const queueRef = collection(phoneRef, 'queue')
		const queueQuery = query(queueRef, where('active', '==', true))
		const queueSnapshot = await getDocs(queueQuery)
		const position = queueSnapshot.size + 1

		const queueItem = {
			position,
			agentId: userId,
			phoneId,
			createdAt: new Date(),
			active: true,
		}

		await addDoc(queueRef, queueItem)

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error:', error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { id, direction, phoneId } = body

		if (!id || !direction || !phoneId) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		const phoneRef = doc(db, 'phoneNumbers', phoneId)
		const phoneDoc = await getDoc(phoneRef)

		if (!phoneDoc.exists()) {
			return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
		}

		const phoneData = phoneDoc.data() as PhoneData
		if (phoneData.agentId !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		if (!phoneData.online) {
			return NextResponse.json(
				{ error: 'Phone is not online' },
				{ status: 400 }
			)
		}

		const queueRef = doc(phoneRef, 'queue', id)
		const queueDoc = await getDoc(queueRef)

		if (!queueDoc.exists()) {
			return NextResponse.json(
				{ error: 'Queue item not found' },
				{ status: 404 }
			)
		}

		const queueData = queueDoc.data() as QueueItem
		if (queueData.agentId !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Buscar todos os itens ativos da fila para calcular a nova posição
		const allQueueQuery = query(
			collection(phoneRef, 'queue'),
			where('active', '==', true),
			orderBy('position', 'asc')
		)
		const allQueueSnapshot = await getDocs(allQueueQuery)
		const allQueueItems = allQueueSnapshot.docs.map((doc) => ({
			id: doc.id,
			...(doc.data() as QueueItem),
		}))

		let newPosition = queueData.position
		const currentIndex = allQueueItems.findIndex((item) => item.id === id)
		const totalItems = allQueueItems.length

		// Calcular a nova posição baseada na direção
		switch (direction) {
			case 'up':
				if (currentIndex > 0) {
					newPosition = allQueueItems[currentIndex - 1].position
					// Trocar posições com o item acima
					await updateDoc(
						doc(phoneRef, 'queue', allQueueItems[currentIndex - 1].id),
						{
							position: queueData.position,
						}
					)
				}
				break
			case 'down':
				if (currentIndex < totalItems - 1) {
					newPosition = allQueueItems[currentIndex + 1].position
					// Trocar posições com o item abaixo
					await updateDoc(
						doc(phoneRef, 'queue', allQueueItems[currentIndex + 1].id),
						{
							position: queueData.position,
						}
					)
				}
				break
			case 'top':
				newPosition = 1
				// Mover todos os outros itens uma posição para baixo
				for (let i = 0; i < currentIndex; i++) {
					await updateDoc(doc(phoneRef, 'queue', allQueueItems[i].id), {
						position: allQueueItems[i].position + 1,
					})
				}
				break
			case 'bottom':
				newPosition = totalItems
				// Mover todos os outros itens uma posição para cima
				for (let i = currentIndex + 1; i < totalItems; i++) {
					await updateDoc(doc(phoneRef, 'queue', allQueueItems[i].id), {
						position: allQueueItems[i].position - 1,
					})
				}
				break
		}

		// Atualizar a posição do item movido
		await updateDoc(queueRef, {
			position: newPosition,
		})

		// Buscar a fila atualizada para retornar
		const updatedQueueQuery = query(
			collection(phoneRef, 'queue'),
			where('active', '==', true),
			orderBy('position', 'asc')
		)
		const updatedQueueSnapshot = await getDocs(updatedQueueQuery)
		const updatedQueue = updatedQueueSnapshot.docs.map((doc) => ({
			id: doc.id,
			...(doc.data() as QueueItem),
			number: phoneData.number,
			name: phoneData.name,
		}))

		return NextResponse.json(updatedQueue)
	} catch (error) {
		console.error('Error:', error)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}
}
