const MAX_TITLE_LENGTH = 30;

/**
 * Generate a conversation title from the first message.
 * Truncates at word boundary if possible, adds "..." if truncated.
 */
export function generateTitle(message: string): string {
  // Trim and normalize whitespace
  const normalized = message.trim().replace(/\s+/g, ' ');

  if (normalized.length <= MAX_TITLE_LENGTH) {
    return normalized;
  }

  // Try to truncate at a word boundary
  const truncated = normalized.slice(0, MAX_TITLE_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');

  // If there's a space in a reasonable position, truncate there
  if (lastSpace > MAX_TITLE_LENGTH * 0.5) {
    return truncated.slice(0, lastSpace) + '...';
  }

  // Otherwise, just truncate at max length
  return truncated + '...';
}
