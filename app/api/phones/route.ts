import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Creating phone for user:', userId);

    const { number, name } = await request.json();
    
    if (!number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const phonesRef = collection(db, 'phoneNumbers');
    const newPhone = {
      agentId: userId,
      number,
      name: name || 'usuário',
      online: false,
      createdAt: new Date().toISOString(),
      lastOnline: null,
      lastOffline: null,
      lastOnlineChange: new Date().toISOString()
    };

    console.log('Creating phone with data:', newPhone);

    const docRef = await addDoc(phonesRef, newPhone);
    console.log('Phone created with ID:', docRef.id);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error adding phone number:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, online, name, number } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Phone ID is required' }, { status: 400 });
    }

    // Verificar se o número pertence ao usuário
    const phoneRef = doc(db, 'phoneNumbers', id);
    const phoneDoc = await getDocs(query(collection(db, 'phoneNumbers'), where('agentId', '==', userId), where('__name__', '==', id)));
    
    if (phoneDoc.empty) {
      return NextResponse.json({ error: 'Phone not found or unauthorized' }, { status: 404 });
    }

    const updateData: any = {};
    
    if (typeof online === 'boolean') {
      updateData.online = online;
      updateData.lastOnlineChange = new Date().toISOString();
      updateData.lastOnline = online ? new Date().toISOString() : null;
      updateData.lastOffline = !online ? new Date().toISOString() : null;
    }

    if (name !== undefined) {
      updateData.name = name;
    }

    if (number !== undefined) {
      updateData.number = number;
    }

    await updateDoc(phoneRef, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating phone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Phone ID is required' }, { status: 400 });
    }

    // Verificar se o número pertence ao usuário
    const phoneRef = doc(db, 'phoneNumbers', id);
    const phoneDoc = await getDocs(query(collection(db, 'phoneNumbers'), where('agentId', '==', userId), where('__name__', '==', id)));
    
    if (phoneDoc.empty) {
      return NextResponse.json({ error: 'Phone not found or unauthorized' }, { status: 404 });
    }

    await deleteDoc(phoneRef);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting phone number:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching phones for user:', userId);

    const phonesRef = collection(db, 'phoneNumbers');
    const q = query(phonesRef, where('agentId', '==', userId));
    
    console.log('Query:', q);
    
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot size:', querySnapshot.size);
    
    const phones = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Document data:', data);
      return {
        id: doc.id,
        ...data
      };
    });

    console.log('Found phones:', phones);

    return NextResponse.json(phones);
  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 