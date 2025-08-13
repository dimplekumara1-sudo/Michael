import React from 'react';
import { motion } from 'framer-motion';

const AboutHero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      </div>
      
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
        {/* Main Title - Micheal */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-4"
        >
          <h1 className="fresh-script-paintbrush text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent leading-none tracking-tight">
            Micheal
          </h1>
        </motion.div>
        
        {/* Subtitle - Photography */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-gray-300 tracking-widest">
            PHOTOGRAPHS
          </h2>
        </motion.div>
        
        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative"
        >
          <p className="text-lg sm:text-xl md:text-2xl text-gray-400 font-light italic">
            Capturing souls, not just smiles
          </p>
          
          {/* Decorative Line */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, delay: 1.2 }}
            className="h-px bg-gradient-to-r from-transparent via-white to-transparent mt-8 max-w-md mx-auto"
          />
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute left-1/2 transform -translate-x-1/2"
          style={{ bottom: '-62px' }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Floating Elements */}
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          scale: { duration: 4, repeat: Infinity }
        }}
        className="absolute top-20 right-20 w-32 h-32 border border-white/20 rounded-full"
      />
      
      <motion.div
        animate={{ 
          rotate: -360,
          scale: [1, 0.9, 1]
        }}
        transition={{ 
          rotate: { duration: 25, repeat: Infinity, ease: "linear" },
          scale: { duration: 6, repeat: Infinity }
        }}
        className="absolute bottom-32 left-16 w-24 h-24 border border-white/10 rounded-full"
      />
    </section>
  );
};

export default AboutHero;