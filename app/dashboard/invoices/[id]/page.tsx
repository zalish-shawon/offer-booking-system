"use client"

import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Printer } from "lucide-react"
import { getInvoiceByOrderId } from "@/lib/invoice"

export default async function InvoiceDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    notFound()
  }

  // Get invoice details
  const invoice = await getInvoiceByOrderId(params.id)

  if (!invoice || invoice.orders.user_id !== session.user.id) {
    notFound()
  }

  const order = invoice.orders
  const product = order.bookings?.products

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader heading="Invoice" text={`Invoice #${invoice.invoice_number}`}>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
          </Link>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DashboardHeader>

      <Card className="print:shadow-none">
        <CardContent className="p-6 print:p-0">
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row">
              <div>
                <h2 className="text-2xl font-bold">INVOICE</h2>
                <p className="text-muted-foreground">#{invoice.invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Mobile Booking System</p>
                <p className="text-muted-foreground">123 Main Street</p>
                <p className="text-muted-foreground">New York, NY 10001</p>
                <p className="text-muted-foreground">support@mobilebooking.com</p>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col justify-between gap-6 md:flex-row">
              <div>
                <p className="font-medium">Bill To:</p>
                <p>{order.shipping_address || "No shipping address provided"}</p>
              </div>
              <div className="text-right">
                <div className="flex justify-between gap-16">
                  <p className="font-medium">Invoice Date:</p>
                  <p>{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-between gap-16">
                  <p className="font-medium">Due Date:</p>
                  <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                <div className="flex justify-between gap-16">
                  <p className="font-medium">Status:</p>
                  <p className={invoice.status === "paid" ? "text-green-500" : "text-yellow-500"}>
                    {invoice.status.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-4 font-medium">Order Summary</h3>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-right">Quantity</th>
                      <th className="px-4 py-2 text-right">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2">
                        <div>
                          <p className="font-medium">{product?.name || "Unknown Product"}</p>
                          <p className="text-sm text-muted-foreground">{product?.category || "Mobile"}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">1</td>
                      <td className="px-4 py-2 text-right">${Number(invoice.subtotal).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">${Number(invoice.subtotal).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              <div className="flex w-full justify-between md:w-1/3">
                <p className="font-medium">Subtotal:</p>
                <p>${Number(invoice.subtotal).toFixed(2)}</p>
              </div>
              <div className="flex w-full justify-between md:w-1/3">
                <p className="font-medium">Tax:</p>
                <p>${Number(invoice.tax).toFixed(2)}</p>
              </div>
              <Separator className="my-2" />
              <div className="flex w-full justify-between md:w-1/3">
                <p className="text-lg font-bold">Total:</p>
                <p className="text-lg font-bold">${Number(invoice.total).toFixed(2)}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-medium">Notes</h3>
              <p className="text-muted-foreground">{invoice.notes || "No notes"}</p>
            </div>

            <div>
              <h3 className="mb-2 font-medium">Payment Method</h3>
              <p className="capitalize">{order.payment_method.replace("_", " ")}</p>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Thank you for your business!</p>
              <p>If you have any questions, please contact support@mobilebooking.com</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
