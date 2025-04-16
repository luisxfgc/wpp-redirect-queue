import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DashboardSkeleton() {
	return (
		<div className='flex min-h-screen flex-col'>
			<header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
				<div className='container flex h-14 items-center justify-between'>
					<div className='mr-4 flex items-center gap-4'>
						<Skeleton className='h-6 w-32' />
					</div>
					<div className='flex items-center gap-2'>
						<Skeleton className='h-9 w-9 rounded-full' />
						<Skeleton className='h-9 w-9 rounded-full' />
					</div>
				</div>
			</header>
			<main className='flex-1'>
				<div className='container py-8'>
					<div className='flex flex-col gap-8'>
						<div className='grid gap-4 md:grid-cols-3'>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-4 w-4' />
								</CardHeader>
								<CardContent>
									<Skeleton className='h-8 w-16' />
								</CardContent>
							</Card>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-4 w-4' />
								</CardHeader>
								<CardContent>
									<Skeleton className='h-8 w-16' />
								</CardContent>
							</Card>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-4 w-4' />
								</CardHeader>
								<CardContent>
									<Skeleton className='h-8 w-16' />
								</CardContent>
							</Card>
						</div>
						<div className='space-y-4'>
							<div className='space-y-0.5'>
								<Skeleton className='h-8 w-48' />
								<Skeleton className='h-4 w-64' />
							</div>
							<div className='rounded-lg border bg-card shadow-sm'>
								<div className='p-6'>
									<div className='space-y-2'>
										{[...Array(3)].map((_, i) => (
											<div
												key={i}
												className='flex items-center justify-between rounded-lg bg-muted p-3'>
												<div className='flex items-center gap-3'>
													<Skeleton className='h-4 w-8' />
													<div className='space-y-1'>
														<Skeleton className='h-4 w-32' />
														<Skeleton className='h-3 w-24' />
													</div>
												</div>
												<div className='flex items-center gap-1'>
													{[...Array(4)].map((_, j) => (
														<Skeleton
															key={j}
															className='h-8 w-8'
														/>
													))}
												</div>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}
