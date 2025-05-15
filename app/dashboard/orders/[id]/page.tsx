import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, ExternalLink } from "lucide-react"

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

  const product = order.bookings?.products
  const paymentStatusColor =
    order.payment_approval_status === "approved"
      ? "text-green-500"
      : order.payment_approval_status === "rejected"
        ? "text-red-500"
        : "text-yellow-500"

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader heading="Order Details" text={`Order ID: ${params.id.substring(0, 8)}...`}>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
          <Link href={`/dashboard/invoices/${params.id}`}>
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          </Link>
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
                <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                <p>{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order Status</p>
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
                <p className="capitalize">{order.payment_method.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                <p className={paymentStatusColor}>{order.payment_approval_status}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-muted-foreground">Shipping Address</p>
              <p className="whitespace-pre-line">{order.shipping_address || "Not provided"}</p>
            </div>

            {order.payment_method === "bank_transfer" && order.payment_slip_url && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Slip</p>
                  <div className="mt-2">
                    <Link href={order.payment_slip_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Payment Slip
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Details about the product you ordered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {product ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-md">
                    <img
                      src={product.image_url || "/placeholder.svg?height=80&width=80"}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{product.description}</p>
                </div>
              </>
            ) : (
              <p>Product information not available</p>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Subtotal</p>
                <p>${Number(order.total_amount).toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p>Tax</p>
                <p>$0.00</p>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <p>Total</p>
                <p>${Number(order.total_amount).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
