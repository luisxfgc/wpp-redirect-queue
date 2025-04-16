import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string): string {
	// Remove todos os caracteres não numéricos
	const cleaned = phone.replace(/\D/g, '')

	// Verifica se o número tem o formato correto (11 dígitos com 9)
	if (cleaned.length === 11) {
		return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(
			3,
			7
		)}-${cleaned.slice(7)}`
	}

	// Se não tiver 11 dígitos, retorna o número original
	return phone
}
