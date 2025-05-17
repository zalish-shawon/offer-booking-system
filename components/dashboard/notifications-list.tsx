"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Bell, Check, ShoppingBag, CreditCard, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationsListProps {
  notifications: any[]
}

export function NotificationsList({ notifications }: NotificationsListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />
      case "payment":
        return <CreditCard className="h-5 w-5 text-green-500" />
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const markAsRead = async (id: string) => {
    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

      if (error) throw error

      toast({
        title: "Notification marked as read",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notification",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    setIsLoading(true)

    try {
      const supabase = createClientSupabaseClient()

      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in")
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false)

      if (error) throw error

      toast({
        title: "All notifications marked as read",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update notifications",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (notifications.length === 0) {
    return <p className="text-center py-4">No notifications found.</p>
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">You have {unreadCount} unread notifications</p>
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={isLoading}>
            Mark all as read
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-4 p-4 rounded-lg border ${
              notification.read ? "bg-background" : "bg-muted"
            }`}
          >
            <div className="mt-0.5">{getIcon(notification.type)}</div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(notification.created_at).toLocaleString()}</p>
            </div>
            {!notification.read && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => markAsRead(notification.id)}
                disabled={isLoading}
              >
                <Check className="h-4 w-4" />
                <span className="sr-only">Mark as read</span>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
