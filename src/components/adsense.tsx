'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

type AdSenseProps = {
  pId?: string; // e.g. pub-1234567890123456
};

export default function AdSense({ pId }: AdSenseProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const publisherId = pId || process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;

  useEffect(() => {
    // Verifica se já existe consentimento no carregamento inicial
    const consent = localStorage.getItem('cookie-consent');
    if (consent === 'true') {
      setHasConsent(true);
    }

    // Ouve o evento disparado pelo cookie-banner.tsx
    const handleConsent = () => {
      setHasConsent(true);
    };

    window.addEventListener('cookieConsentAccepted', handleConsent);
    return () => window.removeEventListener('cookieConsentAccepted', handleConsent);
  }, []);

  if (!publisherId || !hasConsent) {
    return null; // Não carrega nada se não tiver ID ou não tiver consentimento (LGPD)
  }

  return (
    <>
      <Script
        id="adsbygoogle-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (window.adsbygoogle = window.adsbygoogle || []).push({
              // Garante proteção a menores de 13 anos em cumprimento à lei COPPA
              tagForChildDirectedTreatment: 1
            });
          `,
        }}
      />
      <Script
        id="adsbygoogle-script"
        strategy="afterInteractive"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        crossOrigin="anonymous"
      />
    </>
  );
}
