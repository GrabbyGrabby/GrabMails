import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, House, Send, Star, Settings, SquarePen } from 'lucide-react';

export function CircularRadialNavbar({
  onSelect,
  activeItem = 'email',
  className = '',
}: {
  onSelect?: (key: string) => void;
  activeItem?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'email', label: 'Inbox', icon: House },
    { id: 'send', label: 'Sent', icon: Send },
    { id: 'compose', label: 'Compose', icon: SquarePen },
    { id: 'star', label: 'Starred', icon: Star },
    { id: 'setting', label: 'Settings', icon: Settings },
  ];

  const radius = 88;
  const count = navItems.length;
  // Spread across semi-circle arc above FAB: 180 to 360 degrees
  const angleStep = 180 / (count - 1);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Radiating Menu Items */}
        <AnimatePresence>
          {isOpen &&
            navItems.map((item, i) => {
              const Icon = item.icon;
              const angle = 180 + i * angleStep;
              const x = radius * Math.cos((angle * Math.PI) / 180);
              const y = radius * Math.sin((angle * Math.PI) / 180);

              const isActive = activeItem === item.id;

              return (
                <motion.button
                  key={item.id}
                  aria-label={item.label}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  animate={{ x, y, scale: 1, opacity: 1 }}
                  exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 24,
                    delay: i * 0.03,
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    if (onSelect) onSelect(item.id);
                    setIsOpen(false);
                  }}
                  className={`absolute w-11 h-11 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex items-center justify-center z-30 cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#8EB69B] text-[#051F20] border-2 border-[#8EB69B]'
                      : 'bg-[#190019] text-[#FBE4DB] dark:bg-[#051F20] dark:text-white border border-white/15 hover:bg-[#8EB69B] hover:text-[#051F20]'
                  }`}
                  title={item.label}
                >
                  <Icon size={18} strokeWidth={2} />
                </motion.button>
              );
            })}
        </AnimatePresence>

        {/* The Main FAB Button */}
        <motion.button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative z-40 w-12 h-12 rounded-full bg-[#000000] dark:bg-white text-white dark:text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)] flex items-center justify-center border-2 border-[#8EB69B] cursor-pointer"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          >
            <Plus size={24} strokeWidth={2.4} />
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
}

export default CircularRadialNavbar;
