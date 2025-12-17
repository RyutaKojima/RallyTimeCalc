"use client";

import { useRouter } from 'next/navigation';

// A simple utility to generate a random room ID.
// For a production application, a more robust solution like UUID is recommended.
const generateRoomId = (length: number = 8): string => {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export default function Home() {
  const router = useRouter();

  const createRoom = () => {
    const roomId = generateRoomId();
    router.push(`/room/${roomId}`);
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h1 style={{ textAlign: 'center' }}>Welcome to March Time Calculator</h1>
        <p style={{ textAlign: 'center', margin: '20px 0' }}>
          Create a room to share and synchronize march times with your team.
        </p>
        <div style={{ textAlign: 'center' }}>
          <button onClick={createRoom} style={{ padding: '12px 24px', fontSize: '18px', cursor: 'pointer' }}>
            Create a New Room
          </button>
        </div>
      </div>
    </main>
  );
}
