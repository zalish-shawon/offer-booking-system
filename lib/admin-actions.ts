"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "./supabase"

// User management functions
export async function createUser(userData: {
  email: string
  password: string
  fullName: string
  role: "admin" | "user"
  isBlocked: boolean
}) {
  try {
    const supabase = createServerSupabaseClient()

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
      },
    })

    if (authError) {
      throw new Error(`Error creating user: ${authError.message}`)
    }

    // Update the user's role and blocked status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: userData.role,
        is_blocked: userData.isBlocked,
        full_name: userData.fullName,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      throw new Error(`Error updating user profile: ${profileError.message}`)
    }

    revalidatePath("/admin/users")
    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    console.error("Error in createUser:", error)
    throw error
  }
}

export async function getUserById(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      throw new Error(`Error fetching user: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("Error in getUserById:", error)
    throw error
  }
}

export async function updateUser(
  userId: string,
  userData: {
    email: string
    fullName: string
    role: "admin" | "user"
    isBlocked: boolean
    password?: string
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    // Update auth data if email or password changed
    if (userData.email || userData.password) {
      const authUpdateData: any = {}
      if (userData.email) authUpdateData.email = userData.email
      if (userData.password) authUpdateData.password = userData.password

      const { error: authError } = await supabase.auth.admin.updateUserById(userId, authUpdateData)

      if (authError) {
        throw new Error(`Error updating user auth data: ${authError.message}`)
      }
    }

    // Update profile data
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: userData.role,
        is_blocked: userData.isBlocked,
        full_name: userData.fullName,
      })
      .eq("id", userId)

    if (profileError) {
      throw new Error(`Error updating user profile: ${profileError.message}`)
    }

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateUser:", error)
    throw error
  }
}

// System settings functions
export async function getSystemSettings() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("system_settings").select("*").limit(1).single()

    if (error) {
      throw new Error(`Error fetching system settings: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("Error in getSystemSettings:", error)
    throw error
  }
}

export async function updateSystemSettings(settings: {
  paymentTimeoutHours: number
  allowDuplicateBookings: boolean
  defaultApprovalRequired: boolean
}) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the settings ID first
    const { data: existingSettings, error: fetchError } = await supabase
      .from("system_settings")
      .select("id")
      .limit(1)
      .single()

    if (fetchError) {
      throw new Error(`Error fetching system settings: ${fetchError.message}`)
    }

    // Update the settings
    const { error: updateError } = await supabase
      .from("system_settings")
      .update({
        payment_timeout_hours: settings.paymentTimeoutHours,
        allow_duplicate_bookings: settings.allowDuplicateBookings,
        default_approval_required: settings.defaultApprovalRequired,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSettings.id)

    if (updateError) {
      throw new Error(`Error updating system settings: ${updateError.message}`)
    }

    revalidatePath("/admin/settings")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateSystemSettings:", error)
    throw error
  }
}

// Order management functions
export async function updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
  try {
    const supabase = createServerSupabaseClient()

    const updateData: any = { status }
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber
    }

    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

    if (error) {
      throw new Error(`Error updating order status: ${error.message}`)
    }

    revalidatePath("/admin/orders")
    return { success: true }
  } catch (error: any) {
    console.error("Error in updateOrderStatus:", error)
    throw error
  }
}

export async function getOrderById(orderId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the order
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError) {
      throw new Error(`Error fetching order: ${orderError.message}`)
    }

    // Get customer info if user_id exists
    let customerName = "Guest"
    let customerEmail = "Guest"
    if (order.user_id) {
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", order.user_id)
        .single()

      if (!userError && user) {
        customerName = user.full_name || "Unknown"
        customerEmail = user.email
      }
    }

    // Get product info if booking_id exists
    let productName = "Unknown Product"
    let expiresAt = null
    if (order.booking_id) {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("product_id, expires_at")
        .eq("id", order.booking_id)
        .single()

      if (!bookingError && booking) {
        expiresAt = booking.expires_at

        const { data: product, error: productError } = await supabase
          .from("products")
          .select("name")
          .eq("id", booking.product_id)
          .single()

        if (!productError && product) {
          productName = product.name
        }
      }
    }

    return {
      ...order,
      customer_name: customerName,
      customer_email: customerEmail,
      product_name: productName,
      expires_at: expiresAt,
    }
  } catch (error: any) {
    console.error("Error in getOrderById:", error)
    throw error
  }
}

export async function updateOrderPaymentTime(bookingId: string, additionalHours: number) {
  try {
    const supabase = createServerSupabaseClient()

    // Get current booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("expires_at")
      .eq("id", bookingId)
      .single()

    if (bookingError) {
      throw new Error(`Error fetching booking: ${bookingError.message}`)
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
      throw new Error(`Error extending booking: ${updateError.message}`)
    }

    revalidatePath("/admin/orders")
    return { success: true, newExpiryTime: newExpiry.toISOString() }
  } catch (error: any) {
    console.error("Error in updateOrderPaymentTime:", error)
    throw error
  }
}

