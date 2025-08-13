import React from 'react';
import { addSampleComment, checkProfilesTable, testCommentFlow } from '../utils/addSampleComment';

const CommentTester: React.FC = () => {
  const handleAddSampleComment = async () => {
    console.log('Adding sample comment...');
    await addSampleComment();
  };

  const handleCheckProfiles = async () => {
    console.log('Checking profiles table...');
    await checkProfilesTable();
  };

  const handleTestCommentFlow = async () => {
    console.log('Testing complete comment flow...');
    await testCommentFlow();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-xs">
      <h3 className="text-sm font-semibold mb-2">Comment Tester</h3>
      <div className="space-y-2">
        <button
          onClick={handleCheckProfiles}
          className="block w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
        >
          Check Profiles
        </button>
        <button
          onClick={handleAddSampleComment}
          className="block w-full bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
        >
          Add Sample Comment
        </button>
        <button
          onClick={handleTestCommentFlow}
          className="block w-full bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
        >
          Test Full Flow
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">Check browser console for results</p>
    </div>
  );
};

export default CommentTester;