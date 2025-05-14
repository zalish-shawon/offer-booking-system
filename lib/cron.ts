"use server"

import { createServerSupabaseClient } from "./supabase"

// This function would be called by a cron job every hour
export async function handleExpiredBookings() {
  try {
    const supabase = createServerSupabaseClient()
    const now = new Date().toISOString()

    // Find expired bookings
    const { data: expiredBookings, error: findError } = await supabase
      .from("bookings")
      .select("id, product_id")
      .eq("status", "pending")
      .lt("expires_at", now)

    if (findError) {
      console.error("Error finding expired bookings:", findError)
      return { success: false, error: findError.message }
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      return { success: true, message: "No expired bookings found" }
    }

    // Update booking status to expired
    const { error: updateBookingsError } = await supabase
      .from("bookings")
      .update({ status: "expired" })
      .in(
        "id",
        expiredBookings.map((booking) => booking.id),
      )

    if (updateBookingsError) {
      console.error("Error updating expired bookings:", updateBookingsError)
      return { success: false, error: updateBookingsError.message }
    }

    // Update product status back to in-stock
    for (const booking of expiredBookings) {
      // Get current product info
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", booking.product_id)
        .single()

      if (productError) {
        console.error(`Error getting product ${booking.product_id}:`, productError)
        continue
      }

      // Update product status
      const newStock = product.stock + 1
      const newStatus = newStock > 5 ? "in-stock" : newStock > 0 ? "low-stock" : "out-of-stock"

      const { error: updateProductError } = await supabase
        .from("products")
        .update({
          status: newStatus,
          stock: newStock,
        })
        .eq("id", booking.product_id)

      if (updateProductError) {
        console.error(`Error updating product ${booking.product_id}:`, updateProductError)
      }
    }

    return {
      success: true,
      message: `Processed ${expiredBookings.length} expired bookings`,
    }
  } catch (error) {
    console.error("Error in handleExpiredBookings:", error)
    return { success: false, error: String(error) }
  }
}
