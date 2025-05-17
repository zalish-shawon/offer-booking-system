"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Loader2, Clock } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { BookingTimer } from "@/components/booking-timer"
import { getBookedProduct, completePayment } from "@/lib/actions"

export default function BookingConfirmationPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<"online" | "bank_transfer">("online")
  const [shippingAddress, setShippingAddress] = useState("")
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null)
  const [paymentSlipPreview, setPaymentSlipPreview] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getBookedProduct(params.id)
        if (!data) {
          toast({
            title: "Product not found",
            description: "The requested product could not be found or is not currently booked.",
            variant: "destructive",
          })
          router.push("/products")
          return
        }
        setProduct(data)
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [params.id, router, toast])

  const handlePaymentSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPaymentSlip(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentSlipPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!shippingAddress) {
        toast({
          title: "Shipping address required",
          description: "Please enter a shipping address to continue.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      if (paymentMethod === "bank_transfer" && !paymentSlip) {
        toast({
          title: "Payment slip required",
          description: "Please upload a payment slip to continue with bank transfer.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      let paymentSlipUrl = null
      if (paymentMethod === "bank_transfer" && paymentSlip) {
        // Upload payment slip to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("payment_slips")
          .upload(`slip_${Date.now()}_${paymentSlip.name}`, paymentSlip)

        if (uploadError) {
          throw new Error(`Error uploading payment slip: ${uploadError.message}`)
        }

        // Get the public URL
        const { data: urlData } = supabase.storage.from("payment_slips").getPublicUrl(uploadData.path)
        paymentSlipUrl = urlData.publicUrl
      }

      // Complete the payment
      const result = await completePayment(product.id, {
        paymentMethod,
        shippingAddress,
        paymentSlipUrl,
      })

      toast({
        title: "Payment successful",
        description:
          paymentMethod === "online"
            ? "Your payment has been processed successfully."
            : "Your payment slip has been uploaded and is awaiting approval.",
      })

      // Redirect to a thank you page
      router.push(`/order-confirmation/${result.orderId}`)
    } catch (error: any) {
      console.error("Payment error:", error)
      toast({
        title: "Payment failed",
        description: error.message || "An error occurred while processing your payment.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
            <CardDescription>The requested product could not be found or is not currently booked.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Complete Your Purchase</h1>
        <div className="flex items-center gap-2 mt-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <p>
            Your item is reserved for{" "}
            <span className="font-medium">
              <BookingTimer expiresAt={product.expiresAt} onExpire={() => router.push("/products")} />
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square mb-4">
                <Image
                  src={product.image || "/placeholder.svg?height=300&width=300"}
                  alt={product.name}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-muted-foreground">{product.description}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span>Price:</span>
                  <span className="font-semibold">${(product.discountedPrice || product.price).toFixed(2)}</span>
                </div>
                {product.discountedPrice && (
                  <div className="flex items-center justify-between">
                    <span>Original Price:</span>
                    <span className="line-through text-muted-foreground">${product.price.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Complete your payment to secure your booking</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="shipping-address">Shipping Address</Label>
                    <Textarea
                      id="shipping-address"
                      placeholder="Enter your full shipping address"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label>Payment Method</Label>
                    <RadioGroup
                      value={paymentMethod}
                      onValueChange={(value) => setPaymentMethod(value as "online" | "bank_transfer")}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="online" id="online" />
                        <Label htmlFor="online" className="cursor-pointer">
                          Online Payment (Credit/Debit Card)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                        <Label htmlFor="bank_transfer" className="cursor-pointer">
                          Bank Transfer (Manual Verification)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {paymentMethod === "bank_transfer" && (
                    <div className="space-y-4">
                      <div className="rounded-md bg-muted p-4">
                        <h4 className="font-medium mb-2">Bank Transfer Instructions</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Please transfer the exact amount to the following account:
                        </p>
                        <div className="text-sm">
                          <p>
                            <span className="font-medium">Bank:</span> Example Bank
                          </p>
                          <p>
                            <span className="font-medium">Account Name:</span> Your Company Name
                          </p>
                          <p>
                            <span className="font-medium">Account Number:</span> 1234567890
                          </p>
                          <p>
                            <span className="font-medium">Amount:</span> $
                            {(product.discountedPrice || product.price).toFixed(2)}
                          </p>
                          <p>
                            <span className="font-medium">Reference:</span> {product.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="payment-slip">Upload Payment Slip</Label>
                        <div className="mt-1">
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="payment-slip"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                              {paymentSlipPreview ? (
                                <div className="relative w-full h-full">
                                  <Image
                                    src={paymentSlipPreview || "/placeholder.svg"}
                                    alt="Payment slip preview"
                                    fill
                                    className="object-contain p-2"
                                  />
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-xs text-gray-500">PNG, JPG or PDF (max 10MB)</p>
                                </div>
                              )}
                              <input
                                id="payment-slip"
                                type="file"
                                accept="image/png, image/jpeg, application/pdf"
                                className="hidden"
                                onChange={handlePaymentSlipChange}
                                required={paymentMethod === "bank_transfer"}
                              />
                            </label>
                          </div>
                        </div>
                        {paymentSlipPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setPaymentSlip(null)
                              setPaymentSlipPreview(null)
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentMethod === "online" && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          className="mt-1"
                          required={paymentMethod === "online"}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry-date">Expiry Date</Label>
                          <Input
                            id="expiry-date"
                            placeholder="MM/YY"
                            className="mt-1"
                            required={paymentMethod === "online"}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" className="mt-1" required={paymentMethod === "online"} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="card-name">Name on Card</Label>
                        <Input
                          id="card-name"
                          placeholder="John Doe"
                          className="mt-1"
                          required={paymentMethod === "online"}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay $${(product.discountedPrice || product.price).toFixed(2)}`
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
