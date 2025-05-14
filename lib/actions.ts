"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "./supabase"
import { getSystemSettings } from "./admin-actions"

// Book a product
export async function bookProduct(productId: string, userId?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get system settings
    const settings = await getSystemSettings()

    // If no userId is provided, we'll still allow the booking
    // This is for the bypass functionality

    // Check if user already has a pending booking (if duplicate bookings are not allowed)
    if (userId && !settings.allow_duplicate_bookings) {
      const { data: existingBookings, error: bookingCheckError } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "pending")
        .limit(1)

      if (bookingCheckError) {
        console.error("Error checking existing bookings:", bookingCheckError)
        throw new Error("Failed to check existing bookings")
      }

      if (existingBookings && existingBookings.length > 0) {
        throw new Error(
          "You already have a pending booking. Please complete or cancel it before booking another product.",
        )
      }
    }

    // Start a transaction
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()

    if (productError) {
      console.error("Error fetching product for booking:", productError)
      throw new Error("Product not found")
    }

    if (product.stock <= 0) {
      throw new Error("Product is out of stock")
    }

    if (product.status === "booked") {
      throw new Error("Product is already booked")
    }

    // Calculate expiration time based on settings
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + settings.payment_timeout_hours)

    // Create a booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        product_id: productId,
        user_id: userId || null, // Allow null user_id for bypass
        expires_at: expiresAt.toISOString(),
        status: "pending",
        approval_status: settings.default_approval_required ? "pending" : "approved", // Auto-approve if not required
      })
      .select()
      .single()

    if (bookingError) {
      console.error("Error creating booking:", bookingError)
      throw new Error("Failed to create booking")
    }

    // Update product status to booked
    const { error: updateError } = await supabase
      .from("products")
      .update({
        status: "booked",
        stock: product.stock - 1,
      })
      .eq("id", productId)

    if (updateError) {
      console.error("Error updating product status:", updateError)
      throw new Error("Failed to update product status")
    }

    revalidatePath("/products")
    revalidatePath(`/products/${productId}`)

    return { success: true, bookingId: booking.id }
  } catch (error) {
    console.error("Error in bookProduct:", error)
    throw error
  }
}

// Add a new product
export async function addProduct(productData: {
  name: string
  description: string
  price: number
  stock: number
  image: string
  discountedPrice?: number
}) {
  try {
    const supabase = createServerSupabaseClient()

    // Determine product status based on stock
    let status = "in-stock"
    if (productData.stock === 0) {
      status = "out-of-stock"
    } else if (productData.stock <= 5) {
      status = "low-stock"
    }

    // Insert the product
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        discounted_price: productData.discountedPrice || null,
        image_url: productData.image,
        stock: productData.stock,
        status,
      })
      .select()
      .single()

    if (error) {
      console.error("Error adding product:", error)
      throw new Error("Failed to add product")
    }

    revalidatePath("/admin/products")
    revalidatePath("/products")

    return { success: true, id: data.id }
  } catch (error) {
    console.error("Error in addProduct:", error)
    throw error
  }
}

// Bulk upload products
export async function bulkUploadProducts(products: any[]) {
  try {
    const supabase = createServerSupabaseClient()

    // Format products for insertion
    const formattedProducts = products.map((product) => {
      // Determine product status based on stock
      let status = "in-stock"
      if (product.stock === 0) {
        status = "out-of-stock"
      } else if (product.stock <= 5) {
        status = "low-stock"
      }

      return {
        name: product.name,
        description: product.description,
        price: Number.parseFloat(product.price),
        discounted_price: product.discounted_price ? Number.parseFloat(product.discounted_price) : null,
        image_url: product.image_url || "/placeholder.svg?height=300&width=300",
        stock: Number.parseInt(product.stock),
        status,
      }
    })

    // Insert products in batches of 100
    const batchSize = 100
    let successCount = 0

    for (let i = 0; i < formattedProducts.length; i += batchSize) {
      const batch = formattedProducts.slice(i, i + batchSize)

      const { data, error } = await supabase.from("products").insert(batch).select()

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error)
      } else if (data) {
        successCount += data.length
      }
    }

    revalidatePath("/admin/products")
    revalidatePath("/products")

    return { success: true, successCount }
  } catch (error) {
    console.error("Error in bulkUploadProducts:", error)
    throw error
  }
}

