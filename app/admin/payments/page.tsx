"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { getPendingPayments, approvePayment, rejectPayment } from "@/lib/admin-actions"

export default function AdminPaymentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [payments, setPayments] = useState<any[]>([])
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await getPendingPayments()
        setPayments(data)
      } catch (error: any) {
        console.error("Error fetching payments:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to fetch payment details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [toast])

  const handleApprovePayment = async () => {
    if (!selectedPayment) return

    setIsProcessing(true)
    try {
      await approvePayment(selectedPayment.id)
      toast({
        title: "Payment approved",
        description: "The payment has been approved successfully.",
      })
      setIsApproveDialogOpen(false)
      // Remove the approved payment from the list
      setPayments(payments.filter((payment) => payment.id !== selectedPayment.id))
      setSelectedPayment(null)
    } catch (error: any) {
      console.error("Error approving payment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!selectedPayment) return

    setIsProcessing(true)
    try {
      await rejectPayment(selectedPayment.id, rejectionReason)
      toast({
        title: "Payment rejected",
        description: "The payment has been rejected.",
      })
      setIsRejectDialogOpen(false)
      // Remove the rejected payment from the list
      setPayments(payments.filter((payment) => payment.id !== selectedPayment.id))
      setSelectedPayment(null)
      setRejectionReason("")
    } catch (error: any) {
      console.error("Error rejecting payment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to reject payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Payment Verification</h1>
        <p className="text-muted-foreground">Verify and approve manual payment slips</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Verification ({payments.length})</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {payments.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {payments.map((payment) => (
                <Card key={payment.id} className="overflow-hidden">
                  <div className="relative aspect-video bg-muted">
                    {payment.payment_slip_url ? (
                      <Image
                        src={payment.payment_slip_url || "/placeholder.svg"}
                        alt="Payment slip"
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => {
                          setSelectedPayment(payment)
                          setIsImageDialogOpen(true)
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <p className="text-muted-foreground">No payment slip</p>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Order #{payment.id.slice(0, 8)}</span>
                      <Badge>Awaiting Approval</Badge>
                    </CardTitle>
                    <CardDescription>
                      Submitted on {new Date(payment.created_at).toLocaleDateString()} at{" "}
                      {new Date(payment.created_at).toLocaleTimeString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span>{payment.customer_name || "Guest"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product:</span>
                        <span className="font-medium">{payment.product_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold">${Number(payment.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPayment(payment)
                        setIsRejectDialogOpen(true)
                      }}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        setSelectedPayment(payment)
                        setIsApproveDialogOpen(true)
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Pending Payments</CardTitle>
                <CardDescription>There are no manual payments awaiting verification.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>View all processed payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Payment history will be implemented in a future update.</p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/admin/orders">View All Orders</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Preview Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment Slip</DialogTitle>
            <DialogDescription>
              Order #{selectedPayment?.id.slice(0, 8)} - {selectedPayment?.customer_name || "Guest"}
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-auto h-[60vh]">
            {selectedPayment?.payment_slip_url && (
              <Image
                src={selectedPayment.payment_slip_url || "/placeholder.svg"}
                alt="Payment slip"
                fill
                className="object-contain"
              />
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <a href={selectedPayment?.payment_slip_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </a>
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setIsImageDialogOpen(false)
                  setIsRejectDialogOpen(true)
                }}
              >
                Reject Payment
              </Button>
              <Button
                onClick={() => {
                  setIsImageDialogOpen(false)
                  setIsApproveDialogOpen(true)
                }}
              >
                Approve Payment
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Payment Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this payment? This will mark the order as paid.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Order ID:</span>
                <span>{selectedPayment?.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Customer:</span>
                <span>{selectedPayment?.customer_name || "Guest"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Amount:</span>
                <span className="font-bold">${Number(selectedPayment?.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprovePayment} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this payment? This will cancel the order and return the product to
              inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-muted p-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">Order ID:</span>
                <span>{selectedPayment?.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium">Customer:</span>
                <span>{selectedPayment?.customer_name || "Guest"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Amount:</span>
                <span className="font-bold">${Number(selectedPayment?.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label htmlFor="rejection-reason" className="block text-sm font-medium mb-2">
                Rejection Reason (Optional)
              </label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectPayment} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
