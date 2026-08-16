import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, ArrowLeftRight, Send, QrCode,
  FileCheck, Sparkles,
} from 'lucide-react';

const ACTIONS = [
  { id: 'transfer',  label: 'Transfer',  icon: ArrowLeftRight, color: '#B08D57', angle: -90 },
  { id: 'send',      label: 'Send',      icon: Send,           color: '#3E8C60', angle: -45 },
  { id: 'qr',        label: 'QR Pay',    icon: QrCode,         color: '#1E56A0', angle:   0 },
  { id: 'deposit',   label: 'Deposit',   icon: FileCheck,      color: '#7C4F9E', angle:  45 },
  { id: 'advisor',   label: 'Advisor',   icon: Sparkles,       color: '#B08D57', angle:  90 },
];

const RADIUS = 84; // px from center to action button

export default function FloatingActionButton() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: null, y: null }); // null = default position
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const btnRef = useRef(null);
  const navigate = useNavigate();

  // Load persisted position
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('vantoris_fab_pos') || 'null');
      if (saved) setPos(saved);
    } catch {}
  }, []);

  const savePos = useCallback((p) => {
    localStorage.setItem('vantoris_fab_pos', JSON.stringify(p));
  }, []);

  // Pointer drag
  function onPointerDown(e) {
    // Don't drag on the inner action buttons
    if (e.target.closest('[data-fab-action]')) return;
    dragStart.current = {
      px: e.clientX,
      py: e.clientY,
      ox: pos.x ?? (window.innerWidth - 72),
      oy: pos.y ?? (window.innerHeight - 160),
    };
    setDragging(false);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.px;
    const dy = e.clientY - dragStart.current.py;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      setDragging(true);
      setOpen(false);
    }
    const newX = Math.max(20, Math.min(window.innerWidth - 72, dragStart.current.ox + dx));
    const newY = Math.max(80, Math.min(window.innerHeight - 160, dragStart.current.oy + dy));
    setPos({ x: newX, y: newY });
  }

  function onPointerUp() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    if (pos.x !== null) savePos(pos);
    dragStart.current = null;
    setTimeout(() => setDragging(false), 50);
  }

  function handleToggle() {
    if (dragging) return;
    setOpen(o => !o);
  }

  function handleAction(id) {
    setOpen(false);
    if (id === 'transfer') navigate('/move-money');
    else if (id === 'send') navigate('/move-money?tab=send');
    else if (id === 'qr') navigate('/move-money?tab=qr');
    else if (id === 'deposit') navigate('/move-money?tab=deposit-check');
    else if (id === 'advisor') navigate('/advisor');
  }

  // Position
  const right = pos.x === null ? 20 : undefined;
  const bottom = pos.y === null ? 96 : undefined;
  const left = pos.x !== null ? pos.x : undefined;
  const top = pos.y !== null ? pos.y : undefined;

  return (
    <>
      {/* Backdrop when open */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-[1px]"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB */}
      <div
        ref={btnRef}
        style={{ position: 'fixed', right, bottom, left, top, zIndex: 56, touchAction: 'none', userSelect: 'none' }}
        onPointerDown={onPointerDown}
      >
        {/* Radial action buttons */}
        <AnimatePresence>
          {open && ACTIONS.map((action, i) => {
            const Icon = action.icon;
            // Fan out to the left (angles from -90 to +90 degrees, semicircle on left)
            const angleDeg = -90 + (i * 45);
            const rad = (angleDeg * Math.PI) / 180;
            const cx = -Math.sin(rad) * RADIUS; // negative sin to go left
            const cy = -Math.cos(rad) * RADIUS; // negative cos to go up
            return (
              <motion.button
                key={action.id}
                data-fab-action="true"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, x: cx, y: cy, scale: 1 }}
                exit={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26, delay: i * 0.04 }}
                onClick={() => handleAction(action.id)}
                className="absolute w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-xl"
                style={{
                  background: action.color,
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%)`,
                }}
              >
                <Icon size={18} className="text-white" strokeWidth={2} />
                <span className="text-white text-[8px] font-bold mt-0.5 leading-none">{action.label}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          onClick={handleToggle}
          whileTap={{ scale: 0.92 }}
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
          style={{
            background: open
              ? 'linear-gradient(135deg, #2a1f3d 0%, #1a2332 100%)'
              : 'linear-gradient(135deg, #B08D57 0%, #8a6a3a 100%)',
          }}
        >
          <motion.div
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {open ? <X size={22} className="text-white" /> : <Plus size={22} className="text-white" />}
          </motion.div>
          {/* Pulse ring when closed */}
          {!open && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ border: '2px solid rgba(176, 141, 87, 0.5)' }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.button>
      </div>
    </>
  );
}
