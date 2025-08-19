/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()                           // Convert to string
    .toLowerCase()                       // Convert to lowercase
    .trim()                              // Remove whitespace from both sides
    .replace(/\s+/g, '-')               // Replace spaces with -
    .replace(/[^\w\-]+/g, '')          // Remove all non-word chars
    .replace(/\-\-+/g, '-')            // Replace multiple - with single -
    .replace(/^-+/, '')                  // Trim - from start of text
    .replace(/-+$/, '')                  // Trim - from end of text
    .replace(/-/g, '-')                  // Replace any remaining spaces with -
    .substring(0, 100);                  // Limit length to 100 chars
}
