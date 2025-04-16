'use client'

import { useState, useEffect } from 'react'
import { UserButton } from '@clerk/nextjs'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
	Moon,
	Sun,
	Plus,
	Pencil,
	Trash2,
	ChevronDown,
	ArrowLeft,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion'
import { PhoneSkeleton } from '@/components/ui/phone-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
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
import { formatPhoneNumber } from '@/lib/utils'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

interface Phone {
	id: string
	number: string
	name?: string
	online: boolean
	lastOnline: string
	lastOnlineChange: string
	lastOffline: string | null
	createdAt: string
}

export default function PhonesPage() {
	const [mounted, setMounted] = useState(false)
	const [phones, setPhones] = useState<Phone[]>([])
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
	const [phoneToDelete, setPhoneToDelete] = useState<Phone | null>(null)
	const [editingPhone, setEditingPhone] = useState<Phone | null>(null)
	const [newPhone, setNewPhone] = useState({ number: '', name: '' })
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [numberError, setNumberError] = useState<string | null>(null)
	const { theme, setTheme } = useTheme()
	const { toast } = useToast()

	const formatLastOnline = (date: string) => {
		const formattedDistance = formatDistanceToNow(new Date(date), {
			locale: ptBR,
			addSuffix: true,
		})
		return formattedDistance.replace('cerca de ', '')
	}

	const fetchPhones = async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/phones')
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || 'Erro ao carregar números')
			}
			const data = await response.json()
			setPhones(data)
		} catch (error) {
			console.error('Error fetching phones:', error)
			const errorMessage =
				error instanceof Error ? error.message : 'Erro ao carregar números'
			setError(errorMessage)
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: errorMessage,
			})
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchPhones()
	}, [])

	useEffect(() => {
		setMounted(true)
		return () => setMounted(false)
	}, [])

	if (!mounted) {
		return null
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setNumberError(null)

		try {
			// Verificar se o número já existe
			if (!editingPhone) {
				const existingPhone = phones.find(
					(phone) => phone.number === newPhone.number
				)
				if (existingPhone) {
					setNumberError('Este número já está cadastrado no sistema')
					toast({
						variant: 'destructive',
						title: 'Número já existe',
						description: 'Este número já está cadastrado no sistema.',
					})
					return
				}
			}

			const response = await fetch('/api/phones', {
				method: editingPhone ? 'PATCH' : 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(
					editingPhone
						? {
								id: editingPhone.id,
								name: newPhone.name,
								number: newPhone.number,
						  }
						: newPhone
				),
			})

			if (!response.ok) {
				const errorData = await response.json()
				const errorMessage =
					errorData.error ||
					(editingPhone
						? 'Erro ao atualizar número'
						: 'Erro ao adicionar número')
				setNumberError(errorMessage)
				throw new Error(errorMessage)
			}

			await fetchPhones()
			setIsDialogOpen(false)
			setNewPhone({ number: '', name: '' })
			setEditingPhone(null)
			setNumberError(null)

			toast({
				title: editingPhone ? 'Número atualizado' : 'Número adicionado',
				description: editingPhone
					? 'O número foi atualizado com sucesso.'
					: 'O número foi adicionado com sucesso.',
			})
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Ocorreu um erro'
			setError(errorMessage)
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: errorMessage,
			})
		} finally {
			setLoading(false)
		}
	}

	const handleEdit = (phone: Phone) => {
		setEditingPhone(phone)
		setNewPhone({ number: phone.number, name: phone.name || '' })
		setIsDialogOpen(true)
	}

	const handleDelete = async (phone: Phone) => {
		setPhoneToDelete(phone)
		setIsDeleteDialogOpen(true)
	}

	const confirmDelete = async () => {
		if (!phoneToDelete) return

		try {
			const response = await fetch('/api/phones', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id: phoneToDelete.id }),
			})

			if (!response.ok) {
				throw new Error('Erro ao deletar número')
			}

			await fetchPhones()
			setIsDeleteDialogOpen(false)
			setPhoneToDelete(null)
		} catch (error) {
			setError('Erro ao deletar número')
		}
	}

	const handleBulkStatusChange = async (
		newStatus: boolean,
		phonesToUpdate: Phone[]
	) => {
		if (!phonesToUpdate || phonesToUpdate.length === 0) {
			toast({
				variant: 'destructive',
				title: 'Erro',
				description: 'Nenhum número selecionado para atualização.',
			})
			return
		}

		setLoading(true)
		try {
			console.log(
				'Updating status for phones:',
				phonesToUpdate.map((p) => p.id)
			)

			// Atualizar o estado local imediatamente para feedback visual
			setPhones((prevPhones) =>
				prevPhones.map((phone) => {
					if (phonesToUpdate.some((p) => p.id === phone.id)) {
						return {
							...phone,
							online: newStatus,
							lastOnlineChange: new Date().toISOString(),
							lastOnline: newStatus
								? new Date().toISOString()
								: phone.lastOnline,
							lastOffline: !newStatus
								? new Date().toISOString()
								: phone.lastOffline,
						}
					}
					return phone
				})
			)

			// Fazer as requisições para a API
			const responses = await Promise.all(
				phonesToUpdate.map((phone) =>
					fetch('/api/phones', {
						method: 'PATCH',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							id: phone.id,
							online: newStatus,
						}),
					})
				)
			)

			// Verificar se todas as respostas foram bem sucedidas
			const allSuccessful = responses.every((response) => response.ok)
			if (!allSuccessful) {
				// Se alguma requisição falhou, buscar os dados atualizados do servidor
				await fetchPhones()
				throw new Error(
					'Algumas atualizações falharam. Os dados foram atualizados.'
				)
			}

			toast({
				title: 'Status atualizado',
				description: `O status dos números foi atualizado para ${
					newStatus ? 'online' : 'offline'
				}.`,
			})
		} catch (error) {
			console.error('Error updating phone status:', error)
			toast({
				variant: 'destructive',
				title: 'Erro ao atualizar status',
				description:
					error instanceof Error
						? error.message
						: 'Ocorreu um erro ao atualizar o status dos números.',
			})
		} finally {
			setLoading(false)
		}
	}

	const onlinePhones = phones.filter((phone) => phone.online)
	const offlinePhones = phones.filter((phone) => !phone.online)

	return (
		<div className='min-h-screen bg-background'>
			<Toaster />
			<nav className='sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8 border-b'>
				<div className='container flex h-16 items-center max-w-5xl'>
					<div className='flex items-center gap-4'>
						<Link href='/dashboard'>
							<Button
								variant='ghost'
								size='icon'
								className='rounded-full w-10 h-10'>
								<ArrowLeft className='h-5 w-5' />
								<span className='sr-only'>Voltar para dashboard</span>
							</Button>
						</Link>
						<h1 className='text-xl font-semibold'>WPP Redirect</h1>
					</div>
					<div className='ml-auto flex items-center gap-4'>
						<Button
							onClick={() => {
								setEditingPhone(null)
								setNewPhone({ number: '', name: '' })
								setIsDialogOpen(true)
							}}
							variant='default'
							size='default'
							className='h-9 px-4 rounded-full'>
							<Plus
								className='h-4 w-4 mr-2'
								strokeWidth={2.5}
							/>
							<span>Novo Número</span>
						</Button>
						<Button
							variant='ghost'
							size='icon'
							className='rounded-full w-10 h-10'
							onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
							<span className='sr-only'>Alternar tema</span>
							{mounted &&
								(theme === 'light' ? (
									<Sun className='h-5 w-5' />
								) : (
									<Moon className='h-5 w-5' />
								))}
						</Button>
						<UserButton afterSignOutUrl='/' />
					</div>
				</div>
			</nav>

			<main className='container py-8 max-w-5xl'>
				<AnimatePresence>
					{error && (
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							className='mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm'>
							{error}
						</motion.div>
					)}
				</AnimatePresence>

				<div className='space-y-3'>
					{loading ? (
						<>
							<div className='mb-12'>
								<div className='flex items-center justify-between mb-6'>
									<Skeleton className='h-6 w-48' />
									<Skeleton className='h-8 w-32' />
								</div>
								<div className='space-y-2'>
									{[1, 2, 3].map((i) => (
										<PhoneSkeleton key={i} />
									))}
								</div>
							</div>
							<div>
								<div className='flex items-center justify-between mb-6'>
									<Skeleton className='h-6 w-48' />
									<Skeleton className='h-8 w-32' />
								</div>
								<div className='space-y-2'>
									{[1, 2, 3].map((i) => (
										<PhoneSkeleton key={i} />
									))}
								</div>
							</div>
						</>
					) : (
						<>
							{onlinePhones.length > 0 && (
								<div className='mb-12'>
									<div className='flex items-center justify-between mb-6'>
										<h2 className='text-lg font-medium'>
											Números Online ({onlinePhones.length})
										</h2>
										<Button
											variant='outline'
											size='sm'
											className='h-8'
											onClick={() =>
												handleBulkStatusChange(false, onlinePhones)
											}
											disabled={loading}>
											Desativar Todos
										</Button>
									</div>
									<div className='space-y-2'>
										{onlinePhones.map((phone) => (
											<motion.div
												key={phone.id}
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}>
												<Card className='shadow-none border-0 bg-secondary/80 hover:bg-secondary/60 transition-colors'>
													<CardContent className='px-6 py-3'>
														<div className='flex items-center justify-between'>
															<div className='space-y-0.5'>
																<p className='text-lg font-medium text-foreground'>
																	{formatPhoneNumber(phone.number)}
																</p>
																<h3 className='text-base font-medium text-foreground'>
																	{phone.name || 'Sem nome'}
																</h3>
																<p className='text-xs text-muted-foreground'>
																	Online{' '}
																	{formatLastOnline(phone.lastOnlineChange)}
																</p>
															</div>
															<div className='flex items-center gap-2'>
																<div className='h-2 w-2 rounded-full bg-primary' />
																<span className='text-sm font-medium text-primary'>
																	Online
																</span>
																<div className='flex items-center gap-1.5'>
																	<Button
																		variant='ghost'
																		size='icon'
																		className='h-7 w-7 hover:bg-white/20 text-white'
																		onClick={() => handleEdit(phone)}>
																		<Pencil className='h-3.5 w-3.5' />
																	</Button>
																	<Button
																		variant='ghost'
																		size='icon'
																		className='h-7 w-7 hover:bg-white/20 text-white'
																		onClick={() => handleDelete(phone)}>
																		<Trash2 className='h-3.5 w-3.5' />
																	</Button>
																	<Switch
																		id={`status-${phone.id}`}
																		checked={phone.online}
																		onCheckedChange={(checked) =>
																			handleBulkStatusChange(checked, [phone])
																		}
																		className='data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30 dark:data-[state=unchecked]:bg-muted-foreground/20 h-5 w-9'
																	/>
																</div>
															</div>
														</div>
													</CardContent>
												</Card>
											</motion.div>
										))}
									</div>
								</div>
							)}

							{offlinePhones.length > 0 && (
								<Accordion
									type='single'
									collapsible
									defaultValue='offline'>
									<AccordionItem
										value='offline'
										className='border-none'>
										<div className='flex items-center justify-between mb-6'>
											<AccordionTrigger className='p-0 hover:no-underline'>
												<h2 className='text-lg font-medium'>
													Números Offline ({offlinePhones.length})
												</h2>
											</AccordionTrigger>
											<Button
												variant='outline'
												size='sm'
												className='h-8'
												onClick={() =>
													handleBulkStatusChange(true, offlinePhones)
												}
												disabled={loading}>
												Ativar Todos
											</Button>
										</div>
										<AccordionContent>
											<div className='space-y-2'>
												{offlinePhones.map((phone) => (
													<motion.div
														key={phone.id}
														initial={{ opacity: 0 }}
														animate={{ opacity: 1 }}
														exit={{ opacity: 0 }}>
														<Card className='shadow-none border-0 bg-muted hover:bg-muted/60 transition-colors'>
															<CardContent className='px-4 py-2'>
																<div className='flex items-center justify-between'>
																	<div className='space-y-0.5'>
																		<p className='text-lg font-medium text-foreground'>
																			{formatPhoneNumber(phone.number)}
																		</p>
																		<h3 className='text-sm text-muted-foreground'>
																			{phone.name || 'Sem nome'}
																		</h3>
																		<p className='text-xs text-muted-foreground'>
																			Offline{' '}
																			{formatLastOnline(phone.lastOnlineChange)}
																		</p>
																	</div>
																	<div className='flex items-center gap-2'>
																		<div className='h-2 w-2 rounded-full bg-muted-foreground/50' />
																		<span className='text-sm font-medium text-muted-foreground'>
																			Offline
																		</span>
																		<div className='flex items-center gap-1.5'>
																			<Button
																				variant='ghost'
																				size='icon'
																				className='h-7 w-7 hover:bg-muted-foreground/10'
																				onClick={() => handleEdit(phone)}>
																				<Pencil className='h-3.5 w-3.5' />
																			</Button>
																			<Button
																				variant='ghost'
																				size='icon'
																				className='h-7 w-7 hover:bg-muted-foreground/10'
																				onClick={() => handleDelete(phone)}>
																				<Trash2 className='h-3.5 w-3.5' />
																			</Button>
																			<Switch
																				id={`status-${phone.id}`}
																				checked={phone.online}
																				onCheckedChange={(checked) =>
																					handleBulkStatusChange(checked, [
																						phone,
																					])
																				}
																				className='data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30 dark:data-[state=unchecked]:bg-muted-foreground/20 h-5 w-9'
																			/>
																		</div>
																	</div>
																</div>
															</CardContent>
														</Card>
													</motion.div>
												))}
											</div>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							)}

							{phones.length === 0 && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className='text-center py-16'>
									<p className='text-muted-foreground text-lg'>
										Nenhum número registrado
									</p>
									<Button
										onClick={() => setIsDialogOpen(true)}
										variant='outline'
										className='mt-6'>
										<Plus className='h-4 w-4 mr-2' />
										Adicionar número
									</Button>
								</motion.div>
							)}
						</>
					)}
				</div>
			</main>

			<Dialog
				open={isDialogOpen}
				onOpenChange={(open) => {
					setIsDialogOpen(open)
					if (!open) {
						setTimeout(() => {
							setEditingPhone(null)
							setNewPhone({ number: '', name: '' })
							setNumberError(null)
						}, 150)
					}
				}}>
				<DialogContent className='sm:max-w-[425px]'>
					<DialogHeader>
						<DialogTitle>
							{editingPhone ? 'Editar número' : 'Adicionar novo número'}
						</DialogTitle>
						<DialogDescription>
							{editingPhone
								? 'Faça as alterações necessárias no número.'
								: 'Adicione um novo número ao sistema.'}
						</DialogDescription>
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
									setNewPhone({ ...newPhone, name: e.target.value })
								}
								placeholder='Nome do número'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='number'>Número</Label>
							<Input
								id='number'
								value={newPhone.number}
								onChange={(e) => {
									setNewPhone({ ...newPhone, number: e.target.value })
									setNumberError(null)
								}}
								placeholder='Número de telefone'
								className={
									numberError
										? 'border-destructive focus-visible:ring-destructive'
										: ''
								}
							/>
							{numberError && (
								<p className='text-sm text-destructive'>{numberError}</p>
							)}
						</div>
						<DialogFooter>
							<Button
								type='submit'
								disabled={loading}>
								{loading
									? 'Salvando...'
									: editingPhone
									? 'Salvar'
									: 'Adicionar'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza que deseja excluir o número {phoneToDelete?.number}?
							Esta ação não pode ser desfeita.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmDelete}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
