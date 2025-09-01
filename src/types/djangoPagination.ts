/**
 * Props for Django-compatible pagination component
 */
export interface DjangoPaginationProps {
  /** URL for next page or null */
  next: string | null;
  /** URL for previous page or null */
  previous: string | null;
  /** Total count of items */
  count: number;
  /** Current page number (1-based) */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Callback for page changes */
  onPageChange: (newPage: number) => void;
  /** Loading state */
  loading?: boolean;
}
