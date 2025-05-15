"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function RecentOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      const supabase = createClientSupabaseClient()

      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Get recent orders
      const { data } = await supabase
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
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      // Get product names
      if (data && data.length > 0) {
        const ordersWithProducts = await Promise.all(
          data.map(async (order) => {
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

        setOrders(ordersWithProducts)
      } else {
        setOrders([])
      }

      setLoading(false)
    }

    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return <p className="text-center text-muted-foreground">No orders found.</p>
  }

  return (
    <div className="space-y-8">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center">
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{order.product_name}</p>
            <p className="text-sm text-muted-foreground">${Number(order.total_amount).toFixed(2)}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge
              variant={
                order.status === "paid" || order.status === "shipped" || order.status === "delivered"
                  ? "default"
                  : order.status === "pending"
                    ? "secondary"
                    : "destructive"
              }
            >
              {order.status}
            </Badge>
            <Link href={`/dashboard/orders/${order.id}`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
