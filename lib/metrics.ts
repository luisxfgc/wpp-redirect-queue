import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db, PhoneMetrics } from './firebase'

export async function updatePhoneMetrics(phoneId: string, waitTime: number) {
	try {
		const metricRef = doc(db, 'metrics', phoneId)
		const metricDoc = await getDoc(metricRef)

		const now = Timestamp.now()
		const startOfDay = new Date()
		startOfDay.setHours(0, 0, 0, 0)
		const startOfDayTimestamp = Timestamp.fromDate(startOfDay)

		if (!metricDoc.exists()) {
			// Criar novo documento de métricas
			const newMetrics: PhoneMetrics = {
				todayAttendances: 1,
				totalAttendances: 1,
				averageWaitTime: waitTime,
				lastAttendance: now,
				updatedAt: now,
			}
			await setDoc(metricRef, newMetrics)
		} else {
			const currentMetrics = metricDoc.data() as PhoneMetrics
			const lastAttendanceDate =
				currentMetrics.lastAttendance?.toDate() || new Date(0)

			// Resetar contagem diária se for um novo dia
			const todayAttendances =
				Timestamp.fromDate(lastAttendanceDate).seconds <
				startOfDayTimestamp.seconds
					? 1
					: currentMetrics.todayAttendances + 1

			// Atualizar média de tempo de espera
			const totalWaitTime =
				currentMetrics.averageWaitTime * currentMetrics.totalAttendances
			const newTotalAttendances = currentMetrics.totalAttendances + 1
			const newAverageWaitTime =
				(totalWaitTime + waitTime) / newTotalAttendances

			await updateDoc(metricRef, {
				todayAttendances,
				totalAttendances: newTotalAttendances,
				averageWaitTime: newAverageWaitTime,
				lastAttendance: now,
				updatedAt: now,
			})
		}
	} catch (error) {
		console.error('Error updating metrics:', error)
		throw error
	}
}
