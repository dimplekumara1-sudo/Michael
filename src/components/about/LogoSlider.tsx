import React from 'react';
import { motion } from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

// Mock logo data - replace with actual award logos
const awards = [
  { id: 1, name: 'Photography Excellence Award', year: '2023' },
  { id: 2, name: 'Best Portrait Photographer', year: '2023' },
  { id: 3, name: 'Wedding Photography Award', year: '2022' },
  { id: 4, name: 'Creative Vision Award', year: '2022' },
  { id: 5, name: 'Professional Photography Guild', year: '2021' },
  { id: 6, name: 'Nature Photo Contest', year: '2021' },
  { id: 7, name: 'Indian Photography Awards', year: '2020' },
  { id: 8, name: 'Master Photographer Certification', year: '2020' },
];

const LogoSlider: React.FC = () => {
  const settings = {
    dots: false,
    infinite: true,
    speed: 3000,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: 'linear',
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
        }
      }
    ]
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
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
            Recognized By
          </h2>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '100px' }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className="h-1 bg-gradient-to-r from-white to-transparent mx-auto"
          />
        </motion.div>

        {/* Logo Slider */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="relative"
        >
          <Slider {...settings}>
            {awards.map((award) => (
              <div key={award.id} className="px-4">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="group relative"
                >
                  {/* Award Logo */}
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-white/10">
                    <div className="w-full h-full rounded-lg flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-300">
                      <img 
                        src="https://images.squarespace-cdn.com/content/v1/5a7c173bedaed821286d3870/1583450985540-XGJYA62TLO7H8RPGRRWS/WEDAWARD%2BWhite%2BLOGO.jpg"
                        alt={award.name}
                        className="w-full h-full object-contain filter brightness-75 group-hover:brightness-100 transition-all duration-300 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Award Info Tooltip */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="bg-black/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center border border-white/20">
                      <div className="text-white text-sm font-medium">{award.name}</div>
                      <div className="text-gray-400 text-xs">{award.year}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </Slider>
          
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-gray-900 to-transparent pointer-events-none z-10"></div>
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-black to-transparent pointer-events-none z-10"></div>
        </motion.div>
        
        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 text-lg">
            Trusted by leading organizations and photography institutions worldwide
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default LogoSlider;