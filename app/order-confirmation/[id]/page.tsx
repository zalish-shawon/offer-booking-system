"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { getOrderById } from "@/lib/admin-actions"

export default function OrderConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(params.id)
        setOrder(data)
      } catch (error: any) {
        console.error("Error fetching order:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to fetch order details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [params.id, toast])

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
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-10">
      <Card className="border-green-200">
        <CardHeader className="text-center">
          {order.status === "awaiting_approval" ? (
            <AlertCircle className="mx-auto h-16 w-16 text-yellow-500" />
          ) : (
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          )}
          <CardTitle className="text-2xl">
            {order.status === "awaiting_approval" ? "Payment Slip Received" : "Thank You for Your Purchase!"}
          </CardTitle>
          <CardDescription>
            {order.status === "awaiting_approval"
              ? "Your payment slip has been uploaded and is awaiting approval."
              : "Your order has been confirmed and is being processed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md bg-muted p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Order Number:</span>
              <span>{order.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Date:</span>
              <span>{new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-medium">Status:</span>
              <span
                className={
                  order.status === "awaiting_approval" ? "text-yellow-600 font-medium" : "text-green-600 font-medium"
                }
              >
                {order.status === "awaiting_approval" ? "Awaiting Approval" : "Paid"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total:</span>
              <span className="font-bold">${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Product</h3>
            <div className="rounded-md border p-4">
              <p className="font-medium">{order.product_name}</p>
              <p className="text-sm text-muted-foreground">Quantity: 1</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Shipping Address</h3>
            <div className="rounded-md border p-4">
              <p className="whitespace-pre-line">{order.shipping_address}</p>
            </div>
          </div>

          {order.status === "awaiting_approval" && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4 text-yellow-800">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <p className="text-sm">
                Our team will verify your payment slip and approve your order. This usually takes 1-2 business days.
                You'll receive an email notification once your payment is approved.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/products">Continue Shopping</Link>
          </Button>
          {order.status !== "awaiting_approval" && (
            <Button variant="outline" asChild className="w-full">
              <Link href={`/orders/${order.id}`}>View Order Details</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
