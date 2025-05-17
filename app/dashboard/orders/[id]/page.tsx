import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createServerSupabaseClient } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    notFound()
  }

  // Get order details
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      bookings(*, products(*))
    `)
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .single()

  if (error || !order) {
    notFound()
  }

  const product = order.bookings?.products || null
  const booking = order.bookings || null

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader heading="Order Details" text={`Order #${order.id.substring(0, 8)}`}>
        <div className="flex space-x-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/orders">Back to Orders</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/invoices/${order.id}`}>View Invoice</Link>
          </Button>
        </div>
      </DashboardHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Details about your order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                <p>{order.id.substring(0, 8)}...</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p>{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
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
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <p className="capitalize">{order.payment_method?.replace("_", " ") || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <Badge
                  variant={
                    order.payment_approval_status === "approved"
                      ? "default"
                      : order.payment_approval_status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {order.payment_approval_status || "N/A"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Shipping Address</p>
              <p className="whitespace-pre-line">{order.shipping_address || "No shipping address provided"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Details about the product you ordered</CardDescription>
          </CardHeader>
          <CardContent>
            {product ? (
              <div className="flex flex-col space-y-4">
                <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                  <Image
                    src={product.image_url || "/placeholder.svg?height=200&width=200"}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Price</p>
                    <p>{formatCurrency(product.price)}</p>
                  </div>
                  {product.discounted_price && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Discounted Price</p>
                      <p>{formatCurrency(product.discounted_price)}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p>Product information not available</p>
            )}
          </CardContent>
          <CardFooter>
            {booking && (
              <div className="w-full">
                <p className="text-sm font-medium text-muted-foreground">Booking Information</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booked At</p>
                    <p>{new Date(booking.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booking Status</p>
                    <Badge
                      variant={
                        booking.status === "paid"
                          ? "default"
                          : booking.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
