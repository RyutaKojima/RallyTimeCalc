"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '../../../lib/firebase'; // Adjust path as needed
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, setDoc, getDoc, Firestore } from 'firebase/firestore';


const parseTimeToSeconds = (time: TimeInput): number => {
  const minutes = parseInt(time.min, 10) || 0;
  const seconds = parseInt(time.sec, 10) || 0;
  return (minutes * 60) + seconds;
};

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

interface MarchTimes {
  castle: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
}

interface Player {
  id: string; // Firestore document ID
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

interface ArrivalTimeInput {
  hour: string;
  min: string;
  sec: string;
}

interface DepartureResult {
  name: string;
  departures: { [key: string]: string };
}

type PlayerTimeInput = { [key in keyof MarchTimes]: TimeInput };

const timeCategories: (keyof MarchTimes)[] = ['castle', 't1', 't2', 't3', 't4'];

export default function Room() {
  const params = useParams();
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
  const [arrivalTime, setArrivalTime] = useState<ArrivalTimeInput>({ hour: '', min: '', sec: '' });
  const [departureTimes, setDepartureTimes] = useState<DepartureResult[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerTimes, setEditingPlayerTimes] = useState<PlayerTimeInput>({
    castle: { min: '', sec: '' },
    t1: { min: '', sec: '' },
    t2: { min: '', sec: '' },
    t3: { min: '', sec: '' },
    t4: { min: '', sec: '' },
  });
  const [isAddPlayerFormVisible, setIsAddPlayerFormVisible] = useState(players.length === 0);
  const [isContinuousInput, setIsContinuousInput] = useState(false);
  const [rallyWaitTime, setRallyWaitTime] = useState(0);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentRoomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
    if (currentRoomId) {
      setRoomId(currentRoomId);
      setIsLoading(false);
    }
  }, [params.roomId]);

  // Set up Firestore listener
  useEffect(() => {
    setIsFirebaseConfigured(!!db);

    if (!db || !roomId) return;

    const playersCollectionRef = collection(db as Firestore, 'rooms', roomId, 'players');
    const unsubscribe = onSnapshot(playersCollectionRef, (querySnapshot) => {
      const playersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() } as Player);
      });
      setPlayers(playersData);
    });

    return () => unsubscribe(); // Clean up listener
  }, [roomId]);

  useEffect(() => {
    if (players.length === 0) {
      setIsAddPlayerFormVisible(true);
    }
  }, [players.length]);

  const addPlayer = async () => {
    if (!db || !roomId) return;
    const parsedTimes = {
      castle: parseTimeToSeconds(newPlayerTimes.castle),
      t1: parseTimeToSeconds(newPlayerTimes.t1),
      t2: parseTimeToSeconds(newPlayerTimes.t2),
      t3: parseTimeToSeconds(newPlayerTimes.t3),
      t4: parseTimeToSeconds(newPlayerTimes.t4),
    };
    const timeValues = Object.values(parsedTimes).filter(t => t > 0);

    if (newPlayerName && timeValues.length > 0) {
      const playersCollectionRef = collection(db as Firestore, 'rooms', roomId, 'players');
      await addDoc(playersCollectionRef, { name: newPlayerName, times: parsedTimes });

      setNewPlayerName('');
      setNewPlayerTimes({
        castle: { min: '', sec: '' },
        t1: { min: '', sec: '' },
        t2: { min: '', sec: '' },
        t3: { min: '', sec: '' },
        t4: { min: '', sec: '' },
      });
      setResults([]); // Clear previous results
      if (!isContinuousInput) {
        setIsAddPlayerFormVisible(false); // Hide form after adding
      }
    } else {
      alert('Please enter a valid name and at least one positive march time.');
    }
  };

  const removePlayer = async (id: string) => {
    if (!db || !roomId) return;
    if (window.confirm('このプレイヤーを削除してもよろしいですか？')) {
      const playerDocRef = doc(db as Firestore, 'rooms', roomId, 'players', id);
      await deleteDoc(playerDocRef);
      setResults([]); // Clear previous results
    }
  };

  const calculateDelays = () => {
    if (players.length < 2) {
      alert('Please add at least two players to calculate delays.');
      return;
    }

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

  const saveEditing = async (id: string) => {
    if (!db || !roomId) return;
    const parsedTimes = {
      castle: parseTimeToSeconds(editingPlayerTimes.castle),
      t1: parseTimeToSeconds(editingPlayerTimes.t1),
      t2: parseTimeToSeconds(editingPlayerTimes.t2),
      t3: parseTimeToSeconds(editingPlayerTimes.t3),
      t4: parseTimeToSeconds(editingPlayerTimes.t4),
    };
    const timeValues = Object.values(parsedTimes).filter(t => t > 0);

    if (timeValues.length > 0) {
      const playerDocRef = doc(db as Firestore, 'rooms', roomId, 'players', id);
      await updateDoc(playerDocRef, { times: parsedTimes });

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

  const handleArrivalTimeChange = (value: string, field: keyof ArrivalTimeInput) => {
    setArrivalTime(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDepartureTimes = () => {
    const arrivalHour = parseInt(arrivalTime.hour, 10) || 0;
    const arrivalMin = parseInt(arrivalTime.min, 10) || 0;
    const arrivalSec = parseInt(arrivalTime.sec, 10) || 0;

    if (isNaN(arrivalHour) || isNaN(arrivalMin) || isNaN(arrivalSec)) {
      alert('Please enter a valid arrival time.');
      return;
    }

    const arrivalDate = new Date();
    arrivalDate.setHours(arrivalHour, arrivalMin, arrivalSec, 0);

    const newDepartureTimes = players.map(player => {
      const departures: { [key: string]: string } = {};
      for (const key in player.times) {
        const marchTime = player.times[key as keyof MarchTimes];
        if (marchTime > 0) {
          const departureDate = new Date(arrivalDate.getTime() - (marchTime + rallyWaitTime) * 1000);
          const hours = String(departureDate.getHours()).padStart(2, '0');
          const minutes = String(departureDate.getMinutes()).padStart(2, '0');
          const seconds = String(departureDate.getSeconds()).padStart(2, '0');
          departures[key] = `${hours}:${minutes}:${seconds}`;
        }
      }
      return { name: player.name, departures };
    });

    setDepartureTimes(newDepartureTimes);
  };

  const timeLabels: { [K in keyof MarchTimes]: string } = {
    castle: 'Castle',
    t1: 'T1',
    t2: 'T2',
    t3: 'T3',
    t4: 'T4',
  };

  if (isLoading) {
    return (
      <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto', padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Room ID: <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{roomId}</code>
        </h2>
        <div style={{ padding: '20px', background: '#ffebee', border: '1px solid #ef5350', borderRadius: '4px' }}>
          <h1 style={{ color: '#c62828' }}>Configuration Error</h1>
          <p>Firebase is not configured correctly. Please check your `.env.local` file and ensure all the environment variables are set with your project's credentials.</p>
          <p>The application's database functionality is currently disabled.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>March Time Calculator</h1>
      <h2 style={{ textAlign: 'center' }}>Room ID: <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>{roomId}</code></h2>

      {isAddPlayerFormVisible ? (
        <div style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '15px' }}>
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Player Name"
            style={{ padding: '8px', width: 'calc(100% - 18px)', marginBottom: '10px' }}
          />
          {timeCategories.map((key) => (
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
          <div style={{ margin: '10px 0' }}>
            <input
              type="checkbox"
              id="continuous-input"
              checked={isContinuousInput}
              onChange={(e) => setIsContinuousInput(e.target.checked)}
            />
            <label htmlFor="continuous-input" style={{ marginLeft: '5px' }}>
              Continuous Input
            </label>
          </div>
          <button onClick={addPlayer} style={{ padding: '8px 12px', marginRight: '5px' }} disabled={!isFirebaseConfigured}>
            Add Player
          </button>
          {players.length > 0 &&
            <button onClick={() => setIsAddPlayerFormVisible(false)} style={{ padding: '8px 12px' }}>
              Cancel
            </button>
          }
        </div>
      ) : (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button onClick={() => setIsAddPlayerFormVisible(true)} style={{ padding: '10px 20px', fontSize: '16px' }} disabled={!isFirebaseConfigured}>
            Add User
          </button>
        </div>
      )}

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
                    <p>Editing <strong>{player.name}</strong></p>
                    {timeCategories.map((key) => (
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
                      <button onClick={() => saveEditing(player.id)} style={{ padding: '5px 10px', marginRight: '5px' }} disabled={!isFirebaseConfigured}>
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
                        {timeCategories
                          .filter(category => player.times[category] > 0)
                          .map(category => (
                            <li key={category}>{timeLabels[category]}: {formatTime(player.times[category])}</li>
                          ))}
                      </ul>
                    </div>
                    <div>
                      <button onClick={() => startEditing(player)} style={{ padding: '5px 10px', marginRight: '5px' }}>
                        Edit
                      </button>
                      <button onClick={() => removePlayer(player.id)} style={{ padding: '5px 10px', background: '#ffdddd', border: 'none', cursor: 'pointer' }} disabled={!isFirebaseConfigured}>
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
                    {timeCategories
                      .filter(category => result.delays[category] !== undefined)
                      .map(category => (
                        <li key={category}>
                          {timeLabels[category]}: Wait for <strong>{formatTime(result.delays[category] as number)}</strong>
                        </li>
                      ))}
                  </ul>
                </li>
              )
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: '30px', borderTop: '2px solid #666', paddingTop: '20px' }}>
        <h2 style={{ textAlign: 'center' }}>Departure Time Calculator</h2>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <label htmlFor="rally-wait-time">Rally Waiting Time:</label>
          <select
            id="rally-wait-time"
            value={rallyWaitTime}
            onChange={(e) => setRallyWaitTime(Number(e.target.value))}
            style={{ padding: '8px' }}
          >
            <option value="0">None</option>
            <option value="60">1 minute</option>
            <option value="180">3 minutes</option>
            <option value="300">5 minutes</option>
            <option value="600">10 minutes</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginBottom: '20px' }}>
          <label htmlFor="arrival-hour">Arrival Time:</label>
          <input
            id="arrival-hour"
            type="number"
            value={arrivalTime.hour}
            onChange={(e) => handleArrivalTimeChange(e.target.value, 'hour')}
            placeholder="HH"
            style={{ padding: '8px', width: '60px' }}
          />
          <span>:</span>
          <input
            id="arrival-min"
            type="number"
            value={arrivalTime.min}
            onChange={(e) => handleArrivalTimeChange(e.target.value, 'min')}
            placeholder="MM"
            style={{ padding: '8px', width: '60px' }}
          />
          <span>:</span>
          <input
            id="arrival-sec"
            type="number"
            value={arrivalTime.sec}
            onChange={(e) => handleArrivalTimeChange(e.target.value, 'sec')}
            placeholder="SS"
            style={{ padding: '8px', width: '60px' }}
          />
        </div>
        <div style={{textAlign: 'center'}}>
          <button onClick={calculateDepartureTimes} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Calculate Departure Times
          </button>
        </div>

        {departureTimes.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h2>Departure Times</h2>
            <ul id="departure-times-list" style={{ listStyle: 'none', padding: 0 }}>
              {departureTimes.map((player, index) => (
                <li key={index} style={{ padding: '10px', background: index % 2 === 0 ? '#f0f0f0' : '#ffffff' }}>
                  <strong>{player.name}:</strong>
                  <ul style={{ listStyle: 'none', paddingLeft: '20px', marginTop: '5px' }}>
                    {timeCategories
                      .filter(category => player.departures[category] !== undefined)
                      .map(category => (
                        <li key={category}>
                          {timeLabels[category]}: <strong>{player.departures[category]}</strong>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
