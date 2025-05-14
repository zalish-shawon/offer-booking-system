import Link from "next/link"
import { Ban } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function BlockedPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-destructive p-3">
            <Ban className="h-6 w-6 text-destructive-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Account Blocked</h1>
          <p className="text-sm text-muted-foreground">Your account has been blocked by an administrator.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You cannot access the system at this time</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Please contact customer support for assistance with your account.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
