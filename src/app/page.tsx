"use client";

import { useRouter } from 'next/navigation';
import { v7 as uuidv7 } from 'uuid';

export default function Home() {
  const router = useRouter();

  const createRoom = () => {
    const roomId = uuidv7();
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="flex items-center justify-center h-screen bg-gray-100 font-sans">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to March Time Calculator</h1>
        <p className="text-lg text-gray-600 mb-8">
          Create a room to share and synchronize march times with your team.
        </p>
        <button
          onClick={createRoom}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
        >
          Create a New Room
        </button>
      </div>
    </main>
  );
}
