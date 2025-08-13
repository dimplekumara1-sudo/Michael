import React, { useState, useCallback } from 'react';

const InputTestComponent: React.FC = () => {
  const [formData, setFormData] = useState({
    eventDate: '',
    location: '',
    mobile: '',
    notes: ''
  });

  // Optimized handlers using useCallback
  const handleEventDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, eventDate: e.target.value }));
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, location: e.target.value }));
  }, []);

  const handleMobileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, mobile: e.target.value }));
  }, []);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }));
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Input Field Test</h2>
      <p className="text-sm text-gray-600 mb-4">
        Test typing multiple characters in each field. If the fix works, you should be able to type normally.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
          <input
            type="date"
            value={formData.eventDate}
            onChange={handleEventDateChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Value: {formData.eventDate}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={handleLocationChange}
            placeholder="Type multiple characters here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Value: {formData.location}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <input
            type="tel"
            value={formData.mobile}
            onChange={handleMobileChange}
            placeholder="Type your mobile number..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Value: {formData.mobile}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={handleNotesChange}
            placeholder="Type multiple lines of notes here..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Value: {formData.notes}</p>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Current Form Data:</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default InputTestComponent;