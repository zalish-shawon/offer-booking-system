"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpDown, Check, Clock, MoreHorizontal, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { updateBookingApproval, extendBookingExpiration } from "@/lib/actions"

interface Booking {
  id: string
  user: {
    id: string
    email: string
    full_name: string | null
  }
  product: {
    id: string
    name: string
    price: number
    discounted_price: number | null
  }
  booked_at: string
  expires_at: string
  status: "pending" | "paid" | "expired" | "cancelled"
  approval_status: "pending" | "approved" | "rejected"
  admin_notes: string | null
}

interface AdminBookingsTableProps {
  bookings: Booking[]
}

export function AdminBookingsTable({ bookings }: AdminBookingsTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Dialog states
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isExtendDialogOpen, setIsExtendDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [extensionHours, setExtensionHours] = useState(24)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("asc")
    }
  }

  const handleApprove = async () => {
    if (!selectedBooking) return

    setIsProcessing(true)
    try {
      await updateBookingApproval(selectedBooking.id, "approved", adminNotes)
      toast({
        title: "Booking approved",
        description: "The booking has been approved successfully.",
      })
      setIsApproveDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve booking",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedBooking) return

    setIsProcessing(true)
    try {
      await updateBookingApproval(selectedBooking.id, "rejected", adminNotes)
      toast({
        title: "Booking rejected",
        description: "The booking has been rejected and the product returned to inventory.",
      })
      setIsRejectDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject booking",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExtend = async () => {
    if (!selectedBooking) return

    setIsProcessing(true)
    try {
      await extendBookingExpiration(selectedBooking.id, extensionHours)
      toast({
        title: "Booking extended",
        description: `The booking expiration has been extended by ${extensionHours} hours.`,
      })
      setIsExtendDialogOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to extend booking",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "paid":
        return "bg-green-500"
      case "expired":
        return "bg-red-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getApprovalStatusColor = (status: Booking["approval_status"]) => {
    switch (status) {
      case "pending":
        return "bg-blue-500"
      case "approved":
        return "bg-green-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Booking ID</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("user.email")}>
                  User
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("status")}>
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("approval_status")}>
                  Approval
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort("expires_at")}>
                  Expires
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end cursor-pointer" onClick={() => handleSort("price")}>
                  Price
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{booking.user.full_name || "N/A"}</span>
                    <span className="text-xs text-muted-foreground">{booking.user.email}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{booking.product.name}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getApprovalStatusColor(booking.approval_status)}>
                    {booking.approval_status.charAt(0).toUpperCase() + booking.approval_status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(booking.expires_at) > new Date() ? (
                    <span className="text-sm">{new Date(booking.expires_at).toLocaleString()}</span>
                  ) : (
                    <span className="text-sm text-red-500">Expired</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  ${(booking.product.discounted_price || booking.product.price).toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedBooking(booking)
                          setAdminNotes("")
                          setIsApproveDialogOpen(true)
                        }}
                      >
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedBooking(booking)
                          setAdminNotes("")
                          setIsRejectDialogOpen(true)
                        }}
                      >
                        <X className="mr-2 h-4 w-4 text-red-500" />
                        Reject
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedBooking(booking)
                          setExtensionHours(24)
                          setIsExtendDialogOpen(true)
                        }}
                      >
                        <Clock className="mr-2 h-4 w-4 text-blue-500" />
                        Extend Time
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No bookings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this booking? The user will be able to proceed with payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this approval"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this booking? The product will be returned to inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-notes">Rejection Reason</Label>
              <Textarea
                id="reject-notes"
                placeholder="Provide a reason for rejecting this booking"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !adminNotes.trim()}>
              {isProcessing ? "Processing..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Time Dialog */}
      <Dialog open={isExtendDialogOpen} onOpenChange={setIsExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Booking Time</DialogTitle>
            <DialogDescription>Extend the payment window for this booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="extension">Additional Hours</Label>
              <Input
                id="extension"
                type="number"
                min="1"
                max="72"
                value={extensionHours}
                onChange={(e) => setExtensionHours(Number.parseInt(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExtend} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Extend Time"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
