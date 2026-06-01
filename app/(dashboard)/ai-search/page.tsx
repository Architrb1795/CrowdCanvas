import React from 'react';
import SearchClient from './SearchClient';

export const metadata = {
  title: 'AI Search - CrowdCanvas',
};

export default function AISearchPage() {
  return (
    <div className="w-full max-w-7xl mx-auto pt-24 pb-20 px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
          AI Semantic Search
        </h1>
        <p className="text-slate-400">
          Describe what you are looking for. Our intelligence engine will find the closest visual matches using semantic understanding.
        </p>
      </div>

      <SearchClient />
    </div>
  );
}
