"use client"

import { useEffect, useState } from "react"

interface BookingTimerProps {
  bookingTime: string
  expiryTime?: string
  durationHours?: number
}

export function BookingTimer({ bookingTime, expiryTime, durationHours = 48 }: BookingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      let expiryDate: Date

      if (expiryTime) {
        expiryDate = new Date(expiryTime)
      } else {
        const bookingDate = new Date(bookingTime)
        expiryDate = new Date(bookingDate.getTime() + durationHours * 60 * 60 * 1000)
      }

      const now = new Date()
      const difference = expiryDate.getTime() - now.getTime()

      if (difference <= 0) {
        setIsExpired(true)
        return { hours: 0, minutes: 0, seconds: 0 }
      }

      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { hours, minutes, seconds }
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      if (newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        clearInterval(timer)
        setIsExpired(true)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [bookingTime, expiryTime, durationHours])

  if (isExpired) {
    return <span className="font-bold text-red-500">Expired</span>
  }

  return (
    <span className="font-mono font-bold">
      {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
      {String(timeLeft.seconds).padStart(2, "0")}
    </span>
  )
}
