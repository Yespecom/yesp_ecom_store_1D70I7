"use client"

import { useEffect } from 'react'

export function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Check if the error is a ChunkLoadError (or similar network error for chunks)
      if (event.message && event.message.includes('ChunkLoadError')) {
        console.error('ChunkLoadError detected, forcing page reload:', event);
        // Force a hard reload to clear stale chunks
        window.location.reload();
      }
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component doesn't render anything visible
}
