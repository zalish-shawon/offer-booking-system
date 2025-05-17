"use client"

import { useState, useEffect } from "react"

interface BookingTimerProps {
  expiresAt: string
  onExpire?: () => void
}

export function BookingTimer({ expiresAt, onExpire }: BookingTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expiryTime = new Date(expiresAt).getTime()
      const now = new Date().getTime()
      const difference = expiryTime - now

      if (difference <= 0) {
        setIsExpired(true)
        if (onExpire) {
          onExpire()
        }
        return { hours: 0, minutes: 0, seconds: 0 }
      }

      // Calculate time units
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
    }, 1000)

    // Cleanup
    return () => clearInterval(timer)
  }, [expiresAt, onExpire])

  if (isExpired) {
    return <span className="font-semibold text-red-500">Expired</span>
  }

  return (
    <span className="font-semibold">
      {timeLeft.hours.toString().padStart(2, "0")}:{timeLeft.minutes.toString().padStart(2, "0")}:
      {timeLeft.seconds.toString().padStart(2, "0")}
    </span>
  )
}
