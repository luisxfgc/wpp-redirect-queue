import { Settings, Phone, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import Link from 'next/link'

export function SettingsMenu() {
	const { theme, setTheme } = useTheme()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='ghost'
					size='icon'
					className='h-9 w-9'>
					<Settings className='h-4 w-4' />
					<span className='sr-only'>Configurações</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuItem asChild>
					<Link
						href='/phones'
						className='flex items-center'>
						<Phone className='mr-2 h-4 w-4' />
						Gerenciar Números
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
					className='flex items-center'>
					{theme === 'light' ? (
						<>
							<Moon className='mr-2 h-4 w-4' />
							Modo Escuro
						</>
					) : (
						<>
							<Sun className='mr-2 h-4 w-4' />
							Modo Claro
						</>
					)}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
