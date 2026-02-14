import { useState, useRef, useEffect, useMemo } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export interface CropModalProps {
  uri: string | null;
  onCropDone: (uri: string, base64: string) => void;
  onCancel: () => void;
}

const TARGET_W = 896;
const TARGET_H = 869;
const ASPECT = TARGET_W / TARGET_H;

function cropWithCanvas(
  src: string,
  area: { x: number; y: number; w: number; h: number },
): Promise<{ uri: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = TARGET_W;
      c.height = TARGET_H;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, area.x, area.y, area.w, area.h, 0, 0, TARGET_W, TARGET_H);
      const dataUrl = c.toDataURL('image/jpeg', 0.8);
      resolve({ uri: dataUrl, base64: dataUrl.split(',')[1] });
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function CropModal({ uri, onCropDone, onCancel }: CropModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  // Load natural image dimensions
  useEffect(() => {
    if (!uri) return;
    const img = new window.Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = uri;
  }, [uri]);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !uri) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [uri]);

  // Reset pan/zoom when image changes
  useEffect(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [uri]);

  // Crop box dimensions (centered, 85% of container, locked aspect)
  const cropBox = useMemo(() => {
    if (!containerSize.w || !containerSize.h) return { w: 0, h: 0, x: 0, y: 0 };
    const maxW = containerSize.w * 0.85;
    const maxH = containerSize.h * 0.85;
    let w: number, h: number;
    if (maxW / maxH > ASPECT) {
      h = maxH;
      w = h * ASPECT;
    } else {
      w = maxW;
      h = w / ASPECT;
    }
    return { w, h, x: (containerSize.w - w) / 2, y: (containerSize.h - h) / 2 };
  }, [containerSize]);

  // Scale so image covers the crop box at zoom=1, then apply zoom
  const baseScale = useMemo(() => {
    if (!naturalSize.w || !cropBox.w) return 1;
    return Math.max(cropBox.w / naturalSize.w, cropBox.h / naturalSize.h);
  }, [naturalSize, cropBox]);

  const displayScale = baseScale * zoom;

  const imgDisplay = useMemo(() => ({
    w: naturalSize.w * displayScale,
    h: naturalSize.h * displayScale,
  }), [naturalSize, displayScale]);

  const imgPos = useMemo(() => ({
    x: (containerSize.w - imgDisplay.w) / 2 + pan.x,
    y: (containerSize.h - imgDisplay.h) / 2 + pan.y,
  }), [containerSize, imgDisplay, pan]);

  // Attach pointer & wheel listeners directly to the DOM element
  // to bypass React Native web's gesture responder system
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !uri) return;

    function onPointerDown(e: PointerEvent) {
      dragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      el!.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging.current) return;
      setPan(p => ({
        x: p.x + e.clientX - lastPos.current.x,
        y: p.y + e.clientY - lastPos.current.y,
      }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
    function onPointerUp() {
      dragging.current = false;
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      setZoom(z => Math.max(1, Math.min(5, z - e.deltaY * 0.002)));
    }

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [uri]);

  async function handleConfirm() {
    if (!uri || !naturalSize.w) return;
    setProcessing(true);
    try {
      // Crop box position relative to image top-left in display pixels
      const relX = cropBox.x - imgPos.x;
      const relY = cropBox.y - imgPos.y;

      // Convert to original image pixels
      const origX = Math.max(0, relX / displayScale);
      const origY = Math.max(0, relY / displayScale);
      const origW = Math.min(cropBox.w / displayScale, naturalSize.w - origX);
      const origH = Math.min(cropBox.h / displayScale, naturalSize.h - origY);

      const { uri: croppedUri, base64 } = await cropWithCanvas(uri, {
        x: origX, y: origY, w: origW, h: origH,
      });
      onCropDone(croppedUri, base64);
    } finally {
      setProcessing(false);
    }
  }

  if (!uri) return null;

  const overlayColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.55)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      backgroundColor: isDark ? '#000' : '#111',
    }}>
      {/* Crop area */}
      <div
        ref={containerRef}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden', cursor: 'grab',
          userSelect: 'none', touchAction: 'none',
        }}
      >
        {/* The image */}
        {naturalSize.w > 0 && (
          <img
            src={uri}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: imgPos.x,
              top: imgPos.y,
              width: imgDisplay.w,
              height: imgDisplay.h,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Dark overlay with transparent crop hole (4 rects around the crop box) */}
        {cropBox.w > 0 && (
          <>
            {/* Top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: cropBox.y, backgroundColor: overlayColor, pointerEvents: 'none' }} />
            {/* Bottom */}
            <div style={{ position: 'absolute', top: cropBox.y + cropBox.h, left: 0, right: 0, bottom: 0, backgroundColor: overlayColor, pointerEvents: 'none' }} />
            {/* Left */}
            <div style={{ position: 'absolute', top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.h, backgroundColor: overlayColor, pointerEvents: 'none' }} />
            {/* Right */}
            <div style={{ position: 'absolute', top: cropBox.y, left: cropBox.x + cropBox.w, right: 0, height: cropBox.h, backgroundColor: overlayColor, pointerEvents: 'none' }} />
            {/* Crop border */}
            <div style={{
              position: 'absolute',
              left: cropBox.x, top: cropBox.y,
              width: cropBox.w, height: cropBox.h,
              border: '2px solid rgba(255,255,255,0.7)',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }} />
          </>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', gap: 16, padding: '16px 20px 60px',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: isDark ? '#111' : '#222',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}>
        <span style={{ color: '#999', fontSize: 13, marginRight: 8 }}>
          Drag to pan &middot; Scroll to zoom
        </span>
        <button
          onClick={onCancel}
          disabled={processing}
          style={{
            padding: '12px 24px', borderRadius: 12,
            border: `1px solid ${isDark ? '#555' : '#999'}`,
            background: 'transparent',
            color: isDark ? '#ccc' : '#ddd',
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
            minWidth: 120,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={processing}
          style={{
            padding: '12px 24px', borderRadius: 12,
            border: 'none',
            background: '#0a7ea4',
            color: '#fff',
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
            opacity: processing ? 0.6 : 1,
            minWidth: 160,
          }}
        >
          {processing ? 'Processing...' : 'Crop & Analyze'}
        </button>
      </div>
    </div>
  );
}
