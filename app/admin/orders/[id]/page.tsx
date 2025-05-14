"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { getOrderById, updateOrderPaymentTime } from "@/lib/admin-actions"

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [newExpiryHours, setNewExpiryHours] = useState(48)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(params.id)
        setOrder(data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch order details",
          variant: "destructive",
        })
        router.push("/admin/orders")
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [params.id, router, toast])

  const handleUpdatePaymentTime = async () => {
    if (!order || !order.booking_id) return

    setIsUpdating(true)
    try {
      await updateOrderPaymentTime(order.booking_id, newExpiryHours)
      toast({
        title: "Payment time updated",
        description: `Payment time has been extended by ${newExpiryHours} hours.`,
      })

      // Refresh order data
      const updatedOrder = await getOrderById(params.id)
      setOrder(updatedOrder)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment time",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "paid":
        return "bg-blue-500"
      case "shipped":
        return "bg-purple-500"
      case "delivered":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
            <CardDescription>The requested order could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/orders">Back to Orders</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">View and manage order information</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/orders">Back to Orders</Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order #{order.id.slice(0, 8)}</span>
              <Badge className={getStatusColor(order.status)}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Placed on {new Date(order.created_at).toLocaleDateString()} at{" "}
              {new Date(order.created_at).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">Customer Information</h3>
                <p>{order.customer_name || "N/A"}</p>
                <p>{order.customer_email || "N/A"}</p>
              </div>
              <div>
                <h3 className="font-semibold">Shipping Address</h3>
                <p>{order.shipping_address || "Not provided"}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              <div className="rounded-md border">
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <p className="font-medium">{order.product_name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: 1</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">Payment Information</h3>
                <p>Method: {order.payment_method || "Not specified"}</p>
                <p>Status: {order.status}</p>
              </div>
              <div>
                <h3 className="font-semibold">Total</h3>
                <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
              </div>
            </div>

            {order.booking_id && order.status === "pending" && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Payment Deadline</h3>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <p>Current Deadline: {new Date(order.expires_at).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min="1"
                          max="168"
                          value={newExpiryHours}
                          onChange={(e) => setNewExpiryHours(Number(e.target.value))}
                          className="w-20 rounded-md border px-3 py-2"
                        />
                        <span>hours</span>
                      </div>
                    </div>
                    <Button onClick={handleUpdatePaymentTime} disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Extend Time"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
