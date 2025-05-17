import { createServerSupabaseClient } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SettingsForm } from "@/components/dashboard/settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get user settings
  const { data: settings } = await supabase.from("user_settings").select("*").eq("user_id", session?.user.id).single()

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader heading="Settings" text="Manage your account settings and preferences" />

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  )
}
