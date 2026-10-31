'use client';

import React from 'react';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">500 - Server Error</h1>
      <p className="text-slate-600 mb-6">Something went wrong. Please try again.</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Try again
      </button>
    </div>
  );
}
