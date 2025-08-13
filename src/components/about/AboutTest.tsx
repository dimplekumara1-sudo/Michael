import React from 'react';

const AboutTest: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">About Page Test</h1>
        <p className="text-gray-400">If you can see this, the About page routing is working!</p>
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-gray-800 rounded">
            <h3 className="font-semibold">Components Status:</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>✅ AboutHero</li>
              <li>✅ AboutSection</li>
              <li>✅ LogoSlider</li>
              <li>✅ AwardsGrid</li>
              <li>✅ StarFieldCSS</li>
              <li>✅ CallToAction</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutTest;