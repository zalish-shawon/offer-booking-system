import { createServerSupabaseClient } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PaymentsTable } from "@/components/dashboard/payments-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function PaymentsPage() {
  const supabase = createServerSupabaseClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Get payments
  const { data: payments } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      payment_method,
      payment_approval_status,
      payment_slip_url,
      payment_approved_at,
      total_amount,
      created_at
    `)
    .eq("user_id", session?.user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader heading="Payments" text="View your payment history" />

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>You have {payments?.length || 0} payment records.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsTable payments={payments || []} />
        </CardContent>
      </Card>
    </div>
  )
}
