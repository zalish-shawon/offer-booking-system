export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
