"use client";

import { useState } from 'react';

const parseTimeToSeconds = (time: TimeInput): number => {
  const minutes = parseInt(time.min, 10) || 0;
  const seconds = parseInt(time.sec, 10) || 0;
  return (minutes * 60) + seconds;
};

const formatTime = (totalSeconds: number): string => {
  if (totalSeconds === 0) return '0 seconds';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  let result = '';
  if (minutes > 0) {
    result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (seconds > 0) {
    if (result.length > 0) result += ' ';
    result += `${seconds} second${seconds > 1 ? 's' : ''}`;
  }
  return result;
};

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

interface TimeInput {
  min: string;
  sec: string;
}

type PlayerTimeInput = { [key in keyof MarchTimes]: TimeInput };


export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerTimes, setNewPlayerTimes] = useState<PlayerTimeInput>({
    castle: { min: '', sec: '' },
    t1: { min: '', sec: '' },
    t2: { min: '', sec: '' },
    t3: { min: '', sec: '' },
    t4: { min: '', sec: '' },
  });
  const [results, setResults] = useState<Result[]>([]);
  const [nextId, setNextId] = useState(1);
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editingPlayerTimes, setEditingPlayerTimes] = useState<PlayerTimeInput>({
    castle: { min: '', sec: '' },
    t1: { min: '', sec: '' },
    t2: { min: '', sec: '' },
    t3: { min: '', sec: '' },
    t4: { min: '', sec: '' },
  });

  const addPlayer = () => {
    const parsedTimes = {
      castle: parseTimeToSeconds(newPlayerTimes.castle),
      t1: parseTimeToSeconds(newPlayerTimes.t1),
      t2: parseTimeToSeconds(newPlayerTimes.t2),
      t3: parseTimeToSeconds(newPlayerTimes.t3),
      t4: parseTimeToSeconds(newPlayerTimes.t4),
    };
    const timeValues = Object.values(parsedTimes).filter(t => t > 0);

    if (newPlayerName && timeValues.length > 0) {
      setPlayers([...players, { id: nextId, name: newPlayerName, times: parsedTimes }]);
      setNextId(nextId + 1);
      setNewPlayerName('');
      setNewPlayerTimes({
        castle: { min: '', sec: '' },
        t1: { min: '', sec: '' },
        t2: { min: '', sec: '' },
        t3: { min: '', sec: '' },
        t4: { min: '', sec: '' },
      });
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

  const handleNewTimeChange = (key: keyof PlayerTimeInput, value: string, field: 'min' | 'sec') => {
    setNewPlayerTimes(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerTimes({
      castle: { min: String(Math.floor(player.times.castle / 60)), sec: String(player.times.castle % 60) },
      t1: { min: String(Math.floor(player.times.t1 / 60)), sec: String(player.times.t1 % 60) },
      t2: { min: String(Math.floor(player.times.t2 / 60)), sec: String(player.times.t2 % 60) },
      t3: { min: String(Math.floor(player.times.t3 / 60)), sec: String(player.times.t3 % 60) },
      t4: { min: String(Math.floor(player.times.t4 / 60)), sec: String(player.times.t4 % 60) },
    });
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditingPlayerTimes({
      castle: { min: '', sec: '' },
      t1: { min: '', sec: '' },
      t2: { min: '', sec: '' },
      t3: { min: '', sec: '' },
      t4: { min: '', sec: '' },
    });
  };

  const saveEditing = (id: number) => {
    const parsedTimes = {
      castle: parseTimeToSeconds(editingPlayerTimes.castle),
      t1: parseTimeToSeconds(editingPlayerTimes.t1),
      t2: parseTimeToSeconds(editingPlayerTimes.t2),
      t3: parseTimeToSeconds(editingPlayerTimes.t3),
      t4: parseTimeToSeconds(editingPlayerTimes.t4),
    };
    const timeValues = Object.values(parsedTimes).filter(t => t > 0);

    if (timeValues.length > 0) {
      setPlayers(players.map(p => (p.id === id ? { ...p, times: parsedTimes } : p)));
      setEditingPlayerId(null);
      setEditingPlayerTimes({
        castle: { min: '', sec: '' },
        t1: { min: '', sec: '' },
        t2: { min: '', sec: '' },
        t3: { min: '', sec: '' },
        t4: { min: '', sec: '' },
      });
      setResults([]);
    } else {
      alert('Please enter at least one valid time.');
    }
  };

  const handleEditingTimeChange = (key: keyof PlayerTimeInput, value: string, field: 'min' | 'sec') => {
    setEditingPlayerTimes(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
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
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
            <label htmlFor={`new-${key}-min`} style={{ width: '80px', textAlign: 'right', marginRight: '5px' }}>{timeLabels[key as keyof MarchTimes]}</label>
            <input
              id={`new-${key}-min`}
              type="number"
              value={newPlayerTimes[key as keyof typeof newPlayerTimes].min}
              onChange={(e) => handleNewTimeChange(key as keyof typeof newPlayerTimes, e.target.value, 'min')}
              placeholder="Minutes"
              style={{ padding: '8px', width: '80px' }}
            />
            <span>:</span>
            <input
              id={`new-${key}-sec`}
              type="number"
              value={newPlayerTimes[key as keyof typeof newPlayerTimes].sec}
              onChange={(e) => handleNewTimeChange(key as keyof typeof newPlayerTimes, e.target.value, 'sec')}
              placeholder="Seconds"
              style={{ padding: '8px', width: '80px' }}
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
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <label htmlFor={`edit-${key}-min`} style={{ width: '80px', textAlign: 'right', marginRight: '5px' }}>{timeLabels[key as keyof MarchTimes]}</label>
                        <input
                          id={`edit-${key}-min`}
                          type="number"
                          value={editingPlayerTimes[key as keyof typeof editingPlayerTimes].min}
                          onChange={(e) => handleEditingTimeChange(key as keyof typeof editingPlayerTimes, e.target.value, 'min')}
                          placeholder="Minutes"
                          style={{ padding: '5px', width: '80px' }}
                        />
                        <span>:</span>
                        <input
                          id={`edit-${key}-sec`}
                          type="number"
                          value={editingPlayerTimes[key as keyof typeof editingPlayerTimes].sec}
                          onChange={(e) => handleEditingTimeChange(key as keyof typeof editingPlayerTimes, e.target.value, 'sec')}
                          placeholder="Seconds"
                          style={{ padding: '5px', width: '80px' }}
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
                    <div>
                      <strong>{player.name}</strong>
                      <ul style={{ listStyle: 'none', paddingLeft: '20px', fontSize: '0.9em' }}>
                        {Object.entries(player.times)
                          .filter(([, time]) => time > 0)
                          .map(([category, time]) => (
                            <li key={category}>{timeLabels[category as keyof MarchTimes]}: {formatTime(time)}</li>
                          ))}
                      </ul>
                    </div>
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
                        {timeLabels[category as keyof MarchTimes]}: Wait for <strong>{formatTime(delay as number)}</strong>
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
