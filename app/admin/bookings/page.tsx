import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { AdminBookingsTable } from "@/components/admin/bookings-table"
import { getAdminBookings } from "@/lib/admin"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function AdminBookingsPage() {
  try {
    // Ensure user is admin
    await requireAdmin()

    // Get all bookings
    const bookings = await getAdminBookings()

    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Bookings Management</h2>
        </div>

        <div className="space-y-4">
          <AdminBookingsTable bookings={bookings} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in AdminBookingsPage:", error)
    notFound()
  }
}
