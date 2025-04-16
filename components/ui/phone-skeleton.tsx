import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export function PhoneSkeleton() {
	return (
		<Card className='shadow-none border-0 bg-secondary/80'>
			<CardContent className='px-6 py-3'>
				<div className='flex items-center justify-between'>
					<div className='space-y-1.5'>
						<Skeleton className='h-6 w-32' />
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-3 w-36' />
					</div>
					<div className='flex items-center gap-2'>
						<Skeleton className='h-2 w-2 rounded-full' />
						<Skeleton className='h-4 w-16' />
						<div className='flex items-center gap-1.5'>
							<Skeleton className='h-7 w-7 rounded-md' />
							<Skeleton className='h-7 w-7 rounded-md' />
							<Skeleton className='h-5 w-9 rounded-full' />
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
