import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import AboutHero from '../components/about/AboutHero';
import AboutSection from '../components/about/AboutSection';
import LogoSlider from '../components/about/LogoSlider';
import AwardsGrid from '../components/about/AwardsGrid';
import StarFieldCSS from '../components/about/StarFieldCSS';
import CallToAction from '../components/about/CallToAction';
import ErrorBoundary from '../components/about/ErrorBoundary';

// Lazy load the 3D component
const StarField3D = React.lazy(() => import('../components/about/StarField3D'));

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* CSS Star Field Background */}
      <StarFieldCSS />
      
      {/* Hero Section */}
      <AboutHero />
      
      {/* About Section */}
      <AboutSection />
      
      {/* Logo Slider */}
      <LogoSlider />
      
      {/* Awards Grid */}
      <AwardsGrid />
      
      {/* Call to Action */}
      <CallToAction />
    </div>
  );
};

export default AboutPage;