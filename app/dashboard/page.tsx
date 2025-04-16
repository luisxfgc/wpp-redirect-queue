'use client'

import { UserButton } from '@clerk/nextjs'
import { SettingsMenu } from '@/components/ui/settings-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	ArrowDown,
	ArrowDownToLine,
	ArrowUp,
	ArrowUpToLine,
	Phone,
	Users,
	Clock,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'

interface Metrics {
	totalPhones: number
	totalNumbers: number
	averageWaitTime: string
}

interface QueueNumber {
	id: string
	phoneId: string
	name: string
	number: string
	position: number
}

export default function DashboardPage() {
	const [metrics, setMetrics] = useState<Metrics>({
		totalPhones: 0,
		totalNumbers: 0,
		averageWaitTime: '0min',
	})
	const [queueNumbers, setQueueNumbers] = useState<QueueNumber[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const { toast } = useToast()

	useEffect(() => {
		let isMounted = true
		let lastFetchTime = 0
		const CACHE_DURATION = 10000 // 10 segundos

		async function fetchData() {
			try {
				const now = Date.now()
				// Só faz uma nova requisição se passou mais tempo que o cache duration
				if (now - lastFetchTime < CACHE_DURATION) {
					return
				}
				lastFetchTime = now

				const response = await fetch('/api/dashboard', {
					cache: 'no-store',
					headers: {
						'Content-Type': 'application/json',
					},
				})

				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.error || 'Failed to fetch data')
				}

				const data = await response.json()
				if (!isMounted) return

				setMetrics(data.metrics)
				setQueueNumbers(data.queue)
			} catch (error) {
				console.error('Error fetching data:', error)
				toast({
					variant: 'destructive',
					title: 'Erro',
					description:
						error instanceof Error
							? error.message
							: 'Não foi possível carregar os dados.',
				})
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		fetchData()

		// Atualiza a cada 30 segundos
		const interval = setInterval(fetchData, 30000)

		return () => {
			isMounted = false
			clearInterval(interval)
		}
	}, [toast])

	async function moveNumber(id: string, phoneId: string, direction: string) {
		try {
			const response = await fetch('/api/queue/move', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id, phoneId, direction }),
			})

			if (!response.ok) {
				throw new Error('Failed to move number')
			}

			const updatedQueue = await response.json()
			setQueueNumbers(updatedQueue)

			toast({
				title: 'Sucesso',
				description: 'Número movido com sucesso.',
			})
		} catch (error) {
			console.error('Error moving number:', error)
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: 'Não foi possível mover o número.',
			})
		}
	}

	if (isLoading) {
		return <DashboardSkeleton />
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='container flex h-14 items-center justify-between'>
					<div className='mr-4 flex items-center gap-4'>
						<Link
							href='/'
							className='flex items-center space-x-2'>
							<span className='font-bold'>WPP Redirect Queue</span>
						</Link>
					</div>
					<div className='flex items-center gap-2'>
						<SettingsMenu />
						<UserButton afterSignOutUrl='/' />
					</div>
				</div>
			</header>
			<main className='flex-1'>
				<div className='container py-8'>
					<div className='flex flex-col gap-8'>
						<div className='grid gap-4 md:grid-cols-3'>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<CardTitle className='text-sm font-medium'>
										Total de Números
									</CardTitle>
									<Phone className='h-4 w-4 text-primary' />
								</CardHeader>
								<CardContent>
									<div className='text-2xl font-bold'>
										{metrics.totalPhones}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<CardTitle className='text-sm font-medium'>
										Pessoas na Fila
									</CardTitle>
									<Users className='h-4 w-4 text-primary' />
								</CardHeader>
								<CardContent>
									<div className='text-2xl font-bold'>
										{metrics.totalNumbers}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<CardTitle className='text-sm font-medium'>
										Tempo Médio de Espera
									</CardTitle>
									<Clock className='h-4 w-4 text-primary' />
								</CardHeader>
								<CardContent>
									<div className='text-2xl font-bold'>
										{metrics.averageWaitTime}
									</div>
								</CardContent>
							</Card>
						</div>
						<div className='space-y-4'>
							<div className='space-y-0.5'>
								<h2 className='text-2xl font-semibold'>Ordem da Fila</h2>
								<p className='text-sm text-muted-foreground'>
									Gerencie a ordem dos números na fila de atendimento
								</p>
							</div>
							<div className='rounded-lg border bg-card shadow-sm'>
								<div className='p-6'>
									{queueNumbers.length === 0 ? (
										<p className='text-center py-4 text-muted-foreground'>
											Nenhum número na fila no momento
										</p>
									) : (
										<div className='space-y-2'>
											{queueNumbers.map((number) => (
												<div
													key={number.id}
													className='flex items-center justify-between rounded-lg bg-muted p-3'>
													<div className='flex items-center gap-3'>
														<span className='text-sm font-medium text-muted-foreground'>
															#{number.position}
														</span>
														<div>
															<p className='text-sm text-muted-foreground'>
																{number.name}
															</p>
															<p className='text-lg font-medium'>
																{number.number}
															</p>
														</div>
													</div>
													<div className='flex items-center gap-1'>
														<Button
															variant='ghost'
															size='icon'
															onClick={() =>
																moveNumber(number.id, number.phoneId, 'top')
															}
															className='h-8 w-8'>
															<ArrowUpToLine className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() =>
																moveNumber(number.id, number.phoneId, 'up')
															}
															className='h-8 w-8'>
															<ArrowUp className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() =>
																moveNumber(number.id, number.phoneId, 'down')
															}
															className='h-8 w-8'>
															<ArrowDown className='h-4 w-4' />
														</Button>
														<Button
															variant='ghost'
															size='icon'
															onClick={() =>
																moveNumber(number.id, number.phoneId, 'bottom')
															}
															className='h-8 w-8'>
															<ArrowDownToLine className='h-4 w-4' />
														</Button>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
