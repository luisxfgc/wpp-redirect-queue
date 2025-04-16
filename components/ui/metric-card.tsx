import { cn } from '@/lib/utils'

interface MetricCardProps {
	title: string
	value: string | number
	description?: string
	icon?: React.ReactNode
	className?: string
}

export function MetricCard({
	title,
	value,
	description,
	icon,
	className,
}: MetricCardProps) {
	return (
		<div
			className={cn(
				'p-6 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow',
				className
			)}>
			<div className='flex items-center justify-between'>
				<h3 className='text-sm font-medium text-muted-foreground'>{title}</h3>
				{icon}
			</div>
			<div className='mt-2'>
				<p className='text-2xl font-semibold'>{value}</p>
				{description && (
					<p className='text-xs text-muted-foreground mt-1'>{description}</p>
				)}
			</div>
		</div>
	)
}
