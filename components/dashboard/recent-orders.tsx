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
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          created_at,
          bookings(product_id)
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error fetching recent orders:", error)
        setLoading(false)
        return
      }

      // Get product names
      const ordersWithProducts = await Promise.all(
        (data || []).map(async (order) => {
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
      setLoading(false)
    }

    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <Skeleton className="h-8 w-[80px]" />
          </div>
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return <p className="text-center py-4">No orders found.</p>
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">{order.product_name}</p>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
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
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/orders/${order.id}`}>View</Link>
          </Button>
        </div>
      ))}
      <div className="mt-4 text-center">
        <Button asChild variant="outline">
          <Link href="/dashboard/orders">View All Orders</Link>
        </Button>
      </div>
    </div>
  )
}
