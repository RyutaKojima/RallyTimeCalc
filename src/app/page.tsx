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