// Update booking approval status
export async function updateBookingApproval(bookingId: string, status: "approved" | "rejected", notes?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Update booking status
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        approval_status: status,
        admin_notes: notes || null,
      })
      .eq("id", bookingId)

    if (updateError) {
      console.error("Error updating booking approval:", updateError)
      throw new Error("Failed to update booking approval status")
    }

    // If rejected, return product to inventory
    if (status === "rejected") {
      // Get the booking to find the product
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("product_id")
        .eq("id", bookingId)
        .single()

      if (bookingError) {
        console.error("Error fetching booking:", bookingError)
        throw new Error("Failed to fetch booking details")
      }

      // Get the product
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", booking.product_id)
        .single()

      if (productError) {
        console.error("Error fetching product:", productError)
        throw new Error("Failed to fetch product details")
      }

      // Update product status and stock
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
        console.error("Error updating product:", updateProductError)
        throw new Error("Failed to update product status")
      }

      // Update booking status to cancelled
      const { error: cancelError } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)

      if (cancelError) {
        console.error("Error cancelling booking:", cancelError)
        throw new Error("Failed to cancel booking")
      }
    }

    revalidatePath("/admin/bookings")

    return { success: true }
  } catch (error) {
    console.error("Error in updateBookingApproval:", error)
    throw error
  }
}

// Extend booking expiration time
export async function extendBookingExpiration(bookingId: string, additionalHours: number) {
  try {
    const supabase = createServerSupabaseClient()

    // Get current booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("expires_at")
      .eq("id", bookingId)
      .single()

    if (bookingError) {
      console.error("Error fetching booking:", bookingError)
      throw new Error("Failed to fetch booking details")
    }

    // Calculate new expiration time
    const currentExpiry = new Date(booking.expires_at)
    const newExpiry = new Date(currentExpiry.getTime() + additionalHours * 60 * 60 * 1000)

    // Update booking expiration
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ expires_at: newExpiry.toISOString() })
      .eq("id", bookingId)

    if (updateError) {
      console.error("Error extending booking:", updateError)
      throw new Error("Failed to extend booking expiration")
    }

    revalidatePath("/admin/bookings")

    return { success: true, newExpiryTime: newExpiry.toISOString() }
  } catch (error) {
    console.error("Error in extendBookingExpiration:", error)
    throw error
  }
}

// Complete payment for a booking
export async function completePayment(
  bookingId: string,
  paymentDetails: {
    paymentMethod: string
    shippingAddress: string
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, products(*)")
      .eq("id", bookingId)
      .single()

    if (bookingError) {
      console.error("Error fetching booking:", bookingError)
      throw new Error("Booking not found")
    }

    // Check if booking is expired
    const expiresAt = new Date(booking.expires_at)
    if (expiresAt < new Date()) {
      throw new Error("Booking has expired")
    }

    // Check if booking is approved
    if (booking.approval_status !== "approved") {
      throw new Error("Booking has not been approved by admin yet")
    }

    // Update booking status
    const { error: updateBookingError } = await supabase.from("bookings").update({ status: "paid" }).eq("id", bookingId)

    if (updateBookingError) {
      console.error("Error updating booking status:", updateBookingError)
      throw new Error("Failed to update booking status")
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        total_amount: booking.products.discounted_price || booking.products.price,
        status: "paid",
        payment_method: paymentDetails.paymentMethod,
        shipping_address: paymentDetails.shippingAddress,
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      throw new Error("Failed to create order")
    }

    revalidatePath("/booking-confirmation/[id]")

    return { success: true, orderId: order.id }
  } catch (error) {
    console.error("Error in completePayment:", error)
    throw error
  }
}