// Product management functions
export async function deleteProduct(productId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if product is booked
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("status")
      .eq("id", productId)
      .single()

    if (productError) {
      throw new Error(`Error fetching product: ${productError.message}`)
    }

    if (product.status === "booked") {
      throw new Error("Cannot delete a product that is currently booked.")
    }

    // Check if product has any bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("product_id", productId)
      .limit(1)

    if (bookingsError) {
      throw new Error(`Error checking product bookings: ${bookingsError.message}`)
    }

    if (bookings && bookings.length > 0) {
      throw new Error("Cannot delete a product that has booking history. Consider marking it as out of stock instead.")
    }

    // Delete the product
    const { error: deleteError } = await supabase.from("products").delete().eq("id", productId)

    if (deleteError) {
      throw new Error(`Error deleting product: ${deleteError.message}`)
    }

    revalidatePath("/admin/products")
    return { success: true }
  } catch (error: any) {
    console.error("Error in deleteProduct:", error)
    throw error
  }
}

// Get product by ID
export async function getProductById(productId: string) {
  try {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(productId)) {
      throw new Error(`Invalid product ID format: ${productId}`)
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("products").select("*").eq("id", productId).single()

    if (error) {
      throw new Error(`Error fetching product: ${error.message}`)
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      price: Number(data.price),
      discountedPrice: data.discounted_price ? Number(data.discounted_price) : undefined,
      image: data.image_url,
      stock: data.stock,
      status: data.status,
      category: data.category || "mobile",
      maxBookingPerUser: data.max_booking_per_user || 1,
    }
  } catch (error: any) {
    console.error("Error in getProductById:", error)
    throw error
  }
}

// Update product
export async function updateProduct(
  productId: string,
  productData: {
    name: string
    description: string
    price: number
    stock: number
    image: string
    discountedPrice?: number
    category?: string
    maxBookingPerUser?: number
  },
) {
  try {
    const supabase = createServerSupabaseClient()

    // Determine product status based on stock
    let status = "in-stock"
    if (productData.stock === 0) {
      status = "out-of-stock"
    } else if (productData.stock <= 5) {
      status = "low-stock"
    }

    // Update the product with category and max booking per user
    const { error } = await supabase
      .from("products")
      .update({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        discounted_price: productData.discountedPrice || null,
        image_url: productData.image,
        stock: productData.stock,
        status,
        category: productData.category || "mobile",
        max_booking_per_user: productData.maxBookingPerUser || 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)

    if (error) {
      throw new Error(`Error updating product: ${error.message}`)
    }

    revalidatePath(`/admin/products/${productId}`)
    revalidatePath(`/admin/products/edit/${productId}`)
    revalidatePath("/admin/products")
    revalidatePath("/products")

    return { success: true }
  } catch (error: any) {
    console.error("Error in updateProduct:", error)
    throw error
  }
}

// Payment management functions
export async function getPendingPayments() {
  try {
    const supabase = createServerSupabaseClient()

    // Get orders with pending payment approval and bank transfer payment method
    const { data, error } = await supabase
      .from("orders")
      .select("*, bookings(product_id, user_id)")
      .eq("payment_method", "bank_transfer")
      .eq("payment_approval_status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Error fetching pending payments: ${error.message}`)
    }

    // Enhance the data with product and customer information
    const enhancedData = await Promise.all(
      data.map(async (order) => {
        let customerName = "Guest"
        let productName = "Unknown Product"

        // Get customer info if user_id exists
        if (order.user_id) {
          const { data: user } = await supabase.from("profiles").select("full_name").eq("id", order.user_id).single()
          if (user) {
            customerName = user.full_name || "Unknown"
          }
        }

        // Get product info if booking exists
        if (order.bookings && order.bookings.product_id) {
          const { data: product } = await supabase
            .from("products")
            .select("name")
            .eq("id", order.bookings.product_id)
            .single()
          if (product) {
            productName = product.name
          }
        }

        return {
          ...order,
          customer_name: customerName,
          product_name: productName,
        }
      }),
    )

    return enhancedData
  } catch (error: any) {
    console.error("Error in getPendingPayments:", error)
    throw error
  }
}

export async function approvePayment(orderId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user (admin)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to approve payments")
    }

    const adminId = session.user.id

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("booking_id")
      .eq("id", orderId)
      .single()

    if (orderError) {
      throw new Error(`Error fetching order: ${orderError.message}`)
    }

    // Update order status
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_approval_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateOrderError) {
      throw new Error(`Error updating order: ${updateOrderError.message}`)
    }

    // Update booking status if booking exists
    if (order.booking_id) {
      const { error: updateBookingError } = await supabase
        .from("bookings")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.booking_id)

      if (updateBookingError) {
        throw new Error(`Error updating booking: ${updateBookingError.message}`)
      }
    }

    revalidatePath("/admin/payments")
    return { success: true }
  } catch (error: any) {
    console.error("Error in approvePayment:", error)
    throw error
  }
}

