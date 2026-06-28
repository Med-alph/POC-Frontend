import { useEffect } from 'react';

/**
 * usePageTitle — sets document.title for a given page.
 *
 * Usage:
 *   usePageTitle('Patients');          → "Patients | Medalph"
 *   usePageTitle('Dashboard', false);  → "Dashboard"  (no suffix)
 *
 * @param {string} title        - Page-specific title
 * @param {boolean} withSuffix  - Whether to append "| Medalph" (default true)
 */
export function usePageTitle(title, withSuffix = true) {
  useEffect(() => {
    const prev = document.title;
    document.title = withSuffix ? `${title} | Medalph` : title;

    // Restore previous title when component unmounts
    return () => {
      document.title = prev;
    };
  }, [title, withSuffix]);
}

export default usePageTitle;
