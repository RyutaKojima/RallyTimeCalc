"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { v7 as uuidv7 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [room, setRoom] = useState('');

  const createRoom = () => {
    const roomId = uuidv7();
    router.push(`/room/${roomId}`);
  };

  const joinRoom = () => {
    if (!room) return;

    try {
      // Attempt to parse as a URL to extract the last path segment
      const url = new URL(room);
      const pathSegments = url.pathname.split('/');
      const roomId = pathSegments.pop() || pathSegments.pop(); // handle trailing slash
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    } catch {
      // If it's not a valid URL, treat it as a room ID directly
      router.push(`/room/${room.trim()}`);
    }
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

        <div className="mt-8">
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            placeholder="Enter Room Code or URL"
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={joinRoom}
            className="ml-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
          >
            Join in the room
          </button>
        </div>
      </div>
    </main>
  );
}
