import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
	measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app =
	getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

console.log('Firebase initialized successfully')

// Tipos para as métricas
export interface PhoneMetrics {
	todayAttendances: number
	totalAttendances: number
	averageWaitTime: number // em minutos
	lastAttendance?: Timestamp
	updatedAt: Timestamp
}

export interface DashboardMetrics {
	activeNumbers: number
	todayAttendances: number
	averageWaitTime: string
}

export { db }
