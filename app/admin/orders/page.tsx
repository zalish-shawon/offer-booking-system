import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { AdminOrdersTable } from "@/components/admin/orders-table"
import { getAdminOrders } from "@/lib/admin"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function AdminOrdersPage() {
  try {
    // Ensure user is admin
    await requireAdmin()

    // Get all orders
    const orders = await getAdminOrders()

    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
        </div>

        <div className="space-y-4">
          <AdminOrdersTable orders={orders} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in AdminOrdersPage:", error)
    notFound()
  }
}
