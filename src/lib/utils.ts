/**
 * Formats a date for display
 * @param date The date to format
 * @param format The format to use ('date', 'time', 'datetime', 'relative')
 * @returns A formatted date string
 */
export function formatDate(date: Date, format: 'date' | 'time' | 'datetime' | 'relative' = 'date'): string {
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  switch (format) {
    case 'relative':
      if (diffMs < 1000 * 60) {
        return 'Just now';
      } else if (diffMs < 1000 * 60 * 60) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes}m ago`;
      } else if (diffMs < 1000 * 60 * 60 * 24) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        return `${diffHours}h ago`;
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        // For older dates, use the date format
        return formatDate(date, 'date');
      }
      
    case 'date':
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      };
      
      const sameYear = date.getFullYear() === now.getFullYear();
      if (sameYear) {
        options.year = undefined;
      }
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      }
      
      return date.toLocaleDateString(undefined, options);
      
    case 'time':
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      
      return date.toLocaleTimeString(undefined, timeOptions);
      
    case 'datetime':
      const timeStr = date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const dateStr = formatDate(date, 'date');
      return `${dateStr} at ${timeStr}`;
      
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Truncates a string to a maximum length with ellipsis
 * @param str The string to truncate
 * @param maxLength The maximum length
 * @returns The truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Generates a random ID
 * @returns A random ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
} 