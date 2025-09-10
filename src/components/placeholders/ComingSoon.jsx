import React from 'react';

export default function ComingSoon({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full p-10 rounded-2xl" style={{
      background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
      boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
    }}>
      <Icon className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
      <p className="text-gray-500 mt-2 max-w-sm">{description}</p>
      <p className="text-sm text-blue-500 font-medium mt-6">Coming Soon</p>
    </div>
  );
}