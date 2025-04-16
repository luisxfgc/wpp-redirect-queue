import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
	title: 'WPP Redirect Queue',
	description: 'Gerenciamento de fila de redirecionamento do WhatsApp',
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<ClerkProvider>
			<html
				lang='pt-BR'
				suppressHydrationWarning>
				<body className='font-sans antialiased'>
					<ThemeProvider
						attribute='class'
						defaultTheme='system'
						enableSystem>
						{children}
						<Toaster />
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	)
}
