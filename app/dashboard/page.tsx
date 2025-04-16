'use client'

import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
	Phone,
	Users,
	Clock,
	Plus,
	Loader2,
	Pencil,
	Trash2,
	Sun,
	Moon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTheme } from 'next-themes'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Phone {
	id: string
	userId: string
	name: string
	number: string
	online: boolean
	lastOnlineChange: string
}

interface DashboardMetrics {
	totalPhones: number
	onlinePhones: number
	lastConnection: string
}

export default function DashboardPage() {
	const [phones, setPhones] = useState<Phone[]>([])
	const [metrics, setMetrics] = useState<DashboardMetrics>({
		totalPhones: 0,
		onlinePhones: 0,
		lastConnection: '',
	})
	const [loading, setLoading] = useState(true)
	const [newPhone, setNewPhone] = useState({ name: '', number: '' })
	const [editingPhone, setEditingPhone] = useState<Phone | null>(null)
	const [deletePhone, setDeletePhone] = useState<Phone | null>(null)
	const [addDialogOpen, setAddDialogOpen] = useState(false)
	const { toast } = useToast()
	const { theme, setTheme } = useTheme()

	const formatLastOnline = (date: string) => {
		const formattedDistance = formatDistanceToNow(new Date(date), {
			locale: ptBR,
			addSuffix: true,
		})
		return formattedDistance.replace('cerca de ', '')
	}

	const fetchData = async () => {
		try {
			setLoading(true)
			const [phonesResponse, metricsResponse] = await Promise.all([
				fetch('/api/phones'),
				fetch('/api/dashboard'),
			])

			if (!phonesResponse.ok) throw new Error('Failed to fetch phones')
			if (!metricsResponse.ok) throw new Error('Failed to fetch metrics')

			const phonesData = await phonesResponse.json()
			const metricsData = await metricsResponse.json()

			setPhones(phonesData)
			setMetrics(metricsData)
			setLoading(false)
		} catch (error) {
			console.error('Error fetching data:', error)
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: 'Erro ao carregar dados',
			})
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchData()
		// Atualizar a cada 30 segundos
		const interval = setInterval(fetchData, 30000)
		return () => clearInterval(interval)
	}, [])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		try {
			const response = await fetch('/api/phones', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(newPhone),
			})

			if (!response.ok) throw new Error('Failed to create phone')

			setNewPhone({ name: '', number: '' })
			setAddDialogOpen(false)
			await fetchData()

			toast({
				title: 'Sucesso',
				description: 'Número adicionado com sucesso',
			})
		} catch (error) {
			console.error('Error creating phone:', error)
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: 'Erro ao adicionar número',
			})
		}
	}

	const handleEdit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!editingPhone) return

		try {
			const response = await fetch(`/api/phones/${editingPhone.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: editingPhone.name,
					number: editingPhone.number,
				}),
			})

			if (!response.ok) throw new Error('Failed to update phone')

			setEditingPhone(null)
			await fetchData()

			toast({
				title: 'Sucesso',
				description: 'Número atualizado com sucesso',
			})
		} catch (error) {
			console.error('Error updating phone:', error)
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: 'Erro ao atualizar número',
			})
		}
	}

	const handleDelete = async () => {
		if (!deletePhone) return

		try {
			const response = await fetch(`/api/phones/${deletePhone.id}`, {
				method: 'DELETE',
			})

			if (!response.ok) throw new Error('Failed to delete phone')

			setDeletePhone(null)
			await fetchData()

			toast({
				title: 'Sucesso',
				description: 'Número excluído com sucesso',
			})
		} catch (error) {
			console.error('Error deleting phone:', error)
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: 'Erro ao excluir número',
			})
		}
	}

	const toggleStatus = async (phone: Phone) => {
		try {
			const response = await fetch(`/api/phones/${phone.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ online: !phone.online }),
			})

			if (!response.ok) throw new Error('Failed to update phone')
			await fetchData()

			toast({
				title: 'Sucesso',
				description: 'Status atualizado com sucesso',
			})
		} catch (error) {
			console.error('Error updating phone:', error)
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: 'Erro ao atualizar status',
			})
		}
	}

	const onlinePhones = phones.filter((phone) => phone.online)
	const offlinePhones = phones.filter((phone) => !phone.online)

	if (loading) {
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
					<div className='flex items-center gap-4'>
						<Button
							variant='ghost'
							size='icon'
							onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
							{theme === 'dark' ? (
								<Sun className='h-5 w-5' />
							) : (
								<Moon className='h-5 w-5' />
							)}
						</Button>
						<div className='h-6 w-px bg-border' />
						<UserButton afterSignOutUrl='/' />
					</div>
				</div>
			</header>

			<div className='container py-8'>
				<div className='flex flex-col gap-8'>
					<div className='grid gap-4 md:grid-cols-3'>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									Total de Números
								</CardTitle>
								<Phone className='h-6 w-6 text-primary' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>{metrics.totalPhones}</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									Números Online
								</CardTitle>
								<Users className='h-6 w-6 text-primary' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>{metrics.onlinePhones}</div>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
								<CardTitle className='text-sm font-medium'>
									Última Conexão
								</CardTitle>
								<Clock className='h-6 w-6 text-primary' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{metrics.lastConnection
										? formatLastOnline(metrics.lastConnection)
										: 'Nunca'}
								</div>
							</CardContent>
						</Card>
					</div>

					<div className='flex justify-between items-center'>
						<div className='space-y-0.5'>
							<h2 className='text-2xl font-semibold'>Gerenciar Números</h2>
							<p className='text-sm text-muted-foreground'>
								Adicione e gerencie seus números do WhatsApp
							</p>
						</div>
						<Dialog
							open={addDialogOpen}
							onOpenChange={(open) => {
								setAddDialogOpen(open)
								if (!open) setNewPhone({ name: '', number: '' })
							}}>
							<DialogTrigger asChild>
								<Button>
									<Plus className='w-4 h-4 mr-2' />
									Adicionar Número
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Adicionar Novo Número</DialogTitle>
								</DialogHeader>
								<form
									onSubmit={handleSubmit}
									className='space-y-4'>
									<div className='space-y-2'>
										<Label htmlFor='name'>Nome</Label>
										<Input
											id='name'
											value={newPhone.name}
											onChange={(e) =>
												setNewPhone((prev) => ({
													...prev,
													name: e.target.value,
												}))
											}
											placeholder='Ex: Atendimento 1'
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='number'>Número</Label>
										<Input
											id='number'
											value={newPhone.number}
											onChange={(e) =>
												setNewPhone((prev) => ({
													...prev,
													number: e.target.value,
												}))
											}
											placeholder='Ex: 5577988887777'
										/>
									</div>
									<div className='flex gap-2 justify-end'>
										<Button
											type='button'
											variant='outline'
											onClick={() => {
												setNewPhone({ name: '', number: '' })
												setAddDialogOpen(false)
											}}>
											Cancelar
										</Button>
										<Button type='submit'>Adicionar</Button>
									</div>
								</form>
							</DialogContent>
						</Dialog>
					</div>

					{phones.length === 0 ? (
						<p className='text-center py-4 text-muted-foreground'>
							Nenhum número cadastrado
						</p>
					) : (
						<div className='space-y-6'>
							{onlinePhones.length > 0 && (
								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Números Online</h3>
									<div className='space-y-2'>
										{onlinePhones.map((phone) => (
											<PhoneCard
												key={phone.id}
												phone={phone}
												onToggle={() => toggleStatus(phone)}
												onEdit={() => setEditingPhone(phone)}
												onDelete={() => setDeletePhone(phone)}
												formatLastOnline={formatLastOnline}
											/>
										))}
									</div>
								</div>
							)}

							{offlinePhones.length > 0 && (
								<div className='space-y-4'>
									<h3 className='text-lg font-semibold'>Números Offline</h3>
									<div className='space-y-2'>
										{offlinePhones.map((phone) => (
											<PhoneCard
												key={phone.id}
												phone={phone}
												onToggle={() => toggleStatus(phone)}
												onEdit={() => setEditingPhone(phone)}
												onDelete={() => setDeletePhone(phone)}
												formatLastOnline={formatLastOnline}
											/>
										))}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Edit Dialog */}
					<Dialog
						open={!!editingPhone}
						onOpenChange={(open) => {
							if (!open) setEditingPhone(null)
						}}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Editar Número</DialogTitle>
							</DialogHeader>
							<form
								onSubmit={handleEdit}
								className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='edit-name'>Nome</Label>
									<Input
										id='edit-name'
										value={editingPhone?.name || ''}
										onChange={(e) =>
											setEditingPhone((prev) =>
												prev ? { ...prev, name: e.target.value } : null
											)
										}
										placeholder='Ex: Atendimento 1'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='edit-number'>Número</Label>
									<Input
										id='edit-number'
										value={editingPhone?.number || ''}
										onChange={(e) =>
											setEditingPhone((prev) =>
												prev ? { ...prev, number: e.target.value } : null
											)
										}
										placeholder='Ex: 5577988887777'
									/>
								</div>
								<div className='flex gap-2 justify-end'>
									<Button
										type='button'
										variant='outline'
										onClick={() => setEditingPhone(null)}>
										Cancelar
									</Button>
									<Button type='submit'>Salvar</Button>
								</div>
							</form>
						</DialogContent>
					</Dialog>

					{/* Delete Dialog */}
					<AlertDialog
						open={!!deletePhone}
						onOpenChange={(open) => {
							if (!open) setDeletePhone(null)
						}}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Excluir Número</AlertDialogTitle>
								<AlertDialogDescription>
									Tem certeza que deseja excluir o número {deletePhone?.name}?
									Esta ação não pode ser desfeita.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel onClick={() => setDeletePhone(null)}>
									Cancelar
								</AlertDialogCancel>
								<AlertDialogAction onClick={handleDelete}>
									Excluir
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	)
}

interface PhoneCardProps {
	phone: Phone
	onToggle: () => void
	onEdit: () => void
	onDelete: () => void
	formatLastOnline: (date: string) => string
}

function PhoneCard({
	phone,
	onToggle,
	onEdit,
	onDelete,
	formatLastOnline,
}: PhoneCardProps) {
	return (
		<div className='flex items-center justify-between rounded-lg bg-muted p-4'>
			<div className='space-y-1.5'>
				<div className='flex items-center gap-2'>
					<p className='text-base font-medium text-muted-foreground'>
						{phone.name}
					</p>
					<div
						className={`h-2.5 w-2.5 rounded-full ${
							phone.online ? 'bg-green-500' : 'bg-red-500'
						}`}
					/>
				</div>
				<p className='text-lg font-semibold'>{phone.number}</p>
				<p className='text-xs text-muted-foreground/75'>
					Última alteração {formatLastOnline(phone.lastOnlineChange)}
				</p>
			</div>
			<div className='flex items-center gap-6'>
				<div className='flex items-center gap-2'>
					<Switch
						checked={phone.online}
						onCheckedChange={onToggle}
						className='data-[state=checked]:bg-green-500'
					/>
					<span className='text-sm font-medium'>
						{phone.online ? 'Online' : 'Offline'}
					</span>
				</div>
				<div className='flex items-center'>
					<Button
						variant='ghost'
						size='icon'
						onClick={onEdit}
						className='h-9 w-9 text-muted-foreground hover:text-foreground'>
						<Pencil className='h-4 w-4' />
					</Button>
					<Button
						variant='ghost'
						size='icon'
						onClick={onDelete}
						className='h-9 w-9 text-muted-foreground'>
						<Trash2 className='h-4 w-4' />
					</Button>
				</div>
			</div>
		</div>
	)
}
