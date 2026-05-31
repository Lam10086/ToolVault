import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Upload, Move, ZoomIn, ZoomOut } from 'lucide-react';

// A lightweight image cropper/panner that outputs object-position and scale
export default function ImageCropper({ imageData, cropSettings, onChange, onClear }) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  
  const [scale, setScale] = useState(cropSettings?.scale || 1);
  const [pos, setPos] = useState(cropSettings?.pos || { x: 50, y: 50 }); // percentage 0-100
  
  const [isDragging, setIsDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Update parent when settings change
  useEffect(() => {
    if (imageData && onChange) {
      onChange({ scale, pos });
    }
  }, [scale, pos, imageData]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !containerRef.current || !imgRef.current) return;
    
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    const container = containerRef.current.getBoundingClientRect();
    
    // convert dx/dy to percentage of image dimension (scaled)
    // we change object-position, so moving mouse right means object-position moves left (to reveal right part)
    // wait, object-position: 0% 0% means image top-left aligns with container top-left.
    // 100% 100% means bottom-right aligns.
    // Movement dx shifts the image by dx pixels. 
    // Delta % = (dx / (image_width_rendered - container_width)) * 100
    // If image fits exactly, object-position doesn't matter much.
    // We'll approximate: 1px = ~0.5% shift
    
    setPos(p => {
      let nx = p.x - (dx * 0.2 / scale);
      let ny = p.y - (dy * 0.2 / scale);
      nx = Math.max(0, Math.min(100, nx));
      ny = Math.max(0, Math.min(100, ny));
      return { x: nx, y: ny };
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setScale(s => {
      let ns = s + (e.deltaY < 0 ? 0.1 : -0.1);
      return Math.max(0.5, Math.min(3, ns));
    });
  };

  if (!imageData) return null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 'var(--r-md)', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div 
        ref={containerRef}
        style={{ width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      >
        <img 
          ref={imgRef}
          src={imageData} 
          alt="crop preview" 
          draggable={false}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: `${pos.x}% ${pos.y}%`,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.1s'
          }}
        />
      </div>
      
      {/* Controls Overlay */}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 99, boxShadow: 'var(--shadow-md)', alignItems: 'center' }}>
        <button className="btn-icon" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}><ZoomOut size={14}/></button>
        <span style={{ fontSize: 11, color: 'var(--text-2)', width: 36, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button className="btn-icon" onClick={() => setScale(s => Math.min(3, s + 0.1))}><ZoomIn size={14}/></button>
        <div style={{ width: 1, height: 12, background: 'var(--border)', margin: '0 4px' }}/>
        <button className="btn-icon danger" onClick={onClear} title="移除图片">移除</button>
      </div>

      <div style={{ position: 'absolute', top: 10, left: 10, background: 'oklch(0% 0 0 / 0.5)', color: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 11, pointerEvents: 'none', backdropFilter: 'blur(4px)' }}>
        <Move size={10} style={{ display: 'inline', marginRight: 4 }}/>
        拖拽平移 / 滚轮缩放
      </div>
    </div>
  );
}
