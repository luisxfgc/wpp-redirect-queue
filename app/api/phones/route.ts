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
import { NextRequest } from 'next/server'

interface PhoneData {
	number: string
	name?: string
	userId: string
	online: boolean
	lastOnlineChange: string
	createdAt: string
}

interface QueueItem {
	id: string
	position: number
	phoneId: string
	number: string
	name: string
	lastOnlineChange: string
	createdAt: Date
	active: boolean
	agentId: string
	waitTime: number
	userId: string
}

interface Phone {
	id?: string
	userId: string
	number: string
	name: string
	online: boolean
	lastOnlineChange: string
	createdAt: Date
}

export async function POST(request: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const body = await request.json()
		const { number, name } = body

		if (!number) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		// Criar novo documento de telefone
		const phoneRef = collection(db, 'phones')
		const newPhone = {
			number,
			name: name || '',
			userId,
			online: false,
			lastOnlineChange: new Date().toISOString(),
			createdAt: new Date().toISOString(),
		}

		const docRef = await addDoc(phoneRef, newPhone)

		return NextResponse.json({
			id: docRef.id,
			...newPhone,
		})
	} catch (error) {
		console.error('Error creating phone:', error)
		return NextResponse.json({ error: 'Error creating phone' }, { status: 500 })
	}
}

export async function PATCH(req: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return new NextResponse('Unauthorized', { status: 401 })
		}

		const { id, online } = await req.json()
		if (!id) {
			return new NextResponse('Missing phone ID', { status: 400 })
		}

		const phoneRef = doc(db, 'phones', id)
		const phoneSnap = await getDoc(phoneRef)

		if (!phoneSnap.exists()) {
			return new NextResponse('Phone not found', { status: 404 })
		}

		const phone = { id: phoneSnap.id, ...phoneSnap.data() } as Phone
		if (phone.userId !== userId) {
			return new NextResponse('Unauthorized', { status: 401 })
		}

		// Update phone status
		await updateDoc(phoneRef, {
			online: online ?? false,
			lastOnlineChange: new Date().toISOString(),
		})

		// Sync with queue
		const syncResponse = await fetch(
			`${process.env.NEXT_PUBLIC_APP_URL}/api/queue/sync`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ phoneId: id }),
			}
		)

		if (!syncResponse.ok) {
			console.error('Failed to sync queue:', await syncResponse.text())
			// Don't fail the request if queue sync fails
		}

		return new NextResponse('Phone updated successfully')
	} catch (error) {
		console.error('Error updating phone:', error)
		return new NextResponse('Internal Server Error', { status: 500 })
	}
}

export async function DELETE(request: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await request.json()

		if (!id) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		const phoneRef = doc(db, 'phones', id)
		const phoneDoc = await getDoc(phoneRef)

		if (!phoneDoc.exists()) {
			return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
		}

		const phoneData = phoneDoc.data() as PhoneData
		if (phoneData.userId !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Remove from queue
		const queueRef = collection(db, 'queue')
		const q = query(queueRef, where('phoneId', '==', id))
		const queueSnapshot = await getDocs(q)

		if (!queueSnapshot.empty) {
			const queueItem = queueSnapshot.docs[0]
			await deleteDoc(queueItem.ref)
		}

		await deleteDoc(phoneRef)

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

		const phonesRef = collection(db, 'phones')
		const q = query(phonesRef, where('userId', '==', userId))

		const querySnapshot = await getDocs(q)
		const phones = querySnapshot.docs
			.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}))
			.sort((a: any, b: any) => {
				// Ordenar por data de criação localmente
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			})

		return NextResponse.json(phones)
	} catch (error) {
		console.error('Error fetching phones:', error)
		return NextResponse.json(
			{ error: 'Error fetching phones' },
			{ status: 500 }
		)
	}
}
