import React, { useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { useSliderMedia } from '../hooks/useSliderMedia';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface PortfolioItem {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  category: string;
}

const PortfolioCarousel: React.FC = () => {
  const { getSliderPostsWithFallback, migratePortfolioItems, isLoading } = useSliderMedia();
  const portfolioItems = getSliderPostsWithFallback();

  // Auto-migrate portfolio items on first load if needed
  useEffect(() => {
    const initializeSliderContent = async () => {
      try {
        await migratePortfolioItems();
      } catch (error) {
        console.error('Failed to initialize slider content:', error);
      }
    };

    initializeSliderContent();
  }, [migratePortfolioItems]);

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              See My Work
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Loading portfolio content...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            See My Work
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore our diverse portfolio showcasing moments of beauty, emotion, and artistry
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            navigation={true}
            pagination={{
              clickable: true,
            }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: {
                slidesPerView: 1,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 40,
              },
            }}
            loop={true}
            className="portfolio-swiper"
          >
            {portfolioItems.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  {/* Image Container */}
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Hover Content */}
                    <div className="absolute bottom-4 left-4 right-4 text-white transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <p className="text-sm font-medium uppercase tracking-wider">
                        View Portfolio
                      </p>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">
                      {item.subtitle}
                    </p>
                    
                    {/* Decorative Line */}
                    <div className="mt-4 mx-auto w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  </div>
                  
                  {/* Click Effect */}
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>


        </div>
      </div>
      
      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .portfolio-swiper .swiper-pagination {
            bottom: -50px !important;
          }
          
          .portfolio-swiper .swiper-pagination-bullet {
            width: 12px !important;
            height: 12px !important;
            margin: 0 6px !important;
            border-radius: 50% !important;
            background: rgb(156, 163, 175) !important;
            opacity: 0.5 !important;
            transition: all 0.3s ease !important;
          }
          
          .portfolio-swiper .swiper-pagination-bullet:hover {
            transform: scale(1.2) !important;
            opacity: 0.8 !important;
          }
          
          .portfolio-swiper .swiper-pagination-bullet-active {
            background: rgb(37, 99, 235) !important;
            opacity: 1 !important;
            transform: scale(1.3) !important;
          }
          
          .portfolio-swiper .swiper-button-next,
          .portfolio-swiper .swiper-button-prev {
            width: 50px !important;
            height: 50px !important;
            background: rgba(255, 255, 255, 0.9) !important;
            border-radius: 50% !important;
            color: rgb(55, 65, 81) !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
            transition: all 0.3s ease !important;
          }
          
          .portfolio-swiper .swiper-button-next:hover,
          .portfolio-swiper .swiper-button-prev:hover {
            background: white !important;
            color: rgb(37, 99, 235) !important;
            transform: scale(1.1) !important;
          }
          
          .portfolio-swiper .swiper-button-next::after,
          .portfolio-swiper .swiper-button-prev::after {
            font-size: 20px !important;
            font-weight: bold !important;
          }
          
          @media (max-width: 768px) {
            .portfolio-swiper .swiper-pagination {
              bottom: -40px !important;
            }
            
            .portfolio-swiper .swiper-button-next,
            .portfolio-swiper .swiper-button-prev {
              width: 40px !important;
              height: 40px !important;
            }
            
            .portfolio-swiper .swiper-button-next::after,
            .portfolio-swiper .swiper-button-prev::after {
              font-size: 16px !important;
            }
          }
        `
      }} />
    </section>
  );
};

export default PortfolioCarousel;