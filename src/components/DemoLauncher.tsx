'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Explicit demo launch (F.33 - F.35).
 * Nothing loads until the visitor presses Play. An embedded demo runs in a
 * sandboxed frame: scripts may run, but it gets no access to this site
 * (no same-origin), cannot navigate or replace this page, cannot open
 * pop-ups, and is given no camera, microphone, location or XR permissions.
 * If it breaks, only the frame is affected; the rest of the page keeps working,
 * and the visitor can close it or open the demo in its own tab.
 */
export default function DemoLauncher({ url, title, embed }: { url: string; title: string; embed: boolean }) {
  const [open, setOpen] = useState(false);
  const [slow, setSlow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [noWebGL, setNoWebGL] = useState(false);
  const playRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [open]);

  const newTab = (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="rounded-lg border border-line px-5 py-3 font-semibold">
      Open demo in a new tab <span className="sr-only">(opens in a new tab)</span>
    </a>
  );

  if (!embed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-dark">
        ▶ Play demo <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }

  if (!open) {
    return (
      <>
        <button
          ref={playRef}
          type="button"
          onClick={() => {
            // Capability check (F.34): most 3D/XR web demos need WebGL. Tell the visitor before anything loads.
            let ok = false;
            try {
              const c = document.createElement('canvas');
              ok = !!(c.getContext('webgl2') || c.getContext('webgl'));
            } catch {
              ok = false;
            }
            setNoWebGL(!ok);
            setLoaded(false);
            setSlow(false);
            setOpen(true);
          }}
          className="rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:bg-accent-dark"
        >
          ▶ Play demo here
        </button>
        {newTab}
      </>
    );
  }

  return (
    <div className="w-full space-y-2" role="region" aria-label={`Demo: ${title}`}>
      <div className="flex flex-wrap gap-2">
        <button
          ref={closeRef}
          type="button"
          onClick={() => {
            setOpen(false);
            setTimeout(() => playRef.current?.focus(), 0);
          }}
          className="rounded-lg border border-line bg-white px-4 py-2 font-semibold"
        >
          ✕ Close demo
        </button>
        {newTab}
      </div>
      {noWebGL && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm">
          This browser or device does not support WebGL, which most 3D and XR demos need, so the demo may not work here. The preview below shows what it does.
        </p>
      )}
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-line bg-stone-900">
        <iframe
          src={url}
          title={`Demo: ${title}`}
          sandbox="allow-scripts allow-pointer-lock"
          allow=""
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className="h-full w-full"
        />
      </div>
      {slow && !loaded && (
        <p role="status" className="text-sm">
          The demo is taking a long time to load. Try opening it in a new tab, or see the preview below.
        </p>
      )}
      <p className="text-xs text-muted">The demo runs in a protected frame without access to your camera, microphone or this site. For VR/AR headsets, open it in a new tab.</p>
    </div>
  );
}
