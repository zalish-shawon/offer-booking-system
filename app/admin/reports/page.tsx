import { createServerSupabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentMethodsChart } from "@/components/admin/payment-methods-chart"
import { ApprovalRatesChart } from "@/components/admin/approval-rates-chart"
import { SalesOverTimeChart } from "@/components/admin/sales-over-time-chart"
import { DateRangePicker } from "@/components/admin/date-range-picker"

export default async function ReportsPage() {
  const supabase = createServerSupabaseClient()

  // Get payment methods statistics
  const { data: paymentMethodsData } = await supabase
    .from("orders")
    .select("payment_method, count")
    .select("payment_method")

  const paymentMethods = paymentMethodsData?.reduce((acc: Record<string, number>, order) => {
    const method = order.payment_method
    acc[method] = (acc[method] || 0) + 1
    return acc
  }, {})

  // Get approval rates statistics
  const { data: approvalRatesData } = await supabase
    .from("orders")
    .select("payment_approval_status")
    .eq("payment_method", "bank_transfer")

  const approvalRates = approvalRatesData?.reduce((acc: Record<string, number>, order) => {
    const status = order.payment_approval_status
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  // Format data for charts
  const paymentMethodsChartData = Object.entries(paymentMethods || {}).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }))

  const approvalRatesChartData = Object.entries(approvalRates || {}).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <DateRangePicker />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$10,231.50</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+85%</div>
                <p className="text-xs text-muted-foreground">+10.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">+201 since last month</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Over Time</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <SalesOverTimeChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Distribution of payment methods used</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentMethodsChart data={paymentMethodsChartData} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Analysis</CardTitle>
              <CardDescription>Detailed breakdown of payment methods used by customers</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <PaymentMethodsChart data={paymentMethodsChartData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval Rates Analysis</CardTitle>
              <CardDescription>Detailed breakdown of manual payment approval rates</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ApprovalRatesChart data={approvalRatesChartData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analysis</CardTitle>
              <CardDescription>Detailed breakdown of sales over time</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <SalesOverTimeChart />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
