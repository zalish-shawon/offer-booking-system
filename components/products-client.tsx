"use client"

import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProductsClientProps {
  initialSearch: string
}

export function ProductsClient({ initialSearch }: ProductsClientProps) {
  const [search, setSearch] = useState(initialSearch)
  const router = useRouter()

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams(window.location.search)

    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full md:w-[300px]">
        <Input
          placeholder="Search products..."
          className="w-full"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <Button variant="outline" size="icon">
        <SlidersHorizontal className="h-4 w-4" />
        <span className="sr-only">Filter</span>
      </Button>
    </div>
  )
}