export async function rejectPayment(orderId: string, reason?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the current user (admin)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error("You must be logged in to reject payments")
    }

    const adminId = session.user.id

    // Get the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("booking_id")
      .eq("id", orderId)
      .single()

    if (orderError) {
      throw new Error(`Error fetching order: ${orderError.message}`)
    }

    // Update order status
    const { error: updateOrderError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        payment_approval_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)

    if (updateOrderError) {
      throw new Error(`Error updating order: ${updateOrderError.message}`)
    }

    // If booking exists, update it and return product to inventory
    if (order.booking_id) {
      // Get the booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("product_id")
        .eq("id", order.booking_id)
        .single()

      if (bookingError) {
        throw new Error(`Error fetching booking: ${bookingError.message}`)
      }

      // Update booking status
      const { error: updateBookingError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          admin_notes: reason || "Payment rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.booking_id)

      if (updateBookingError) {
        throw new Error(`Error updating booking: ${updateBookingError.message}`)
      }

      // Get the product
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("stock")
        .eq("id", booking.product_id)
        .single()

      if (productError) {
        throw new Error(`Error fetching product: ${productError.message}`)
      }

      // Update product status and stock
      const newStock = product.stock + 1
      const newStatus = newStock > 5 ? "in-stock" : newStock > 0 ? "low-stock" : "out-of-stock"

      const { error: updateProductError } = await supabase
        .from("products")
        .update({
          status: newStatus,
          stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.product_id)

      if (updateProductError) {
        throw new Error(`Error updating product: ${updateProductError.message}`)
      }
    }

    revalidatePath("/admin/payments")
    return { success: true }
  } catch (error: any) {
    console.error("Error in rejectPayment:", error)
    throw error
  }
}

// Generate payment methods report
export async function generatePaymentMethodsReport(startDate?: string, endDate?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Set default date range if not provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Query orders within date range
    const { data, error } = await supabase
      .from("orders")
      .select("payment_method, created_at")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`)
    }

    // Group by payment method
    const paymentMethods: Record<string, number> = {}
    data.forEach((order) => {
      const method = order.payment_method
      paymentMethods[method] = (paymentMethods[method] || 0) + 1
    })

    // Format for chart
    const chartData = Object.entries(paymentMethods).map(([name, value]) => ({
      name: name.replace("_", " "),
      value,
    }))

    // Cache the report
    await supabase.from("report_cache").insert({
      report_type: "payment_methods",
      report_data: chartData,
      date_range_start: start.toISOString(),
      date_range_end: end.toISOString(),
    })

    return chartData
  } catch (error: any) {
    console.error("Error in generatePaymentMethodsReport:", error)
    throw error
  }
}

// Generate approval rates report
export async function generateApprovalRatesReport(startDate?: string, endDate?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Set default date range if not provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Query orders within date range
    const { data, error } = await supabase
      .from("orders")
      .select("payment_approval_status, created_at")
      .eq("payment_method", "bank_transfer")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`)
    }

    // Group by approval status
    const approvalRates: Record<string, number> = {}
    data.forEach((order) => {
      const status = order.payment_approval_status
      approvalRates[status] = (approvalRates[status] || 0) + 1
    })

    // Format for chart
    const chartData = Object.entries(approvalRates).map(([name, value]) => ({
      name,
      value,
    }))

    // Cache the report
    await supabase.from("report_cache").insert({
      report_type: "approval_rates",
      report_data: chartData,
      date_range_start: start.toISOString(),
      date_range_end: end.toISOString(),
    })

    return chartData
  } catch (error: any) {
    console.error("Error in generateApprovalRatesReport:", error)
    throw error
  }
}

// Generate sales over time report
export async function generateSalesReport(startDate?: string, endDate?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Set default date range if not provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Query orders within date range
    const { data, error } = await supabase
      .from("orders")
      .select("created_at, total_amount, status")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: true })

    if (error) {
      throw new Error(`Error fetching orders: ${error.message}`)
    }

    // Group by day
    const dailyData: Record<string, { date: string; total: number }> = {}

    // Initialize with all days in the range
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    for (let i = 0; i < dayCount; i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split("T")[0]
      dailyData[dateStr] = { date: dateStr, total: 0 }
    }

    // Sum order amounts by day
    data.forEach((order) => {
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

    // Cache the report
    await supabase.from("report_cache").insert({
      report_type: "sales",
      report_data: chartData,
      date_range_start: start.toISOString(),
      date_range_end: end.toISOString(),
    })

    return chartData
  } catch (error: any) {
    console.error("Error in generateSalesReport:", error)
    throw error
  }
}
