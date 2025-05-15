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

// Add these functions after the deleteProduct function

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

    // Update the product with category
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
