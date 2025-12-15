"use client";

import { useState } from 'react';

interface MarchTimes {
  castle: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
}

interface Player {
  id: number;
  name: string;
  times: MarchTimes;
}

interface Result {
  name: string;
  delays: { [key in keyof MarchTimes]?: number };
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTimes, setNewPlayerTimes] = useState({ castle: '', t1: '', t2: '', t3: '', t4: '' });
  const [results, setResults] = useState<Result[]>([]);
  const [nextId, setNextId] = useState(1);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPlayerTimes, setEditingPlayerTimes] = useState({ castle: '', t1: '', t2: '', t3: '', t4: '' });

  const addPlayer = () => {
    const parsedTimes = {
      castle: parseInt(newPlayerTimes.castle, 10) || 0,
      t1: parseInt(newPlayerTimes.t1, 10) || 0,
      t2: parseInt(newPlayerTimes.t2, 10) || 0,
      t3: parseInt(newPlayerTimes.t3, 10) || 0,
      t4: parseInt(newPlayerTimes.t4, 10) || 0,
    };
    const timeValues = Object.values(parsedTimes).filter(t => t > 0);

    if (newPlayerName && timeValues.length > 0) {
      setPlayers([...players, { id: nextId, name: newPlayerName, times: parsedTimes }]);
      setNextId(nextId + 1);
      setNewPlayerName('');
      setNewPlayerTimes({ castle: '', t1: '', t2: '', t3: '', t4: '' });
      setResults([]); // Clear previous results
    } else {
      alert('Please enter a valid name and at least one positive march time.');
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

    const timeCategories: (keyof MarchTimes)[] = ['castle', 't1', 't2', 't3', 't4'];
    const newResults: { [playerName: string]: { name: string; delays: { [key in keyof MarchTimes]?: number } } } = {};

    players.forEach(p => {
      newResults[p.name] = { name: p.name, delays: {} };
    });

    timeCategories.forEach(category => {
      const playersForCategory = players.filter(p => p.times[category] > 0);

      if (playersForCategory.length >= 2) {
        const maxTime = Math.max(...playersForCategory.map(p => p.times[category]));
        playersForCategory.forEach(player => {
          newResults[player.name].delays[category] = maxTime - player.times[category];
        });
      }
    });

    setResults(Object.values(newResults));
  };

  const handleNewTimeChange = (key: keyof typeof newPlayerTimes, value: string) => {
    setNewPlayerTimes(prev => ({ ...prev, [key]: value }));
  };

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerTimes({
      castle: String(player.times.castle || ''),
      t1: String(player.times.t1 || ''),
      t2: String(player.times.t2 || ''),
      t3: String(player.times.t3 || ''),
      t4: String(player.times.t4 || ''),
    });
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditingPlayerTimes({ castle: '', t1: '', t2: '', t3: '', t4: '' });
  };

  const saveEditing = (id: number) => {
    const parsedTimes = {
      castle: parseInt(editingPlayerTimes.castle, 10) || 0,
      t1: parseInt(editingPlayerTimes.t1, 10) || 0,
      t2: parseInt(editingPlayerTimes.t2, 10) || 0,
      t3: parseInt(editingPlayerTimes.t3, 10) || 0,
      t4: parseInt(editingPlayerTimes.t4, 10) || 0,
    };
    const timeValues = Object.values(parsedTimes).filter(t => t > 0);

    if (timeValues.length > 0) {
      setPlayers(players.map(p => (p.id === id ? { ...p, times: parsedTimes } : p)));
      setEditingPlayerId(null);
      setEditingPlayerTimes({ castle: '', t1: '', t2: '', t3: '', t4: '' });
      setResults([]);
    } else {
      alert('Please enter at least one valid time.');
    }
  };

  const handleEditingTimeChange = (key: keyof typeof editingPlayerTimes, value: string) => {
    setEditingPlayerTimes(prev => ({ ...prev, [key]: value }));
  };

  const timeLabels: { [K in keyof MarchTimes]: string } = {
    castle: 'Castle',
    t1: 'T1',
    t2: 'T2',
    t3: 'T3',
    t4: 'T4',
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
        {Object.keys(newPlayerTimes).map((key) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <label htmlFor={`new-${key}`} style={{ width: '80px', textAlign: 'right', marginRight: '5px' }}>{timeLabels[key as keyof MarchTimes]}</label>
            <input
              id={`new-${key}`}
              type="number"
              value={newPlayerTimes[key as keyof typeof newPlayerTimes]}
              onChange={(e) => handleNewTimeChange(key as keyof typeof newPlayerTimes, e.target.value)}
              placeholder="Time (seconds)"
              style={{ padding: '8px', flexGrow: 1 }}
            />
          </div>
        ))}
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
                    {Object.keys(editingPlayerTimes).map((key) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <label htmlFor={`edit-${key}`} style={{ width: '80px', textAlign: 'right', marginRight: '5px' }}>{timeLabels[key as keyof MarchTimes]}</label>
                        <input
                          id={`edit-${key}`}
                          type="number"
                          value={editingPlayerTimes[key as keyof typeof editingPlayerTimes]}
                          onChange={(e) => handleEditingTimeChange(key as keyof typeof editingPlayerTimes, e.target.value)}
                          style={{ padding: '5px', flexGrow: 1 }}
                        />
                      </div>
                    ))}
                    <div style={{ marginTop: '10px' }}>
                      <button onClick={() => saveEditing(player.id)} style={{ padding: '5px 10px', marginRight: '5px' }}>
                        Save
                      </button>
                      <button onClick={cancelEditing} style={{ padding: '5px 10px' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{player.name} - {Object.values(player.times).filter(t => t > 0).join(', ')} seconds</span>
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
            {results.map((result, index) => (
              Object.keys(result.delays).length > 0 && (
                <li key={index} style={{ padding: '10px', background: index % 2 === 0 ? '#f0f0f0' : '#ffffff' }}>
                  <strong>{result.name}:</strong>
                  <ul style={{ listStyle: 'none', paddingLeft: '20px', marginTop: '5px' }}>
                    {Object.entries(result.delays).map(([category, delay]) => (
                      <li key={category}>
                        {timeLabels[category as keyof MarchTimes]}: Wait for <strong>{delay}</strong> seconds
                      </li>
                    ))}
                  </ul>
                </li>
              )
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
