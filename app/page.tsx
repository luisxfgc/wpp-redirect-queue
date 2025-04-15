import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"
import Link from "next/link"

export default function Home() {
  return (
    <MainLayout>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to WPP Redirect Queue</CardTitle>
            <CardDescription>
              Manage your WhatsApp redirects efficiently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <p className="text-muted-foreground">
                Sign in to start managing your WhatsApp redirects.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button>Sign In</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </SignedIn>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
}
