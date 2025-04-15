import { ClerkProvider } from '@clerk/nextjs'
import { Figtree } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './providers'

const figtree = Figtree({ subsets: ['latin'] })

export const metadata = {
  title: 'WPP Redirect Queue',
  description: 'Manage your WhatsApp redirects efficiently',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" suppressHydrationWarning>
        <body className={figtree.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
