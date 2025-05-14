import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Clock, CreditCard, Home, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { getBookedProduct } from "@/lib/products"
import { BookingTimer } from "@/components/booking-timer"

export default async function BookingConfirmationPage({ params }: { params: { id: string } }) {
  const product = await getBookedProduct(params.id)

  if (!product) {
    notFound()
  }

  return (
    <div className="container max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Booking Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          You have successfully booked the product. Please complete payment within 48 hours.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
          <CardDescription>Your product has been reserved for 48 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="relative aspect-square h-40 w-40 overflow-hidden rounded-md">
              <Image
                src={product.image || "/placeholder.svg?height=160&width=160"}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{product.name}</h3>
              <p className="mt-2 text-muted-foreground">{product.description}</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xl font-bold">${(product.discountedPrice || product.price).toFixed(2)}</span>
                {product.discountedPrice && (
                  <span className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 text-amber-500">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Payment Due In:</span>
                  <BookingTimer bookingTime={product.bookedAt} expiryTime={product.expiresAt} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row">
          <Button className="w-full sm:w-auto">
            <CreditCard className="mr-2 h-4 w-4" />
            Complete Payment
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h4 className="font-semibold">If you complete payment within 48 hours:</h4>
              <ul className="ml-6 list-disc text-muted-foreground">
                <li>Your order will be processed</li>
                <li>You'll receive an order confirmation email</li>
                <li>Your product will be prepared for shipping</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="font-semibold">If payment is not completed within 48 hours:</h4>
              <ul className="ml-6 list-disc text-muted-foreground">
                <li>Your booking will be automatically cancelled</li>
                <li>The product will be returned to inventory</li>
                <li>You'll need to book again if you still want the product</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
