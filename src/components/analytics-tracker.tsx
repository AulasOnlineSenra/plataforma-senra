'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function AnalyticsTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>(pathname);

  useEffect(() => {
    // We send a ping when the path changes, calculating time spent on the PREVIOUS path
    const trackPageLeave = () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      const isMobile = window.innerWidth < 768;
      
      let userId = null;
      try {
        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const user = JSON.parse(stored);
          userId = user.id;
        }
      } catch (e) {}

      // Send the tracking data
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: lastPathRef.current,
          userId,
          device: isMobile ? 'Mobile' : 'Desktop',
          timeSpent,
        }),
        keepalive: true, // ensures the request fires even if page unloads
      }).catch(err => console.error('Error tracking page:', err));
    };

    // Every time pathname changes, log the PREVIOUS page duration
    if (pathname !== lastPathRef.current) {
      trackPageLeave();
      lastPathRef.current = pathname;
      startTimeRef.current = Date.now();
    }

    // Also send when the user closes the tab or navigates away
    const handleBeforeUnload = () => {
      trackPageLeave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  return null;
}
