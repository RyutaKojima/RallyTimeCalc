"use client";

import { useState } from 'react';

interface Player {
  id: number;
  name: string;
  time: number;
}

interface Result {
  name: string;
  delay: number;
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTime, setNewPlayerTime] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [nextId, setNextId] = useState(1);

  const addPlayer = () => {
    const time = parseInt(newPlayerTime, 10);
    if (newPlayerName && !isNaN(time) && time > 0) {
      setPlayers([...players, { id: nextId, name: newPlayerName, time }]);
      setNextId(nextId + 1);
      setNewPlayerName('');
      setNewPlayerTime('');
      setResults([]); // Clear previous results
    } else {
      alert('Please enter a valid name and a positive number for the time.');
    }
  };

  const removePlayer = (id: number) => {
    setPlayers(players.filter(player => player.id !== id));
    setResults([]); // Clear previous results
  };

  const calculateDelays = () => {
    if (players.length < 2) {
      alert('Please add at least two players to calculate delays.');
      return;
    }

    const maxTime = Math.max(...players.map(p => p.time));
    const calculatedResults = players.map(player => ({
      name: player.name,
      delay: maxTime - player.time,
    }));
    setResults(calculatedResults);
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>March Time Calculator</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Player Name"
          style={{ padding: '8px', flexGrow: 1 }}
        />
        <input
          type="number"
          value={newPlayerTime}
          onChange={(e) => setNewPlayerTime(e.target.value)}
          placeholder="March Time (seconds)"
          style={{ padding: '8px', width: '150px' }}
        />
        <button onClick={addPlayer} style={{ padding: '8px 12px' }}>
          Add Player
        </button>
      </div>

      <div>
        <h2>Player List</h2>
        {players.length === 0 ? (
          <p>No players added yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.map((player) => (
              <li key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                <span>{player.name} - {player.time} seconds</span>
                <button onClick={() => removePlayer(player.id)} style={{ padding: '5px 10px', background: '#ffdddd', border: 'none', cursor: 'pointer' }}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {players.length > 0 && (
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={calculateDelays} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Calculate Delays
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Calculation Results</h2>
          <p>To synchronize the arrival, players should depart with the following delays:</p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {results.sort((a, b) => b.delay - a.delay).map((result, index) => (
              <li key={index} style={{ padding: '10px', background: index % 2 === 0 ? '#f0f0f0' : '#ffffff' }}>
                <strong>{result.name}:</strong> Wait for <strong>{result.delay}</strong> seconds before marching.
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
