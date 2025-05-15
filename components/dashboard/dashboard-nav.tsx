"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { User, ShoppingBag, CreditCard, Clock, FileText, Settings } from "lucide-react"

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: <ShoppingBag className="mr-2 h-4 w-4" />,
  },
  {
    title: "Orders",
    href: "/dashboard/orders",
    icon: <ShoppingBag className="mr-2 h-4 w-4" />,
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: <CreditCard className="mr-2 h-4 w-4" />,
  },
  {
    title: "Purchase History",
    href: "/dashboard/history",
    icon: <Clock className="mr-2 h-4 w-4" />,
  },
  {
    title: "Invoices",
    href: "/dashboard/invoices",
    icon: <FileText className="mr-2 h-4 w-4" />,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: <User className="mr-2 h-4 w-4" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="mr-2 h-4 w-4" />,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item, index) => (
        <Link key={index} href={item.href}>
          <Button
            variant={pathname === item.href ? "default" : "ghost"}
            className={cn(
              "w-full justify-start",
              pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {item.icon}
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  )
}
