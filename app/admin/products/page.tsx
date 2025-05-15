import { notFound } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { requireAdmin } from "@/lib/auth"
import { AdminProductsTable } from "@/components/admin/products-table"
import { getAdminProducts } from "@/lib/admin"
import { Button } from "@/components/ui/button"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"

export default async function AdminProductsPage() {
  try {
    // Ensure user is admin
    await requireAdmin()

    // Get all products
    const products = await getAdminProducts()

    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Products Management</h2>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/admin/products/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/products/bulk-upload">Bulk Upload</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <AdminProductsTable products={products} />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in AdminProductsPage:", error)
    notFound()
  }
}
