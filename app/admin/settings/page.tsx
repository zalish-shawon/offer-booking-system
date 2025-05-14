"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { getSystemSettings, updateSystemSettings } from "@/lib/admin-actions"

export default function AdminSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [settings, setSettings] = useState({
    paymentTimeoutHours: 48,
    allowDuplicateBookings: false,
    defaultApprovalRequired: true,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSystemSettings()
        setSettings({
          paymentTimeoutHours: data.payment_timeout_hours,
          allowDuplicateBookings: data.allow_duplicate_bookings,
          defaultApprovalRequired: data.default_approval_required,
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch system settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateSystemSettings(settings)
      toast({
        title: "Settings updated",
        description: "System settings have been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update system settings",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Booking Settings</CardTitle>
            <CardDescription>Configure how bookings and payments work in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="paymentTimeoutHours">Payment Timeout (Hours)</Label>
              <Input
                id="paymentTimeoutHours"
                type="number"
                min="1"
                max="168"
                value={settings.paymentTimeoutHours}
                onChange={(e) => setSettings((prev) => ({ ...prev, paymentTimeoutHours: Number(e.target.value) }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                The number of hours a user has to complete payment after booking a product
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="allowDuplicateBookings"
                checked={settings.allowDuplicateBookings}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowDuplicateBookings: checked }))}
              />
              <Label htmlFor="allowDuplicateBookings">Allow Duplicate Bookings</Label>
              <p className="ml-2 text-xs text-muted-foreground">
                If enabled, users can have multiple pending bookings at the same time
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="defaultApprovalRequired"
                checked={settings.defaultApprovalRequired}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, defaultApprovalRequired: checked }))}
              />
              <Label htmlFor="defaultApprovalRequired">Require Admin Approval</Label>
              <p className="ml-2 text-xs text-muted-foreground">
                If enabled, bookings require admin approval before payment can be made
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
