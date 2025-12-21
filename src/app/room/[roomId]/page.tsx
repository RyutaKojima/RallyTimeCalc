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
  enabled: boolean;
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

interface RoomData {
  rallyWaitTime: number;
  arrivalTime: ArrivalTimeInput;
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
  const [departureTimes, setDepartureTimes] = useState<DepartureResult[]>([]);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [editingPlayerTimes, setEditingPlayerTimes] = useState<PlayerTimeInput>({
    castle: { min: '', sec: '' },
    t1: { min: '', sec: '' },
    t2: { min: '', sec: '' },
    t3: { min: '', sec: '' },
    t4: { min: '', sec: '' },
  });
  const [isAddPlayerFormVisible, setIsAddPlayerFormVisible] = useState(players.length === 0);
  const [isContinuousInput, setIsContinuousInput] = useState(false);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [copyDepartureFeedback, setCopyDepartureFeedback] = useState('');
  const [selectedTargetForCopy, setSelectedTargetForCopy] = useState<keyof MarchTimes>('castle');
  const [roomData, setRoomData] = useState<RoomData>({
    rallyWaitTime: 0,
    arrivalTime: { hour: '', min: '', sec: '' },
  });

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

  // Set up Firestore listener for room data
  useEffect(() => {
    if (!db || !roomId) return;

    const roomDocRef = doc(db as Firestore, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data() as RoomData);
      } else {
        // If the room document doesn't exist, create it with default values
        const defaultRoomData: RoomData = {
          rallyWaitTime: 0,
          arrivalTime: { hour: '', min: '', sec: '' }
        };
        // Use setDoc to create the document
        setDoc(roomDocRef, defaultRoomData);
      }
    });

    return () => unsubscribe(); // Clean up the listener
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
      await addDoc(playersCollectionRef, { name: newPlayerName, times: parsedTimes, enabled: true });

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
    const enabledPlayers = players.filter(p => p.enabled !== false);
    if (enabledPlayers.length < 2) {
      alert('Please select at least two players to calculate delays.');
      setResults([]);
      return;
    }

    const newResults: { [playerName: string]: { name: string; delays: { [key in keyof MarchTimes]?: number } } } = {};

    enabledPlayers.forEach(p => {
      newResults[p.name] = { name: p.name, delays: {} };
    });

    timeCategories.forEach(category => {
      const playersForCategory = enabledPlayers.filter(p => p.times[category] > 0);

      if (playersForCategory.length >= 2) {
        const maxTime = Math.max(...playersForCategory.map(p => p.times[category]));
        playersForCategory.forEach(player => {
          newResults[player.name].delays[category] = maxTime - player.times[category];
        });
      }
    });

    setResults(Object.values(newResults));
  };

  const handleTogglePlayerEnabled = async (id: string, enabled: boolean) => {
    if (!db || !roomId) return;
    const playerDocRef = doc(db as Firestore, 'rooms', roomId, 'players', id);
    await updateDoc(playerDocRef, { enabled });
  };

  const handleNewTimeChange = (key: keyof PlayerTimeInput, value: string, field: 'min' | 'sec') => {
    setNewPlayerTimes(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
    setEditingPlayerTimes({
      castle: { min: String(Math.floor(player.times.castle / 60)), sec: String(player.times.castle % 60) },
      t1: { min: String(Math.floor(player.times.t1 / 60)), sec: String(player.times.t1 % 60) },
      t2: { min: String(Math.floor(player.times.t2 / 60)), sec: String(player.times.t2 % 60) },
      t3: { min: String(Math.floor(player.times.t3 / 60)), sec: String(player.times.t3 % 60) },
      t4: { min: String(Math.floor(player.times.t4 / 60)), sec: String(player.times.t4 % 60) },
    });
  };

  const handleDepartureCopy = () => {
    if (departureTimes.length === 0) return;

    const target = selectedTargetForCopy;
    let copyText = `${timeLabels[target]} Departure Times:\n`;

    const sortedTimes = [...departureTimes]
      .filter(p => p.departures[target])
      .sort((a, b) => {
        // Sort by departure time ascending
        return a.departures[target].localeCompare(b.departures[target]);
      });

    sortedTimes.forEach(player => {
      copyText += `${player.name}: ${player.departures[target]}\n`;
    });

    navigator.clipboard.writeText(copyText).then(() => {
      setCopyDepartureFeedback('Copied!');
      setTimeout(() => setCopyDepartureFeedback(''), 2000);
    }, (err) => {
      setCopyDepartureFeedback('Failed!');
      console.error('Could not copy text: ', err);
    });
  };

  const cancelEditing = () => {
    setEditingPlayerId(null);
    setEditingPlayerName('');
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

    if (editingPlayerName.trim() && timeValues.length > 0) {
      const playerDocRef = doc(db as Firestore, 'rooms', roomId, 'players', id);
      await updateDoc(playerDocRef, { name: editingPlayerName.trim(), times: parsedTimes });

      setEditingPlayerId(null);
      setEditingPlayerName('');
      setEditingPlayerTimes({
        castle: { min: '', sec: '' },
        t1: { min: '', sec: '' },
        t2: { min: '', sec: '' },
        t3: { min: '', sec: '' },
        t4: { min: '', sec: '' },
      });
      setResults([]);
    } else {
      alert('Please enter a valid name and at least one valid time.');
    }
  };

  const handleEditingTimeChange = (key: keyof PlayerTimeInput, value: string, field: 'min' | 'sec') => {
    setEditingPlayerTimes(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const handleArrivalTimeChange = async (value: string, field: keyof ArrivalTimeInput) => {
    if (!db || !roomId) return;
    const newArrivalTime = { ...roomData.arrivalTime, [field]: value };
    const roomDocRef = doc(db as Firestore, 'rooms', roomId);
    await setDoc(roomDocRef, { arrivalTime: newArrivalTime }, { merge: true });
  };

  const handleRallyWaitTimeChange = async (value: number) => {
    if (!db || !roomId) return;
    const roomDocRef = doc(db as Firestore, 'rooms', roomId);
    await setDoc(roomDocRef, { rallyWaitTime: value }, { merge: true });
  };

  const calculateDepartureTimes = () => {
    const arrivalHour = parseInt(roomData.arrivalTime.hour, 10) || 0;
    const arrivalMin = parseInt(roomData.arrivalTime.min, 10) || 0;
    const arrivalSec = parseInt(roomData.arrivalTime.sec, 10) || 0;

    if (isNaN(arrivalHour) || isNaN(arrivalMin) || isNaN(arrivalSec)) {
      alert('Please enter a valid arrival time.');
      return;
    }
    const enabledPlayers = players.filter(p => p.enabled !== false);
    if (enabledPlayers.length < 1) {
      setDepartureTimes([]);
      return;
    }

    const arrivalDate = new Date();
    arrivalDate.setHours(arrivalHour, arrivalMin, arrivalSec, 0);

    const newDepartureTimes = enabledPlayers.map(player => {
      const departures: { [key: string]: string } = {};
      for (const key in player.times) {
        const marchTime = player.times[key as keyof MarchTimes];
        if (marchTime > 0) {
          const departureDate = new Date(arrivalDate.getTime() - (marchTime + roomData.rallyWaitTime) * 1000);
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

  const handleCopy = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback('Copied!');
      setTimeout(() => setCopyFeedback(''), 2000); // Clear feedback after 2 seconds
    }, (err) => {
      setCopyFeedback('Failed!');
      console.error('Could not copy text: ', err);
    });
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
      <h2 style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Room ID:
        <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px', marginRight: '5px' }}>
          {roomId}
        </code>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ cursor: 'pointer' }}
          onClick={handleCopy}
          data-testid="copy-icon"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        {copyFeedback && <span style={{ marginLeft: '10px', color: 'green', fontSize: '14px' }}>{copyFeedback}</span>}
      </h2>

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
                    <input
                      type="text"
                      value={editingPlayerName}
                      onChange={(e) => setEditingPlayerName(e.target.value)}
                      placeholder="Player Name"
                      style={{ padding: '8px', width: 'calc(100% - 18px)', marginBottom: '10px' }}
                    />
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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={player.enabled !== false}
                        onChange={(e) => handleTogglePlayerEnabled(player.id, e.target.checked)}
                        style={{ marginRight: '10px' }}
                      />
                      <div>
                        <strong>{player.name}</strong>
                        <ul style={{ listStyle: 'none', paddingLeft: '20px', fontSize: '0.9em', margin: 0 }}>
                          {timeCategories
                            .filter(category => player.times[category] > 0)
                            .map(category => (
                              <li key={category}>{timeLabels[category]}: {formatTime(player.times[category])}</li>
                            ))}
                        </ul>
                      </div>
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
            value={roomData.rallyWaitTime || 0}
            onChange={(e) => handleRallyWaitTimeChange(Number(e.target.value))}
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
            value={roomData.arrivalTime?.hour || ''}
            onChange={(e) => handleArrivalTimeChange(e.target.value, 'hour')}
            placeholder="HH"
            style={{ padding: '8px', width: '60px' }}
          />
          <span>:</span>
          <input
            id="arrival-min"
            type="number"
            value={roomData.arrivalTime?.min || ''}
            onChange={(e) => handleArrivalTimeChange(e.target.value, 'min')}
            placeholder="MM"
            style={{ padding: '8px', width: '60px' }}
          />
          <span>:</span>
          <input
            id="arrival-sec"
            type="number"
            value={roomData.arrivalTime?.sec || ''}
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <select
                data-testid="copy-target-select"
                value={selectedTargetForCopy}
                onChange={(e) => setSelectedTargetForCopy(e.target.value as keyof MarchTimes)}
                style={{ padding: '8px' }}
              >
                {timeCategories.map(cat => (
                  <option key={cat} value={cat}>{timeLabels[cat]}</option>
                ))}
              </select>
              <button onClick={handleDepartureCopy} style={{ padding: '8px 12px' }}>
                Copy
              </button>
              {copyDepartureFeedback && <span style={{ color: 'green', fontSize: '14px' }}>{copyDepartureFeedback}</span>}
            </div>
            <ul id="departure-times-list" style={{ listStyle: 'none', padding: 0 }}>
              {departureTimes.map((player, index) => (
                <li key={index} style={{ padding: '10px', background: index % 2 === 0 ? '#f0f0f0' : '#ffffff' }}>
                  <strong>{player.name}:</strong>
                  <ul style={{ listStyle: 'none', paddingLeft: '20px', marginTop: '5px' }}>
                    {timeCategories
                      .filter(category => player.departures[category] !== undefined)
                      .map(category => (
                        <li key={category}>
                          {timeLabels[category]}: <strong style={{ color: category === selectedTargetForCopy ? 'red' : 'inherit' }}>{player.departures[category]}</strong>
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
