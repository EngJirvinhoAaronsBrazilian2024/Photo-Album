import React from 'react';
import { useAuth } from '../AuthContext';

export function LoginScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/group-photo.jpg" alt="Group Photo" className="w-full rounded-lg mb-6 shadow-md" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Photo Album</h1>
          <p className="text-gray-600">Share your memories with loved ones</p>
        </div>
        <button
          onClick={signInWithGoogle}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.449-.356 4.797-1.207 7.052H9.549v-5.355h3.397a3.72 3.72 0 0 0-1.315-2.323" />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}