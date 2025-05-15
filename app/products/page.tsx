import { Suspense } from "react"
import { ProductsClient } from "@/components/products-client"
import { getAllProducts } from "@/lib/products"
import { ProductsFilterSkeleton } from "@/components/skeletons"
import { ProductCard } from "@/components/product-card"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const search = typeof searchParams.search === "string" ? searchParams.search : ""
  const products = await getAllProducts(search)

  return (
    <div className="container flex flex-col items-center justify-center px-4 py-8 md:px-6 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Browse our collection of mobile phones</p>
        </div>
        <ProductsClient initialSearch={search} />
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
