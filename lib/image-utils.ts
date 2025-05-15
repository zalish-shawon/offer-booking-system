/**
 * Validates and normalizes image URLs
 * @param url The image URL to validate
 * @param fallback Optional fallback URL if the provided URL is invalid
 * @returns A valid image URL or the fallback
 */
export function validateImageUrl(
  url: string | null | undefined,
  fallback = "/placeholder.svg?height=300&width=300",
): string {
  // Check if URL is null, undefined, or empty
  if (!url || url.trim() === "") {
    return fallback
  }

  // Check if URL is already a valid absolute URL
  try {
    new URL(url)
    return url
  } catch (e) {
    // If URL is not absolute, check if it's a valid relative URL
    if (url.startsWith("/")) {
      return url
    }
  }

  // If all checks fail, return the fallback
  return fallback
}
