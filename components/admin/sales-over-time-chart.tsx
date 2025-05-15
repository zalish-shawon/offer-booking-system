"use client"

import { useEffect, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export function SalesOverTimeChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClientSupabaseClient()

      // Get orders for the last 30 days
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const { data: orders } = await supabase
        .from("orders")
        .select("created_at, total_amount, status")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .lte("created_at", now.toISOString())
        .order("created_at", { ascending: true })

      // Process data for chart
      const dailyData: Record<string, { date: string; total: number }> = {}

      // Initialize with the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split("T")[0]
        dailyData[dateStr] = { date: dateStr, total: 0 }
      }

      // Sum order amounts by day
      orders?.forEach((order) => {
        if (order.status === "paid" || order.status === "shipped" || order.status === "delivered") {
          const date = new Date(order.created_at)
          const dateStr = date.toISOString().split("T")[0]

          if (dailyData[dateStr]) {
            dailyData[dateStr].total += Number(order.total_amount)
          }
        }
      })

      // Convert to array and sort by date
      const chartData = Object.values(dailyData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setData(chartData)
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="flex h-[350px] items-center justify-center">Loading...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => {
            const d = new Date(date)
            return `${d.getDate()}/${d.getMonth() + 1}`
          }}
        />
        <YAxis tickFormatter={(value) => `$${value}`} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toFixed(2)}`, "Sales"]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
