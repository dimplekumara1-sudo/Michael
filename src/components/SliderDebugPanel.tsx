import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MediaPost } from '../types';
import { MediaPostsService } from '../services/mediaPostsService';

const SliderDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  const runDiagnostics = async () => {
    const info: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Check if media_posts table exists
      console.log('🧪 Test 1: Checking media_posts table...');
      const { data: tableTest, error: tableError } = await supabase
        .from('media_posts')
        .select('count(*)')
        .limit(1);
      
      info.tests.tableExists = {
        success: !tableError,
        error: tableError?.message,
        data: tableTest
      };

      // Test 2: Check all media_posts
      console.log('🧪 Test 2: Fetching all media posts...');
      const { data: allPosts, error: allError } = await supabase
        .from('media_posts')
        .select('*');
      
      info.tests.allPosts = {
        success: !allError,
        error: allError?.message,
        count: allPosts?.length || 0,
        data: allPosts
      };

      // Test 3: Check slider posts specifically
      console.log('🧪 Test 3: Fetching slider posts...');
      const { data: sliderPosts, error: sliderError } = await supabase
        .from('media_posts')
        .select('*')
        .eq('media_type', 'slider');
      
      info.tests.sliderPosts = {
        success: !sliderError,
        error: sliderError?.message,
        count: sliderPosts?.length || 0,
        data: sliderPosts
      };

      // Test 4: Check active slider posts
      console.log('🧪 Test 4: Fetching active slider posts...');
      const { data: activePosts, error: activeError } = await supabase
        .from('media_posts')
        .select('*')
        .eq('media_type', 'slider')
        .eq('is_active', true);
      
      info.tests.activeSliderPosts = {
        success: !activeError,
        error: activeError?.message,
        count: activePosts?.length || 0,
        data: activePosts
      };

      // Test 5: Test MediaPostsService
      console.log('🧪 Test 5: Testing MediaPostsService...');
      try {
        const servicePosts = await MediaPostsService.getActiveSliderPosts();
        info.tests.serviceTest = {
          success: true,
          count: servicePosts.length,
          data: servicePosts
        };
      } catch (serviceError: any) {
        info.tests.serviceTest = {
          success: false,
          error: serviceError.message
        };
      }

      // Test 6: Check database connection
      console.log('🧪 Test 6: Testing database connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count(*)')
        .limit(1);
      
      info.tests.dbConnection = {
        success: !connectionError,
        error: connectionError?.message
      };

    } catch (error: any) {
      info.error = error.message;
    }

    setDebugInfo(info);
    console.log('🔍 Debug Info:', info);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-red-700 transition-colors"
        >
          🔍 Debug Slider
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Slider Debug Panel</h2>
          <div className="flex space-x-2">
            <button
              onClick={runDiagnostics}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Last updated: {debugInfo.timestamp}
          </div>

          {debugInfo.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {debugInfo.error}
            </div>
          )}

          {debugInfo.tests && Object.entries(debugInfo.tests).map(([testName, result]: [string, any]) => (
            <div key={testName} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <h3 className="font-semibold capitalize">{testName.replace(/([A-Z])/g, ' $1')}</h3>
              </div>
              
              {result.error && (
                <div className="text-red-600 text-sm mb-2">
                  Error: {result.error}
                </div>
              )}
              
              {result.count !== undefined && (
                <div className="text-sm text-gray-600 mb-2">
                  Count: {result.count}
                </div>
              )}
              
              {result.data && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    View Data ({Array.isArray(result.data) ? result.data.length : 'object'})
                  </summary>
                  <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SliderDebugPanel;