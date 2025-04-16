import { initializeApp, getApps } from 'firebase/app'
import {
	getFirestore,
	Timestamp,
	enableIndexedDbPersistence,
} from 'firebase/firestore'

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

// Enable offline persistence
if (typeof window !== 'undefined') {
	enableIndexedDbPersistence(db).catch((err) => {
		if (err.code === 'failed-precondition') {
			// Multiple tabs open, persistence can only be enabled in one tab at a time
			console.warn('Firebase persistence failed: Multiple tabs open')
		} else if (err.code === 'unimplemented') {
			// The current browser doesn't support persistence
			console.warn('Firebase persistence not supported by browser')
		}
	})
}

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
