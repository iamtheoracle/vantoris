import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus, Camera, Mic, Send, X, FileText, Image, Paperclip, File,
} from 'lucide-react';

export default function ChatInputBar({ onSend, onAttach, disabled }) {
  const [text, setText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageRef = useRef(null);
  const docRef = useRef(null);
  const cameraRef = useRef(null);
  const { toast } = useToast();

  function handleSend() {
    const content = text.trim();
    if (!content || disabled) return;
    onSend(content);
    setText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleFile(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setShowAttachments(false);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (onAttach) {
        onAttach({ type, name: file.name, url: file_url, size: file.size, mime: file.type });
      } else {
        // Fallback: send as a text message with link
        onSend(`[${type === 'image' ? '🖼️' : '📎'} ${file.name}](${file_url})`);
      }
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message || 'Please try again.', variant: 'destructive' });
    }
    setUploading(false);
    e.target.value = '';
  }

  function handleVoiceToggle() {
    setRecording(!recording);
    if (!recording) {
      // Simulate 3-second voice note
      setTimeout(() => {
        setRecording(false);
        if (onAttach) {
          onAttach({ type: 'voice', name: 'Voice Note', duration: '0:03' });
        } else {
          onSend('[🎤 Voice note (0:03)]');
        }
      }, 3000);
    }
  }

  return (
    <div className="relative">
      {/* Hidden file inputs */}
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'image')} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv" className="hidden" onChange={e => handleFile(e, 'document')} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e, 'image')} />

      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-2 right-2 mb-2 vantoris-glass-dropdown p-3"
          >
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'document', label: 'Document', icon: FileText, action: () => docRef.current?.click() },
                { id: 'camera', label: 'Camera', icon: Camera, action: () => cameraRef.current?.click() },
                { id: 'image', label: 'Image', icon: Image, action: () => imageRef.current?.click() },
                { id: 'pdf', label: 'PDF', icon: File, action: () => { docRef.current.accept = '.pdf'; docRef.current?.click(); } },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { opt.action(); setShowAttachments(false); }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center">
                      <Icon size={18} className="text-navy" />
                    </div>
                    <span className="text-[10px] text-gray font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-slate-200 safe-bottom">
        <button
          onClick={() => setShowAttachments(!showAttachments)}
          disabled={uploading}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
            showAttachments ? 'bg-navy text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'
          } disabled:opacity-40`}
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
          ) : showAttachments ? <X size={18} /> : <Plus size={20} />}
        </button>

        <button
          onClick={() => { setShowAttachments(false); cameraRef.current?.click(); }}
          disabled={uploading}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-gray hover:bg-slate-200 transition flex-shrink-0 disabled:opacity-40"
        >
          <Camera size={18} />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={uploading ? 'Uploading…' : 'Message…'}
            rows={1}
            disabled={disabled || uploading}
            className="w-full resize-none bg-slate-100 rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-gray/60 focus:outline-none focus:bg-white focus:ring-1 focus:ring-navy/10 transition-all max-h-24 disabled:opacity-60"
            style={{ minHeight: '40px' }}
          />
        </div>

        {text.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled || uploading}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-navy text-white hover:bg-navy/90 transition flex-shrink-0 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        ) : (
          <button
            onClick={handleVoiceToggle}
            disabled={uploading}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition flex-shrink-0 ${
              recording ? 'bg-crimson text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'
            } disabled:opacity-40`}
          >
            <Mic size={18} className={recording ? 'animate-pulse' : ''} />
          </button>
        )}
      </div>

      {/* Recording indicator */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute bottom-full left-0 right-0 mb-1 flex items-center justify-center gap-2 py-1.5"
          >
            <div className="flex items-center gap-2 bg-crimson/10 text-crimson text-xs font-semibold px-3 py-1.5 rounded-full border border-crimson/20">
              <span className="w-2 h-2 bg-crimson rounded-full animate-pulse" />
              Recording voice note… tap mic to cancel
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
