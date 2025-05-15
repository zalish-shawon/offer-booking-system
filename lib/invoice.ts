"use server"

import { createServerSupabaseClient } from "./supabase"
import { revalidatePath } from "next/cache"

// Generate a unique invoice number
function generateInvoiceNumber() {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `INV-${year}${month}-${random}`
}

// Create an invoice for an order
export async function createInvoice(orderId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if invoice already exists
    const { data: existingInvoice } = await supabase.from("invoices").select("id").eq("order_id", orderId).single()

    if (existingInvoice) {
      return { success: true, invoiceId: existingInvoice.id, message: "Invoice already exists" }
    }

    // Get order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single()

    if (orderError) {
      throw new Error(`Error fetching order: ${orderError.message}`)
    }

    // Generate invoice data
    const invoiceNumber = generateInvoiceNumber()
    const invoiceDate = new Date()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 14) // Due in 14 days

    const subtotal = Number(order.total_amount)
    const tax = 0 // No tax for now
    const total = subtotal + tax

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        order_id: orderId,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate.toISOString(),
        due_date: dueDate.toISOString(),
        subtotal,
        tax,
        total,
        status: order.status === "paid" ? "paid" : "unpaid",
        notes: `Invoice for order ${orderId}`,
      })
      .select()
      .single()

    if (invoiceError) {
      throw new Error(`Error creating invoice: ${invoiceError.message}`)
    }

    revalidatePath(`/dashboard/invoices/${orderId}`)
    revalidatePath(`/dashboard/orders/${orderId}`)

    return { success: true, invoiceId: invoice.id }
  } catch (error: any) {
    console.error("Error in createInvoice:", error)
    throw error
  }
}

// Get invoice by order ID
export async function getInvoiceByOrderId(orderId: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        orders!inner(
          *,
          bookings!inner(
            *,
            products!inner(name, price, description, image_url, category)
          )
        )
      `)
      .eq("order_id", orderId)
      .single()

    if (error) {
      throw new Error(`Error fetching invoice: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("Error in getInvoiceByOrderId:", error)
    throw error
  }
}

// Get all invoices for a user
export async function getUserInvoices(userId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // First, get all orders for the user
    const { data: orders, error: ordersError } = await supabase.from("orders").select("id").eq("user_id", userId)

    if (ordersError) {
      throw new Error(`Error fetching orders: ${ordersError.message}`)
    }

    if (!orders || orders.length === 0) {
      return []
    }

    // Then get invoices for those orders
    const orderIds = orders.map((order) => order.id)

    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        orders!inner(
          id,
          status,
          created_at,
          total_amount
        )
      `)
      .in("order_id", orderIds)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Error fetching invoices: ${error.message}`)
    }

    // For each invoice, get the product name separately
    const invoicesWithProducts = await Promise.all(
      data.map(async (invoice) => {
        const { data: booking } = await supabase
          .from("bookings")
          .select("product_id")
          .eq("id", invoice.orders.booking_id)
          .single()

        if (booking) {
          const { data: product } = await supabase.from("products").select("name").eq("id", booking.product_id).single()

          return {
            ...invoice,
            productName: product ? product.name : "Unknown Product",
          }
        }

        return {
          ...invoice,
          productName: "Unknown Product",
        }
      }),
    )

    return invoicesWithProducts
  } catch (error: any) {
    console.error("Error in getUserInvoices:", error)
    throw error
  }
}
