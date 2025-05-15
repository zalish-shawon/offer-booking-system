"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { getProductById, updateProduct } from "@/lib/admin-actions"

// Helper function to validate UUID format
function isValidUUID(id: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    discountedPrice: 0,
    hasDiscount: false,
    stock: 0,
    category: "",
    image: "",
    maxBookingPerUser: 1,
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Check if the ID is a valid UUID format before fetching
        if (!isValidUUID(params.id)) {
          router.push("/admin/products")
          return
        }

        const data = await getProductById(params.id)
        setProduct(data)
        setFormData({
          name: data.name,
          description: data.description,
          price: data.price,
          discountedPrice: data.discountedPrice || 0,
          hasDiscount: !!data.discountedPrice,
          stock: data.stock,
          category: data.category || "Mobile",
          image: data.image || "",
          maxBookingPerUser: data.maxBookingPerUser || 1,
        })
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "discountedPrice" || name === "stock" || name === "maxBookingPerUser"
          ? Number.parseFloat(value)
          : value,
    }))
  }

  const handleDiscountToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      hasDiscount: checked,
      discountedPrice: checked ? prev.discountedPrice : 0,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await updateProduct({
        id: product.id,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        discountedPrice: formData.hasDiscount ? formData.discountedPrice : null,
        stock: formData.stock,
        category: formData.category,
        image: formData.image,
        maxBookingPerUser: formData.maxBookingPerUser,
      })

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      router.push("/admin/products")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
      <div className="mb-8 flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the product's basic details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleInputChange} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
              <CardDescription>Update the product's pricing and stock information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Regular Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="hasDiscount" checked={formData.hasDiscount} onCheckedChange={handleDiscountToggle} />
                <Label htmlFor="hasDiscount">Apply Discount</Label>
              </div>
              {formData.hasDiscount && (
                <div className="space-y-2">
                  <Label htmlFor="discountedPrice">Discounted Price ($)</Label>
                  <Input
                    id="discountedPrice"
                    name="discountedPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountedPrice}
                    onChange={handleInputChange}
                    required={formData.hasDiscount}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxBookingPerUser">Max Booking Per User</Label>
                <Input
                  id="maxBookingPerUser"
                  name="maxBookingPerUser"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.maxBookingPerUser}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-sm text-muted-foreground">Maximum number of this product a single user can book</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
              <CardDescription>Update the product's image.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-md border border-dashed border-gray-300 cursor-pointer"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  {formData.image ? (
                    <Image
                      src={formData.image || "/placeholder.svg"}
                      alt="Product preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-center text-sm text-gray-500">Click to upload an image</p>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                {formData.image && (
                  <Button type="button" variant="outline" onClick={removeImage}>
                    Remove Image
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/products">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
