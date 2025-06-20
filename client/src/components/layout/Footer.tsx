import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} FlowLab. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 