import { createServerSupabaseClient } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { NotificationsList } from "@/components/dashboard/notifications-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const supabase = createServerSupabaseClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", session?.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader heading="Notifications" text="View your notifications and updates" />

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>You have {notifications?.length || 0} notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationsList notifications={notifications || []} />
        </CardContent>
      </Card>
    </div>
  )
}
