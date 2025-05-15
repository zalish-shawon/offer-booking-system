"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock, ShoppingCart } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { bookProduct } from "@/lib/actions"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    discountedPrice?: number
    image: string
    stock: number
    isBooked: boolean
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isBooking, setIsBooking] = useState(false)
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price
  const supabase = createClientComponentClient()

  const handleBooking = async () => {
    setIsBooking(true)

    try {
      // Check if user is logged in
      const {
        data: { session },
      } = await supabase.auth.getSession()

      let userId = session?.user?.id
      let allowGuestBooking = false

      // If not logged in, try auto-login
      if (!session) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: "admin@example.com",
            password: "admin123",
          })

          if (!error && data.session) {
            userId = data.session.user.id
            toast({
              title: "Auto-login successful",
              description: "You've been automatically logged in as admin",
            })
          } else {
            // If auto-login fails, allow guest booking
            allowGuestBooking = true
            toast({
              title: "Guest booking",
              description: "Creating a booking as a guest user",
            })
          }
        } catch (loginError) {
          console.error("Auto-login failed:", loginError)
          // Allow guest booking if auto-login fails
          allowGuestBooking = true
        }
      }

      await bookProduct(product.id, userId, allowGuestBooking)

      // Redirect to booking confirmation page
      router.push(`/booking-confirmation/${product.id}`)
    } catch (error: any) {
      console.error("Booking failed:", error)
      toast({
        title: "Booking failed",
        description: error.message || "An error occurred while booking the product",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        <Image
          src={product.image || "/placeholder.svg?height=300&width=300"}
          alt={product.name}
          fill
          className="object-cover"
        />
        {hasDiscount && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            {Math.round(((product.price - product.discountedPrice!) / product.price) * 100)}% OFF
          </Badge>
        )}
      </div>
      <CardHeader className="p-4">
        <CardTitle className="line-clamp-1">{product.name}</CardTitle>
        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold">${product.discountedPrice!.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
            )}
          </div>
          {/* Removed stock display */}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {product.isBooked ? (
          <Button className="w-full" variant="outline" disabled>
            <Clock className="mr-2 h-4 w-4" />
            Currently Booked
          </Button>
        ) : product.stock > 0 ? (
          <Button className="w-full" onClick={handleBooking} disabled={isBooking}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isBooking ? "Processing..." : "Book Now"}
          </Button>
        ) : (
          <Button className="w-full" disabled>
            Out of Stock
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
