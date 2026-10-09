'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

import { CONSENT_STORAGE_KEY } from './CookieConsent';

export type AnalyticsIds = {
  ymCounterId: string;
  ga4Id: string;
  metaPixelId: string;
};

/**
 * Loads Yandex.Metrika / GA4 / Meta Pixel only after the visitor consented
 * (§13, §14). Yandex.Metrika is initialised with webvisor disabled, as required
 * until consent is given.
 */
export function Analytics({ ids }: { ids: AnalyticsIds }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setAllowed(window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted');
      } catch {
        setAllowed(false);
      }
    };
    read();
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setAllowed(detail === 'accepted');
    };
    window.addEventListener('bp:consent', handler);
    return () => window.removeEventListener('bp:consent', handler);
  }, []);

  if (!allowed) return null;

  return (
    <>
      {ids.ymCounterId ? (
        <Script id="ym-init" strategy="lazyOnload">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
ym(${ids.ymCounterId},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});`}
        </Script>
      ) : null}

      {ids.ga4Id ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ids.ga4Id}`} strategy="lazyOnload" />
          <Script id="ga4-init" strategy="lazyOnload">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${ids.ga4Id}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {ids.metaPixelId ? (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${ids.metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}
