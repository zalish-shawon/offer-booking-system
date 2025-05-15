import { redirect } from "next/navigation"

export default function BulkUploadRedirect() {
  redirect("/admin/products/bulk-upload")
}
