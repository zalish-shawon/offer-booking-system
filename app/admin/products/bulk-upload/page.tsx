"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileSpreadsheet, Loader2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { bulkUploadProducts } from "@/lib/actions"

export default function BulkUploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [parsedProducts, setParsedProducts] = useState<any[] | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadError(null)

      // Parse CSV or JSON file
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string

          if (selectedFile.name.endsWith(".json")) {
            // Parse JSON
            const products = JSON.parse(fileContent)
            validateAndSetProducts(products)
          } else if (selectedFile.name.endsWith(".csv")) {
            // Parse CSV
            const products = parseCSV(fileContent)
            validateAndSetProducts(products)
          } else {
            setUploadError("Unsupported file format. Please upload a CSV or JSON file.")
          }
        } catch (error) {
          console.error("Error parsing file:", error)
          setUploadError("Failed to parse file. Please check the file format.")
        }
      }

      reader.readAsText(selectedFile)
    }
  }

  const parseCSV = (csvContent: string) => {
    const lines = csvContent.split("\n")
    const headers = lines[0].split(",").map((header) => header.trim())

    const products = []

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = lines[i].split(",").map((value) => value.trim())
      const product: Record<string, any> = {}

      headers.forEach((header, index) => {
        if (header === "price" || header === "discounted_price" || header === "stock") {
          product[header] = values[index] ? Number.parseFloat(values[index]) : null
        } else {
          product[header] = values[index]
        }
      })

      products.push(product)
    }

    return products
  }

  const validateAndSetProducts = (products: any[]) => {
    if (!Array.isArray(products)) {
      setUploadError("Invalid file format. Expected an array of products.")
      return
    }

    const validatedProducts = products.filter((product) => {
      return (
        product.name &&
        product.description &&
        !isNaN(Number.parseFloat(product.price)) &&
        !isNaN(Number.parseInt(product.stock))
      )
    })

    if (validatedProducts.length === 0) {
      setUploadError("No valid products found in the file.")
      return
    }

    setParsedProducts(validatedProducts)
  }

  const handleUpload = async () => {
    if (!parsedProducts) return

    setIsUploading(true)

    try {
      const result = await bulkUploadProducts(parsedProducts)

      toast({
        title: "Products uploaded successfully",
        description: `${result.successCount} products were added to your inventory.`,
      })

      router.push("/admin/products")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload products",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bulk Upload Products</h1>
        <p className="text-muted-foreground">Upload multiple products at once using a CSV or JSON file</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Product File</CardTitle>
          <CardDescription>Upload a CSV or JSON file containing product information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-4">
            <div
              className="relative flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/25 p-4 text-center transition-colors hover:border-muted-foreground/50"
              onClick={() => document.getElementById("product-file")?.click()}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-10 w-10 text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {parsedProducts ? `${parsedProducts.length} products found` : "Processing file..."}
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground">CSV or JSON file (max 10MB)</p>
                </>
              )}
              <input
                id="product-file"
                type="file"
                accept=".csv,.json"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>

            {uploadError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {parsedProducts && (
              <Alert>
                <AlertTitle>File Parsed Successfully</AlertTitle>
                <AlertDescription>{parsedProducts.length} products are ready to be uploaded.</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">File Format</h3>
            <p className="text-sm text-muted-foreground">Your CSV or JSON file should include the following fields:</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>name (required) - Product name</li>
              <li>description (required) - Product description</li>
              <li>price (required) - Regular price</li>
              <li>discounted_price (optional) - Discounted price</li>
              <li>stock (required) - Stock quantity</li>
              <li>image_url (optional) - URL to product image</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!parsedProducts || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Products"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
