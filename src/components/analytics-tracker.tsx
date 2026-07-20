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
        let anonId = localStorage.getItem('senra_anon_id');
        if (!anonId) {
          anonId = 'anon_' + Math.random().toString(36).substring(2) + Date.now();
          localStorage.setItem('senra_anon_id', anonId);
        }
        userId = anonId;

        const stored = localStorage.getItem('currentUser');
        if (stored) {
          const user = JSON.parse(stored);
          userId = user.id || anonId;
        }
      } catch (e) {}

      let source = 'Direto/Orgânico';
      try {
        let savedSource = sessionStorage.getItem('senra_traffic_source');
        if (savedSource) {
          source = savedSource;
        } else {
          const params = new URLSearchParams(window.location.search);
          const utmSource = params.get('utm_source');
          
          if (utmSource) {
            source = `utm_source=${utmSource}`;
          } else if (document.referrer && !document.referrer.includes(window.location.hostname)) {
            try {
              const url = new URL(document.referrer);
              source = url.hostname;
            } catch (e) {
              source = document.referrer;
            }
          }
          sessionStorage.setItem('senra_traffic_source', source);
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
          source,
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
