import { createClient } from "@supabase/supabase-js"

// Types for our database tables
export type ProductCategory = "mobile" | "grocery" | "electronics" | "clothing" | "other"

export type Product = {
  id: string
  name: string
  description: string
  price: number
  discounted_price: number | null
  image_url: string
  stock: number
  status: "in-stock" | "low-stock" | "out-of-stock" | "booked"
  category: ProductCategory
  created_at: string
  updated_at: string
}

export type Booking = {
  id: string
  product_id: string
  user_id: string | null
  booked_at: string
  expires_at: string
  status: "pending" | "paid" | "expired" | "cancelled"
  approval_status: "pending" | "approved" | "rejected"
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type PaymentMethod = "online" | "bank_transfer"

export type Order = {
  id: string
  booking_id: string | null
  user_id: string | null
  total_amount: number
  status: "pending" | "awaiting_approval" | "paid" | "shipped" | "delivered" | "cancelled"
  payment_method: PaymentMethod | null
  payment_slip_url: string | null
  payment_approved_at: string | null
  payment_approved_by: string | null
  shipping_address: string | null
  created_at: string
  updated_at: string
}

export type SystemSettings = {
  id: string
  payment_timeout_hours: number
  allow_duplicate_bookings: boolean
  default_approval_required: boolean
  created_at: string
  updated_at: string
}

// Server-side Supabase client
export const createServerSupabaseClient = () => {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Client-side Supabase client (singleton pattern)
let clientSupabaseClient: ReturnType<typeof createClient> | null = null

export const createClientSupabaseClient = () => {
  if (clientSupabaseClient) return clientSupabaseClient

  clientSupabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return clientSupabaseClient
}
