'use client';

import { useState } from 'react';

/**
 * Shows the project's fallback image. If the image itself is broken, it
 * quietly switches to a text note instead of a broken-image icon (R3.22).
 */
export default function FallbackImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <p className="rounded-lg bg-stone-100 p-4 text-sm text-muted">The preview image couldn&apos;t be loaded.</p>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="w-full max-w-2xl rounded-lg border border-line bg-stone-50" />
  );
}
