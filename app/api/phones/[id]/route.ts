import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { NextResponse } from 'next/server'

export async function PATCH(
	request: Request,
	context: { params: { id: string } }
) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await Promise.resolve(context.params)
		const phoneRef = doc(db, 'phones', id)
		const phoneDoc = await getDoc(phoneRef)

		if (!phoneDoc.exists()) {
			return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
		}

		const phoneData = phoneDoc.data()
		if (phoneData.userId !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const data = await request.json()
		await updateDoc(phoneRef, {
			...data,
			lastOnlineChange: new Date().toISOString(),
		})

		const updatedDoc = await getDoc(phoneRef)
		return NextResponse.json(updatedDoc.data())
	} catch (error) {
		console.error('Error updating phone:', error)
		return NextResponse.json(
			{ error: 'Failed to update phone' },
			{ status: 500 }
		)
	}
}

export async function PUT(
	request: Request,
	context: { params: { id: string } }
) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await Promise.resolve(context.params)
		const phoneRef = doc(db, 'phones', id)
		const phoneDoc = await getDoc(phoneRef)

		if (!phoneDoc.exists()) {
			return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
		}

		const phoneData = phoneDoc.data()
		if (phoneData.userId !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const data = await request.json()
		await updateDoc(phoneRef, {
			name: data.name,
			number: data.number,
		})

		const updatedDoc = await getDoc(phoneRef)
		return NextResponse.json(updatedDoc.data())
	} catch (error) {
		console.error('Error updating phone:', error)
		return NextResponse.json(
			{ error: 'Failed to update phone' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	_request: Request,
	context: { params: { id: string } }
) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		const { id } = await Promise.resolve(context.params)
		const phoneRef = doc(db, 'phones', id)
		const phoneDoc = await getDoc(phoneRef)

		if (!phoneDoc.exists()) {
			return NextResponse.json({ error: 'Phone not found' }, { status: 404 })
		}

		const phoneData = phoneDoc.data()
		if (phoneData.userId !== userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		await deleteDoc(phoneRef)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Error deleting phone:', error)
		return NextResponse.json(
			{ error: 'Failed to delete phone' },
			{ status: 500 }
		)
	}
}
