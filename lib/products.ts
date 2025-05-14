"use server"
import { createServerSupabaseClient, type Product } from "./supabase"

// Get featured products for the homepage
export async function getFeaturedProducts() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("status", ["in-stock", "low-stock"])
      .order("created_at", { ascending: false })
      .limit(4)

    if (error) {
      console.error("Error fetching featured products:", error)
      return []
    }

    return data.map(formatProductForClient)
  } catch (error) {
    console.error("Error in getFeaturedProducts:", error)
    return []
  }
}

// Get all products with optional search
export async function getAllProducts(search = "") {
  try {
    const supabase = createServerSupabaseClient()

    let query = supabase.from("products").select("*")

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching all products:", error)
      return []
    }

    return data.map(formatProductForClient)
  } catch (error) {
    console.error("Error in getAllProducts:", error)
    return []
  }
}

// Get a single product by ID
export async function getProductById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching product by ID:", error)
      return null
    }

    return formatProductForClient(data)
  } catch (error) {
    console.error("Error in getProductById:", error)
    return null
  }
}

// Get a booked product by ID
export async function getBookedProduct(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // First, get the product
    const { data: product, error: productError } = await supabase.from("products").select("*").eq("id", id).single()

    if (productError) {
      console.error("Error fetching booked product:", productError)
      return null
    }

    // Then, get the booking information
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("product_id", id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (bookingError && bookingError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      console.error("Error fetching booking:", bookingError)
    }

    const formattedProduct = formatProductForClient(product)

    // If there's a booking, add the booking info to the product
    if (booking) {
      return {
        ...formattedProduct,
        isBooked: true,
        bookedAt: booking.booked_at,
        expiresAt: booking.expires_at,
      }
    }

    return formattedProduct
  } catch (error) {
    console.error("Error in getBookedProduct:", error)
    return null
  }
}

// Helper function to format product data for client
function formatProductForClient(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    discountedPrice: product.discounted_price ? Number(product.discounted_price) : undefined,
    image: product.image_url,
    stock: product.stock,
    status: product.status,
    isBooked: product.status === "booked",
  }
}
