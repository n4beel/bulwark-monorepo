import React from "react";

const Loading = () => {
  return (
    <div className="max-w-4xl mx-auto h-[100%]">
      <div className="flex items-center justify-center py-12 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading ...</span>
      </div>
    </div>
  );
};

export default Loading;
