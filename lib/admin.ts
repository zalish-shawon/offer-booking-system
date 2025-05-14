"use server"

import { createServerSupabaseClient } from "./supabase"

// Get admin dashboard data
export async function getAdminDashboardData() {
  try {
    const supabase = createServerSupabaseClient()

    // Get total products count
    const { count: totalProducts, error: productsError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })

    if (productsError) {
      console.error("Error fetching total products:", productsError)
      throw productsError
    }

    // Get total orders count
    const { count: totalOrders, error: ordersError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })

    if (ordersError) {
      console.error("Error fetching total orders:", ordersError)
      throw ordersError
    }

    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "paid")

    if (revenueError) {
      console.error("Error fetching revenue data:", revenueError)
      throw revenueError
    }

    const totalRevenue = revenueData.reduce((sum, order) => sum + Number(order.total_amount), 0)

    // Get pending payments count
    const { count: pendingPayments, error: pendingError } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    if (pendingError) {
      console.error("Error fetching pending payments:", pendingError)
      throw pendingError
    }

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      console.error("Error fetching total users:", usersError)
      throw usersError
    }

    // Get recent orders - Fix the relationship issue
    const { data: recentOrdersData, error: recentOrdersError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        status,
        created_at,
        user_id,
        booking_id
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentOrdersError) {
      console.error("Error fetching recent orders:", recentOrdersError)
      throw recentOrdersError
    }

    // Fetch booking and product details separately
    const recentOrders = await Promise.all(
      recentOrdersData.map(async (order) => {
        let productName = "Unknown Product"
        let customerEmail = "Guest"

        // If there's a booking_id, get the product name
        if (order.booking_id) {
          const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select(`
              product_id,
              user_id
            `)
            .eq("id", order.booking_id)
            .single()

          if (!bookingError && booking) {
            // Get product name
            if (booking.product_id) {
              const { data: product, error: productError } = await supabase
                .from("products")
                .select("name")
                .eq("id", booking.product_id)
                .single()

              if (!productError && product) {
                productName = product.name
              }
            }

            // Get user email if not already set from order
            if (booking.user_id && !order.user_id) {
              const { data: user, error: userError } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", booking.user_id)
                .single()

              if (!userError && user) {
                customerEmail = user.email
              }
            }
          }
        }

        // If order has user_id directly, get the email
        if (order.user_id) {
          const { data: user, error: userError } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", order.user_id)
            .single()

          if (!userError && user) {
            customerEmail = user.email
          }
        }

        return {
          id: order.id,
          customer: customerEmail,
          product: productName,
          status: order.status,
          date: order.created_at,
          total: Number(order.total_amount),
        }
      }),
    )

    // Get recent products
    const { data: recentProducts, error: recentProductsError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentProductsError) {
      console.error("Error fetching recent products:", recentProductsError)
      throw recentProductsError
    }

    // Format recent products
    const formattedRecentProducts = recentProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      discountedPrice: product.discounted_price ? Number(product.discounted_price) : null,
      stock: product.stock,
      image: product.image_url,
      status: product.status,
    }))

    return {
      totalProducts: totalProducts || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      totalUsers: totalUsers || 0,
      pendingPayments: pendingPayments || 0,
      recentOrders,
      recentProducts: formattedRecentProducts,
    }
  } catch (error) {
    console.error("Error in getAdminDashboardData:", error)
    // Return default values in case of error
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalUsers: 0,
      pendingPayments: 0,
      recentOrders: [],
      recentProducts: [],
    }
  }
}

// Get all products for admin
export async function getAdminProducts() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching admin products:", error)
      return []
    }

    return data.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      discountedPrice: product.discounted_price ? Number(product.discounted_price) : null,
      stock: product.stock,
      image: product.image_url,
      status: product.status,
    }))
  } catch (error) {
    console.error("Error in getAdminProducts:", error)
    return []
  }
}

// Get all orders for admin
export async function getAdminOrders() {
  try {
    const supabase = createServerSupabaseClient()

    // Get orders without the problematic join
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        status,
        created_at,
        user_id,
        booking_id
      `)
      .order("created_at", { ascending: false })

    if (ordersError) {
      console.error("Error fetching admin orders:", ordersError)
      return []
    }

    // Process each order to get related data
    const orders = await Promise.all(
      ordersData.map(async (order) => {
        let productName = "Unknown Product"
        let customerEmail = "Guest"

        // If there's a booking_id, get the product name
        if (order.booking_id) {
          const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .select(`
              product_id,
              user_id
            `)
            .eq("id", order.booking_id)
            .single()

          if (!bookingError && booking) {
            // Get product name
            if (booking.product_id) {
              const { data: product, error: productError } = await supabase
                .from("products")
                .select("name")
                .eq("id", booking.product_id)
                .single()

              if (!productError && product) {
                productName = product.name
              }
            }

            // Get user email if not already set from order
            if (booking.user_id && !order.user_id) {
              const { data: user, error: userError } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", booking.user_id)
                .single()

              if (!userError && user) {
                customerEmail = user.email
              }
            }
          }
        }

        // If order has user_id directly, get the email
        if (order.user_id) {
          const { data: user, error: userError } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", order.user_id)
            .single()

          if (!userError && user) {
            customerEmail = user.email
          }
        }

        return {
          id: order.id,
          customer: customerEmail,
          product: productName,
          status: order.status,
          date: order.created_at,
          total: Number(order.total_amount),
        }
      }),
    )

    return orders
  } catch (error) {
    console.error("Error in getAdminOrders:", error)
    return []
  }
}

// Get all bookings for admin
export async function getAdminBookings() {
  try {
    const supabase = createServerSupabaseClient()

    // Modify the query to avoid the relationship issue
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        approval_status,
        admin_notes,
        booked_at,
        expires_at,
        product_id,
        user_id
      `)
      .order("booked_at", { ascending: false })

    if (bookingsError) {
      console.error("Error fetching admin bookings:", bookingsError)
      return []
    }

    // Process each booking to get related data
    const bookings = await Promise.all(
      bookingsData.map(async (booking) => {
        let product = {
          id: "",
          name: "Unknown Product",
          price: 0,
          discounted_price: null,
        }

        let user = {
          id: "",
          email: "Guest",
          full_name: null,
        }

        // Get product details
        if (booking.product_id) {
          const { data: productData, error: productError } = await supabase
            .from("products")
            .select("id, name, price, discounted_price")
            .eq("id", booking.product_id)
            .single()

          if (!productError && productData) {
            product = productData
          }
        }

        // Get user details
        if (booking.user_id) {
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .eq("id", booking.user_id)
            .single()

          if (!userError && userData) {
            user = userData
          }
        }

        return {
          id: booking.id,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
          },
          product: {
            id: product.id,
            name: product.name,
            price: Number(product.price || 0),
            discounted_price: product.discounted_price ? Number(product.discounted_price) : null,
          },
          booked_at: booking.booked_at,
          expires_at: booking.expires_at,
          status: booking.status,
          approval_status: booking.approval_status,
          admin_notes: booking.admin_notes,
        }
      }),
    )

    return bookings
  } catch (error) {
    console.error("Error in getAdminBookings:", error)
    return []
  }
}
