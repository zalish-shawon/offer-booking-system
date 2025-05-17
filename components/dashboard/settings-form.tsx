"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface SettingsFormProps {
  settings: any
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email_notifications: settings?.email_notifications ?? true,
    order_updates: settings?.order_updates ?? true,
    payment_updates: settings?.payment_updates ?? true,
    marketing_emails: settings?.marketing_emails ?? false,
  })

  const handleToggle = (field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof prev],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()

      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to update settings")
      }

      if (settings) {
        // Update existing settings
        const { error } = await supabase.from("user_settings").update(formData).eq("user_id", session.user.id)

        if (error) throw error
      } else {
        // Insert new settings
        const { error } = await supabase.from("user_settings").insert({
          user_id: session.user.id,
          ...formData,
        })

        if (error) throw error
      }

      toast({
        title: "Settings updated",
        description: "Your notification settings have been updated successfully.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email_notifications">Email Notifications</Label>
            <p className="text-sm text-muted-foreground">Receive email notifications about your account</p>
          </div>
          <Switch
            id="email_notifications"
            checked={formData.email_notifications}
            onCheckedChange={() => handleToggle("email_notifications")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="order_updates">Order Updates</Label>
            <p className="text-sm text-muted-foreground">Receive updates about your orders</p>
          </div>
          <Switch
            id="order_updates"
            checked={formData.order_updates}
            onCheckedChange={() => handleToggle("order_updates")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="payment_updates">Payment Updates</Label>
            <p className="text-sm text-muted-foreground">Receive updates about your payments</p>
          </div>
          <Switch
            id="payment_updates"
            checked={formData.payment_updates}
            onCheckedChange={() => handleToggle("payment_updates")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="marketing_emails">Marketing Emails</Label>
            <p className="text-sm text-muted-foreground">Receive marketing emails and promotions</p>
          </div>
          <Switch
            id="marketing_emails"
            checked={formData.marketing_emails}
            onCheckedChange={() => handleToggle("marketing_emails")}
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  )
}
