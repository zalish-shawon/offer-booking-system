"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Edit, Loader2, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { getProductById } from "@/lib/admin-actions"

export default function ProductDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(params.id)
        setProduct(data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch product details",
          variant: "destructive",
        })
        router.push("/admin/products")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, router, toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-500"
      case "low-stock":
        return "bg-yellow-500"
      case "out-of-stock":
        return "bg-red-500"
      case "booked":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Product Not Found</CardTitle>
            <CardDescription>The requested product could not be found.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/products">Back to Products</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Product Details</h1>
        </div>
        <Button asChild>
          <Link href={`/admin/products/edit/${product.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Product
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative aspect-square">
            <Image
              src={product.image || "/placeholder.svg?height=400&width=400"}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              <Badge className={getStatusColor(product.status)}>
                {product.status
                  .split("-")
                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
              </Badge>
            </div>
            <CardDescription>Product ID: {product.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Price</h3>
                <div className="flex items-center gap-2">
                  {product.discountedPrice ? (
                    <>
                      <p className="text-xl font-bold">${product.discountedPrice.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold">${product.price.toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold">Stock</h3>
                <p className="text-xl">{product.stock} units</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold">Category</h3>
              <p>{product.category || "Mobile"}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin/products">Back to Products</Link>
            </Button>
            <Button asChild>
              <Link href={`/admin/products/edit/${product.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Product
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
