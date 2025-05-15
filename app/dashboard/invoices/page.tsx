import { createServerSupabaseClient } from "@/lib/supabase"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { InvoicesTable } from "@/components/dashboard/invoices-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserInvoices } from "@/lib/invoice"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function InvoicesPage() {
  const supabase = createServerSupabaseClient()

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return (
      <div className="flex-1 space-y-4">
        <DashboardHeader heading="Invoices" text="View and download your invoices" />
        <Card>
          <CardHeader>
            <CardTitle>My Invoices</CardTitle>
            <CardDescription>Please log in to view your invoices.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get invoices
  const invoices = await getUserInvoices(session.user.id)

  return (
    <div className="flex-1 space-y-4">
      <DashboardHeader heading="Invoices" text="View and download your invoices" />

      <Card>
        <CardHeader>
          <CardTitle>My Invoices</CardTitle>
          <CardDescription>You have {invoices.length} invoices in total.</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesTable invoices={invoices} />
        </CardContent>
      </Card>
    </div>
  )
}
