"use client";

import { useState } from 'react';

interface Player {
  id: number;
  name: string;
  times: number[];
}

interface Result {
  name: string;
  delay: number;
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTimes, setNewPlayerTimes] = useState<string[]>(['']);
  const [results, setResults] = useState<Result[]>([]);
  const [nextId, setNextId] = useState(1);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPlayerTimes, setEditingPlayerTimes] = useState<string[]>([]);

  const addPlayer = () => {
    const times = newPlayerTimes.map(t => parseInt(t, 10)).filter(t => !isNaN(t) && t > 0);
    if (newPlayerName && times.length > 0) {
      setPlayers([...players, { id: nextId, name: newPlayerName, times }]);
      setNextId(nextId + 1);
      setNewPlayerName('');
      setNewPlayerTimes(['']);
      setResults([]); // Clear previous results
    } else {
      alert('Please enter a valid name and at least one positive number for the time.');
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

    const maxTime = Math.max(...players.flatMap(p => p.times));
    const calculatedResults = players.map(player => ({
      name: player.name,
      delay: maxTime - Math.max(...player.times),
    }));
    setResults(calculatedResults);
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...newPlayerTimes];
    newTimes[index] = value;
    setNewPlayerTimes(newTimes);
  };

  const addTimeInput = () => {
    if (newPlayerTimes.length < 5) {
      setNewPlayerTimes([...newPlayerTimes, '']);
    }
  };

  const removeTimeInput = (index: number) => {
    const newTimes = newPlayerTimes.filter((_, i) => i !== index);
    setNewPlayerTimes(newTimes);
  };

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerTimes(player.times.map(String));
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditingPlayerTimes([]);
  };

  const saveEditing = (id: number) => {
    const times = editingPlayerTimes.map(t => parseInt(t, 10)).filter(t => !isNaN(t) && t > 0);
    if (times.length > 0) {
      setPlayers(players.map(p => (p.id === id ? { ...p, times } : p)));
      setEditingPlayerId(null);
      setEditingPlayerTimes([]);
      setResults([]);
    } else {
      alert('Please enter at least one valid time.');
    }
  };

  const handleEditingTimeChange = (index: number, value: string) => {
    const newTimes = [...editingPlayerTimes];
    newTimes[index] = value;
    setEditingPlayerTimes(newTimes);
  };

  const addEditingTimeInput = () => {
    if (editingPlayerTimes.length < 5) {
      setEditingPlayerTimes([...editingPlayerTimes, '']);
    }
  };

  const removeEditingTimeInput = (index: number) => {
    const newTimes = editingPlayerTimes.filter((_, i) => i !== index);
    setEditingPlayerTimes(newTimes);
  };

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>March Time Calculator</h1>

      <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px' }}>
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Player Name"
          style={{ padding: '8px', width: 'calc(100% - 18px)', marginBottom: '10px' }}
        />
        {newPlayerTimes.map((time, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
            <input
              type="number"
              value={time}
              onChange={(e) => handleTimeChange(index, e.target.value)}
              placeholder={`March Time ${index + 1} (seconds)`}
              style={{ padding: '8px', flexGrow: 1 }}
            />
            {newPlayerTimes.length > 1 && (
              <button onClick={() => removeTimeInput(index)} style={{ padding: '5px 10px' }}>
                Remove
              </button>
            )}
          </div>
        ))}
        {newPlayerTimes.length < 5 && (
          <button onClick={addTimeInput} style={{ padding: '5px 10px', marginRight: '10px' }}>
            Add Time
          </button>
        )}
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
              <li key={player.id} data-testid={`player-item-${player.name}`} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                {editingPlayerId === player.id ? (
                  <div>
                    {editingPlayerTimes.map((time, index) => (
                      <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                        <input
                          type="number"
                          value={time}
                          onChange={(e) => handleEditingTimeChange(index, e.target.value)}
                          style={{ padding: '5px', flexGrow: 1 }}
                        />
                        {editingPlayerTimes.length > 1 && (
                          <button onClick={() => removeEditingTimeInput(index)} style={{ padding: '5px 10px' }}>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {editingPlayerTimes.length < 5 && (
                      <button onClick={addEditingTimeInput} style={{ padding: '5px 10px', marginRight: '10px' }}>
                        Add Time
                      </button>
                    )}
                    <button onClick={() => saveEditing(player.id)} style={{ padding: '5px 10px', marginRight: '5px' }}>
                      Save
                    </button>
                    <button onClick={cancelEditing} style={{ padding: '5px 10px' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{player.name} - {player.times.join(', ')} seconds</span>
                    <div>
                      <button onClick={() => startEditing(player)} style={{ padding: '5px 10px', marginRight: '5px' }}>
                        Edit
                      </button>
                      <button onClick={() => removePlayer(player.id)} style={{ padding: '5px 10px', background: '#ffdddd', border: 'none', cursor: 'pointer' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                )}
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
