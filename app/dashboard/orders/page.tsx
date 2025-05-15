import { createServerSupabaseClient } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { OrdersTable } from "@/components/dashboard/orders-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function OrdersPage() {
  const supabase = createServerSupabaseClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get orders
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      payment_method,
      payment_approval_status,
      total_amount,
      created_at,
      bookings(product_id)
    `)
    .eq("user_id", session?.user.id)
    .order("created_at", { ascending: false })

  // Get product names
  const ordersWithProducts = await Promise.all(
    (orders || []).map(async (order) => {
      if (order.bookings && order.bookings.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("name")
          .eq("id", order.bookings.product_id)
          .single()

        return {
          ...order,
          product_name: product?.name || "Unknown Product",
        }
      }
      return {
        ...order,
        product_name: "Unknown Product",
      }
    }),
  )

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader heading="Orders" text="View and manage your orders" />

      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>You have {ordersWithProducts.length} orders in total.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={ordersWithProducts} />
        </CardContent>
      </Card>
    </div>
  )
}
