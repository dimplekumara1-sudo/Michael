import React from 'react';
import { motion } from 'framer-motion';

const AboutSection: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Profile Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl">
              {/* Profile Image */}
              <div className="aspect-[4/5] relative">
                <img 
                  src="https://vlvecmxfsbvwrcnminmz.supabase.co/storage/v1/object/public/media/504375781_18394737598137255_3933696666479845332_n.jpg"
                  alt="Micheal - Professional Photographer"
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay for better text readability if needed */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              
              {/* Decorative Border */}
              <div className="absolute inset-0 border-2 border-white/10 rounded-2xl pointer-events-none"></div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-4 w-8 h-8 border border-white/30 rounded-full"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-4 -left-4 w-6 h-6 border border-white/20 rounded-full"
              />
            </div>
          </motion.div>
          
          {/* About Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                About Micheal
              </motion.h2>
              
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: '100px' }}
                transition={{ duration: 1, delay: 0.5 }}
                viewport={{ once: true }}
                className="h-1 bg-gradient-to-r from-white to-transparent mb-8"
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-6 text-gray-300 leading-relaxed"
            >
              <p className="text-lg">
                With over a decade of experience in capturing life's most precious moments, 
                Micheal has established himself as one of the most sought-after photographers 
                in the industry. His unique approach combines technical excellence with an 
                artistic vision that transforms ordinary moments into extraordinary memories.
              </p>
              
              <p className="text-lg">
                Specializing in portrait, wedding, and lifestyle photography, Micheal believes 
                that every photograph should tell a story. His work is characterized by natural 
                lighting, authentic emotions, and a timeless aesthetic that resonates with 
                clients worldwide.
              </p>
              
              <p className="text-lg">
                Based in India, Micheal has worked with clients across Europe and beyond, 
                creating stunning visual narratives that capture not just images, but the 
                essence of human connection and emotion.
              </p>
            </motion.div>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-white/10"
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">10+</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">1000+</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">15+</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Awards Won</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;