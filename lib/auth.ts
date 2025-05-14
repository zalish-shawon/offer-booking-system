"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerSupabaseClient } from "./supabase"
import { revalidatePath } from "next/cache"

// Types
export type UserRole = "admin" | "user"

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_blocked: boolean
  created_at: string
}

// Get the current user session
export async function getCurrentUser() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Get the user profile with role information
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!profile) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    full_name: profile.full_name,
    role: profile.role as UserRole,
    is_blocked: profile.is_blocked,
  }
}

// Check if the current user is authenticated
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (user.is_blocked) {
    redirect("/auth/blocked")
  }

  return user
}

// Check if the current user is an admin
export async function requireAdmin() {
  const user = await requireAuth()

  if (user.role !== "admin") {
    redirect("/unauthorized")
  }

  return user
}

// Create an admin user (for initial setup)
export async function createAdminUser(email: string, password: string, fullName: string) {
  const supabase = createServerSupabaseClient()

  // Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  })

  if (authError) {
    throw new Error(`Error creating admin user: ${authError.message}`)
  }

  // Update the user's role to admin
  const { error: profileError } = await supabase.from("profiles").update({ role: "admin" }).eq("id", authData.user.id)

  if (profileError) {
    throw new Error(`Error setting admin role: ${profileError.message}`)
  }

  return authData.user
}

// Get all users (for admin)
export async function getAllUsers() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

  if (error) {
    throw new Error(`Error fetching users: ${error.message}`)
  }

  return data as UserProfile[]
}

// Update user role (for admin)
export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

  if (error) {
    throw new Error(`Error updating user role: ${error.message}`)
  }

  revalidatePath("/admin/users")
  return { success: true }
}

// Block/unblock user (for admin)
export async function toggleUserBlock(userId: string, isBlocked: boolean) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("profiles").update({ is_blocked: isBlocked }).eq("id", userId)

  if (error) {
    throw new Error(`Error ${isBlocked ? "blocking" : "unblocking"} user: ${error.message}`)
  }

  revalidatePath("/admin/users")
  return { success: true }
}

// Delete user (for admin)
export async function deleteUser(userId: string) {
  const supabase = createServerSupabaseClient()

  // First, check if user has any active bookings or orders
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["pending", "paid"])

  if (bookingsError) {
    throw new Error(`Error checking user bookings: ${bookingsError.message}`)
  }

  if (bookings && bookings.length > 0) {
    throw new Error("Cannot delete user with active bookings. Please cancel or complete them first.")
  }

  // Delete the user from auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId)

  if (authError) {
    throw new Error(`Error deleting user: ${authError.message}`)
  }

  revalidatePath("/admin/users")
  return { success: true }
}
