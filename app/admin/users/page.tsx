import { notFound } from "next/navigation"
import { Plus } from "lucide-react"
import { requireAdmin } from "@/lib/auth"
import { AdminUsersTable } from "@/components/admin/users-table"
import { getAllUsers } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  try {
    // Ensure user is admin
    await requireAdmin()

    // Get all users
    const users = await getAllUsers()

    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <Button asChild>
            <Link href="/admin/users/add">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <AdminUsersTable users={users} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in AdminUsersPage:", error)
    notFound()
  }
}
