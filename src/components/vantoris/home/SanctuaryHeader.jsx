import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ShieldLogo from '@/components/vantoris/ShieldLogo';

export default function SanctuaryHeader({ firstName, greeting, unreadCount }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between mb-5"
    >
      {/* Left: Logo + greeting */}
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        >
          <ShieldLogo size={36} />
        </motion.div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-gray text-xs">{greeting},</p>
          </div>
          <h1 className="text-foreground font-bold text-lg leading-tight">{firstName}</h1>
        </div>
      </div>

      {/* Right: Advisor + Notifications */}
      <div className="flex items-center gap-1">
        {/* Advisor */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/advisor')}
          className="relative p-2.5 rounded-xl hover:bg-brass/10 transition-all"
          title="Member Advisor"
        >
          <Sparkles size={19} className="text-brass" strokeWidth={2} />
        </motion.button>

        {/* Notifications */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/messages')}
          className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-all"
          title="Notifications"
        >
          <Bell size={19} className="text-gray" strokeWidth={1.8} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
              className="absolute top-1.5 right-1.5 w-4 h-4 bg-crimson text-white text-[9px] rounded-full flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
