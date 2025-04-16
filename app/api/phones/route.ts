import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase'
import {
	collection,
	addDoc,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
	deleteDoc,
	orderBy,
	getDoc,
	setDoc,
} from 'firebase/firestore'

interface QueueItem {
	id: string
	position: number
	active: boolean
	agentId: string
	phoneId: string
	createdAt: Date
}

export async function POST(request: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.log('Creating phone for user:', userId)

		const { number, name } = await request.json()

		if (!number) {
			return NextResponse.json(
				{ error: 'Phone number is required' },
				{ status: 400 }
			)
		}

		// Verifica se o número já existe
		const phonesRef = collection(db, 'phoneNumbers')
		const q = query(phonesRef, where('number', '==', number))
		const snapshot = await getDocs(q)

		if (!snapshot.empty) {
			return NextResponse.json(
				{ error: 'Phone number already exists' },
				{ status: 400 }
			)
		}

		// Cria o novo número
		const newPhoneRef = doc(phonesRef)
		await setDoc(newPhoneRef, {
			name,
			number,
			online: false,
			agentId: userId,
			createdAt: new Date().toISOString(),
		})

		return NextResponse.json({
			id: newPhoneRef.id,
			name,
			number,
			online: false,
			agentId: userId,
		})
	} catch (error) {
		console.error('Error creating phone:', error)
		return NextResponse.json({ error: 'Error creating phone' }, { status: 500 })
	}
}

export async function PATCH(request: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id, online, name, number } = await request.json()

		if (!id) {
			return NextResponse.json(
				{ error: 'Phone ID is required' },
				{ status: 400 }
			)
		}

		// Verificar se o número pertence ao usuário
		const phoneRef = doc(db, 'phoneNumbers', id)
		const phoneDoc = await getDoc(phoneRef)

		if (!phoneDoc.exists()) {
			return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
		}

		const phoneData = phoneDoc.data()
		if (phoneData.agentId !== userId) {
			return NextResponse.json(
				{ error: 'You do not have permission to update this phone' },
				{ status: 403 }
			)
		}

		const updateData: any = {}

		if (typeof online === 'boolean') {
			updateData.online = online
			updateData.lastOnlineChange = new Date().toISOString()
			updateData.lastOnline = online ? new Date().toISOString() : null
			updateData.lastOffline = !online ? new Date().toISOString() : null

			// Se o número está ficando online, adicionar à fila
			if (online) {
				// Verificar se já existe na fila
				const queueRef = collection(db, 'phoneNumbers', id, 'queue')
				const queueQuery = query(queueRef, where('active', '==', true))
				const queueSnapshot = await getDocs(queueQuery)

				// Só adiciona à fila se não estiver nela
				if (queueSnapshot.empty) {
					// Buscar todos os itens ativos para determinar a última posição
					const allQueueQuery = query(queueRef, where('active', '==', true))
					const allQueueSnapshot = await getDocs(allQueueQuery)
					const queueItems = allQueueSnapshot.docs.map((doc) => ({
						...doc.data(),
						id: doc.id,
					})) as QueueItem[]

					// Ordenar em memória para encontrar a última posição
					const lastPosition =
						queueItems.length > 0
							? Math.max(...queueItems.map((item) => item.position || 0))
							: 0

					// Adicionar à fila
					await addDoc(queueRef, {
						position: lastPosition + 1,
						agentId: userId,
						phoneId: id,
						createdAt: new Date(),
						active: true,
					})
				}
			}
		}

		if (name !== undefined) {
			updateData.name = name
		}

		if (number !== undefined) {
			updateData.number = number
		}

		await updateDoc(phoneRef, updateData)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error updating phone:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const id = searchParams.get('id')

		if (!id) {
			return NextResponse.json({ error: 'ID is required' }, { status: 400 })
		}

		const phoneRef = doc(db, 'phoneNumbers', id)
		const phoneDoc = await getDoc(phoneRef)

		if (!phoneDoc.exists()) {
			return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
		}

		await updateDoc(phoneRef, { deleted: true })

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting phone:', error)
		return NextResponse.json({ error: 'Error deleting phone' }, { status: 500 })
	}
}

export async function GET() {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		console.log('Fetching phones for user:', userId)

		const phonesRef = collection(db, 'phoneNumbers')
		const q = query(phonesRef, where('agentId', '==', userId))

		const querySnapshot = await getDocs(q)
		console.log('Query snapshot size:', querySnapshot.size)

		const phones = querySnapshot.docs.map((doc) => {
			const data = doc.data()
			return {
				id: doc.id,
				number: data.number || '',
				name: data.name || '',
				online: data.online || false,
				lastOnline: data.lastOnline || new Date().toISOString(),
				lastOnlineChange: data.lastOnlineChange || new Date().toISOString(),
				lastOffline: data.lastOffline || null,
				createdAt: data.createdAt || new Date().toISOString(),
			}
		})

		console.log('Found phones:', phones)

		return NextResponse.json(phones)
	} catch (error) {
		console.error('Error fetching phones:', error)
		return NextResponse.json(
			{ error: 'Error fetching phones' },
			{ status: 500 }
		)
	}
}
