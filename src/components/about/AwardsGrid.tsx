import React from 'react';
import { motion } from 'framer-motion';

interface Award {
  id: number;
  title: string;
  issuer: string;
  year: string;
  category: string;
  description: string;
}

const awards: Award[] = [
  {
    id: 1,
    title: "Photography Excellence Award",
    issuer: "International Photography Association",
    year: "2023",
    category: "Portrait",
    description: "Outstanding achievement in portrait photography"
  },
  {
    id: 2,
    title: "Best Wedding Photographer",
    issuer: "European Wedding Guild",
    year: "2023",
    category: "Wedding",
    description: "Excellence in wedding photography and storytelling"
  },
  {
    id: 3,
    title: "Creative Vision Award",
    issuer: "German Photography Society",
    year: "2022",
    category: "Artistic",
    description: "Innovation in creative photography techniques"
  },
  {
    id: 4,
    title: "Master Photographer Certification",
    issuer: "Professional Photographers Guild",
    year: "2022",
    category: "Professional",
    description: "Highest level of professional photography certification"
  },
  {
    id: 5,
    title: "Lifestyle Photography Award",
    issuer: "Contemporary Photo Awards",
    year: "2021",
    category: "Lifestyle",
    description: "Excellence in capturing authentic lifestyle moments"
  },
  {
    id: 6,
    title: "Technical Excellence Award",
    issuer: "Digital Photography Institute",
    year: "2021",
    category: "Technical",
    description: "Outstanding technical skill and innovation"
  }
];

const AwardsGrid: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Awards & Certifications
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '100px' }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className="h-1 bg-gradient-to-r from-white to-transparent mx-auto mb-6"
          />
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Recognition for excellence in photography and commitment to the craft
          </p>
        </motion.div>

        {/* Awards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {awards.map((award) => (
            <motion.div
              key={award.id}
              variants={itemVariants}
              whileHover={{ y: -10, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="group relative"
            >
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 h-full">
                {/* Award Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V7C19 10.31 16.31 13 13 13H11C7.69 13 5 10.31 5 7V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V7C7 9.21 8.79 11 11 11H13C15.21 11 17 9.21 17 7V6H7ZM12 15C12.55 15 13 15.45 13 16V19H16C16.55 19 17 19.45 17 20S16.55 21 16 21H8C7.45 21 7 20.55 7 20S7.45 19 8 19H11V16C11 15.45 11.45 15 12 15Z"/>
                    </svg>
                  </div>
                  
                  {/* Category Badge */}
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium text-white/80 border border-white/20">
                    {award.category}
                  </span>
                </div>

                {/* Award Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">
                    {award.title}
                  </h3>
                  
                  <div className="space-y-2">
                    <p className="text-gray-300 font-medium">
                      {award.issuer}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {award.description}
                    </p>
                  </div>
                  
                  {/* Year */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-2xl font-bold text-yellow-400">
                      {award.year}
                    </span>
                    <div className="w-8 h-8 bg-gradient-to-br from-white/10 to-white/5 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 text-lg mb-6">
            Committed to excellence and continuous growth in the art of photography
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-full text-white font-medium hover:border-white/40 transition-all duration-300"
          >
            View Full Portfolio
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default AwardsGrid;