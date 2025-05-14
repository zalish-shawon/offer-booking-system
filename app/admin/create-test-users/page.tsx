"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function CreateTestUsersPage() {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const supabase = createClientComponentClient()

  const createTestUsers = async () => {
    setIsCreating(true)

    try {
      // Create admin user
      const adminEmail = "admin@example.com"
      const adminPassword = "admin123"

      // Check if admin exists
      const { data: existingAdmin } = await supabase.from("profiles").select("*").eq("email", adminEmail).single()

      if (!existingAdmin) {
        // Create admin user
        const { error: adminError } = await supabase.auth.signUp({
          email: adminEmail,
          password: adminPassword,
          options: {
            data: {
              full_name: "System Admin",
            },
          },
        })

        if (adminError) {
          throw new Error(`Failed to create admin user: ${adminError.message}`)
        }

        // Update admin role
        const { error: updateError } = await supabase.from("profiles").update({ role: "admin" }).eq("email", adminEmail)

        if (updateError) {
          throw new Error(`Failed to set admin role: ${updateError.message}`)
        }
      }

      // Create test user
      const testEmail = "user@example.com"
      const testPassword = "user123"

      // Check if test user exists
      const { data: existingUser } = await supabase.from("profiles").select("*").eq("email", testEmail).single()

      if (!existingUser) {
        // Create test user
        const { error: userError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: {
              full_name: "Test User",
            },
          },
        })

        if (userError) {
          throw new Error(`Failed to create test user: ${userError.message}`)
        }
      }

      toast({
        title: "Test users created",
        description: "Admin and test users have been created successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error creating test users",
        description: error.message || "An error occurred while creating test users.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create Test Users</CardTitle>
          <CardDescription>Create admin and test users for the system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will create the following users if they don't already exist:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>
              <strong>Admin User</strong>
              <br />
              Email: admin@example.com
              <br />
              Password: admin123
            </li>
            <li>
              <strong>Test User</strong>
              <br />
              Email: user@example.com
              <br />
              Password: user123
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button onClick={createTestUsers} disabled={isCreating} className="w-full">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Users...
              </>
            ) : (
              "Create Test Users"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
