"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export function Overview() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClientSupabaseClient()

      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      // Get orders for the last 7 days
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const { data: orders } = await supabase
        .from("orders")
        .select("created_at, status")
        .eq("user_id", session.user.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .lte("created_at", now.toISOString())

      // Process data for chart
      const dailyData: Record<string, { name: string; total: number }> = {}

      // Initialize with the last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toLocaleDateString("en-US", { weekday: "short" })
        dailyData[dateStr] = { name: dateStr, total: 0 }
      }

      // Count orders by day
      orders?.forEach((order) => {
        const date = new Date(order.created_at)
        const dateStr = date.toLocaleDateString("en-US", { weekday: "short" })

        if (dailyData[dateStr]) {
          dailyData[dateStr].total += 1
        }
      })

      // Convert to array and sort by date
      const chartData = Object.values(dailyData).reverse()

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
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
