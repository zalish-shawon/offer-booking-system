"use client"

import { Suspense } from "react"
import { SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/product-card"
import { getAllProducts } from "@/lib/products"
import { ProductsFilterSkeleton } from "@/components/skeletons"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const search = typeof searchParams.search === "string" ? searchParams.search : ""
  const products = await getAllProducts(search)

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Browse our collection of mobile phones</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-[300px]">
            <Input
              placeholder="Search products..."
              className="w-full"
              defaultValue={search}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search)
                if (e.target.value) {
                  params.set("search", e.target.value)
                } else {
                  params.delete("search")
                }
                window.history.replaceState(null, "", `?${params.toString()}`)
              }}
            />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>

      <Suspense fallback={<ProductsFilterSkeleton />}>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.length > 0 ? (
            products.map((product) => <ProductCard key={product.id} product={product} />)
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <h2 className="text-xl font-semibold">No products found</h2>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </Suspense>
    </div>
  )
}
