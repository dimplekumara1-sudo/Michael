import React from 'react';
import { motion } from 'framer-motion';

const StarFieldCSS: React.FC = () => {
  // Generate random stars
  const stars = Array.from({ length: 200 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    animationDelay: Math.random() * 3,
    animationDuration: Math.random() * 3 + 2,
  }));

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05),transparent_50%)]"></div>
      </div>
      
      {/* CSS Stars */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full opacity-60"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: star.animationDuration,
            delay: star.animationDelay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 right-20 w-32 h-32 border border-white/10 rounded-full"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 4, repeat: Infinity },
        }}
      />
      
      <motion.div
        className="absolute bottom-32 left-16 w-24 h-24 border border-white/5 rounded-full"
        animate={{
          rotate: -360,
          scale: [1, 0.9, 1],
        }}
        transition={{
          rotate: { duration: 25, repeat: Infinity, ease: "linear" },
          scale: { duration: 6, repeat: Infinity },
        }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/4 w-16 h-16 border border-white/5"
        style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
        animate={{
          rotate: 360,
          y: [-10, 10, -10],
        }}
        transition={{
          rotate: { duration: 15, repeat: Infinity, ease: "linear" },
          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 right-1/3 w-20 h-20 border border-white/8"
        style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
        animate={{
          rotate: -360,
          x: [-5, 5, -5],
        }}
        transition={{
          rotate: { duration: 18, repeat: Infinity, ease: "linear" },
          x: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        }}
      />
    </div>
  );
};

export default StarFieldCSS;