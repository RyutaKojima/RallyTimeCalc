"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db, firebaseInitPromise } from '../../../lib/firebase'; // Adjust path as needed
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc, setDoc, Firestore } from 'firebase/firestore';


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
  selectedTarget: keyof MarchTimes;
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
  const [isNewPlayerFormVisible, setIsNewPlayerFormVisible] = useState(false);
  const [isContinuousInput, setIsContinuousInput] = useState(false);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [copyDepartureFeedback, setCopyDepartureFeedback] = useState('');
  const [roomData, setRoomData] = useState<RoomData>({
    rallyWaitTime: 0,
    arrivalTime: { hour: '', min: '', sec: '' },
    selectedTarget: 'castle',
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [minutesFromNow, setMinutesFromNow] = useState('');
  const [secondsFromNow, setSecondsFromNow] = useState('');
  const [isPlayerListOpen, setIsPlayerListOpen] = useState(true);
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [isDepartureTimesOpen, setIsDepartureTimesOpen] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const init = async () => {
      const configured = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      setIsFirebaseConfigured(configured);
      if (configured) {
        await firebaseInitPromise;
        setIsFirebaseReady(true);
      }

      const currentRoomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;
      if (currentRoomId) {
        setRoomId(currentRoomId);
      }
      setIsLoading(false);
    };
    init();
  }, [params.roomId]);


  // Set up Firestore listener
  useEffect(() => {
    if (!isFirebaseReady || !roomId) return;

    const playersCollectionRef = collection(db as Firestore, 'rooms', roomId, 'players');
    const unsubscribe = onSnapshot(playersCollectionRef, (querySnapshot) => {
      const playersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() } as Player);
      });
      setPlayers(playersData);
    });

    return () => unsubscribe(); // Clean up listener
  }, [roomId, isFirebaseReady]);

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
          arrivalTime: { hour: '', min: '', sec: '' },
          selectedTarget: 'castle'
        };
        // Use setDoc to create the document
        setDoc(roomDocRef, defaultRoomData);
      }
    });

    return () => unsubscribe(); // Clean up the listener
  }, [roomId]);

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
        setIsNewPlayerFormVisible(false); // Hide form after adding
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

    const target = roomData.selectedTarget;
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

  const handleTargetChange = async (value: keyof MarchTimes) => {
    if (!db || !roomId) return;
    const roomDocRef = doc(db as Firestore, 'rooms', roomId);
    await setDoc(roomDocRef, { selectedTarget: value }, { merge: true });
  };

  const handleSetArrivalTimeFromNow = async () => {
    if (!db || !roomId) return;
    const minutes = parseInt(minutesFromNow, 10) || 0;
    const seconds = parseInt(secondsFromNow, 10) || 0;

    if ((isNaN(minutes) && isNaN(seconds)) || (minutes < 0 || seconds < 0)) {
      alert('Please enter a valid number of minutes and/or seconds.');
      return;
    }

    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    now.setSeconds(now.getSeconds() + seconds);

    const newArrivalTime = {
      hour: String(now.getHours()).padStart(2, '0'),
      min: String(now.getMinutes()).padStart(2, '0'),
      sec: String(now.getSeconds()).padStart(2, '0'),
    };

    const roomDocRef = doc(db as Firestore, 'rooms', roomId);
    await setDoc(roomDocRef, { arrivalTime: newArrivalTime }, { merge: true });
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

  const shouldShowAddPlayerForm = isNewPlayerFormVisible || players.length === 0;

  if (isLoading) {
    return (
      <main className="flex items-center justify-center h-screen font-sans bg-gray-100">
        <p className="text-lg text-gray-600">Loading...</p>
      </main>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <main className="max-w-xl p-5 mx-auto font-sans text-center">
        <h2 className="flex items-center justify-center mb-5 text-xl">
          Room ID: <code className="px-2 py-1 ml-2 bg-gray-200 rounded">{roomId}</code>
        </h2>
        <div className="p-5 bg-red-100 border border-red-400 rounded-lg">
          <h1 className="text-2xl font-bold text-red-800">Configuration Error</h1>
          <p className="mt-2 text-red-700">Firebase is not configured correctly. Please check your environment variables.</p>
          <p className="mt-1 text-sm text-red-600">The application&apos;s database functionality is currently disabled.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 mx-auto font-sans text-gray-800 bg-gray-100 md:max-w-4xl md:p-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold">March Time Calculator</h1>
        <div className="flex items-center justify-center mt-4 text-lg">
          <h2 className="font-semibold">Room ID:</h2>
          <code className="px-3 py-1 ml-2 text-base font-mono bg-gray-200 rounded-md">{roomId}</code>
          <button onClick={handleCopy} className="p-2 ml-2 text-gray-500 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Copy Room ID">
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
              data-testid="copy-icon"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          {copyFeedback && <span className="ml-3 text-sm text-green-600">{copyFeedback}</span>}
        </div>
      </header>

      <section className="mt-8">
        {shouldShowAddPlayerForm ? (
          <div className="p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-md">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player Name"
              className="w-full px-3 py-2 mb-4 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="space-y-3">
              {timeCategories.map((key) => (
                <div key={key} className="grid items-center grid-cols-[80px_1fr_auto_1fr] gap-2">
                  <label htmlFor={`new-${key}-min`} className="text-right text-gray-600">{timeLabels[key]}</label>
                  <input
                    id={`new-${key}-min`}
                    type="number"
                    value={newPlayerTimes[key].min}
                    onChange={(e) => handleNewTimeChange(key, e.target.value, 'min')}
                    placeholder="Min"
                    className="w-full px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="font-bold text-center">:</span>
                  <input
                    id={`new-${key}-sec`}
                    type="number"
                    value={newPlayerTimes[key].sec}
                    onChange={(e) => handleNewTimeChange(key, e.target.value, 'sec')}
                    placeholder="Sec"
                    className="w-full px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="continuous-input"
                  checked={isContinuousInput}
                  onChange={(e) => setIsContinuousInput(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="continuous-input" className="ml-2 text-sm text-gray-700">Continuous Input</label>
              </div>
              <div className="flex gap-2">
                {players.length > 0 &&
                  <button onClick={() => setIsNewPlayerFormVisible(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancel
                  </button>
                }
                <button onClick={addPlayer} disabled={!isFirebaseConfigured} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 text-center">
            <button onClick={() => setIsNewPlayerFormVisible(true)} disabled={!isFirebaseConfigured} className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-300">
              Add User
            </button>
          </div>
        )}
      </section>

      <section className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Player List</h2>
          <button
            onClick={() => setIsPlayerListOpen(!isPlayerListOpen)}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-expanded={isPlayerListOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${isPlayerListOpen ? 'rotate-180' : ''
                }`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
        {isPlayerListOpen && (
          <div>
            {players.length === 0 ? (
              <p className="text-gray-500">No players added yet.</p>
            ) : (
              <ul className="space-y-4">
                {players.map((player) => (
                  <li key={player.id} data-testid={`player-item-${player.name}`} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    {editingPlayerId === player.id ? (
                      <div>
                    <input
                      type="text"
                      value={editingPlayerName}
                      onChange={(e) => setEditingPlayerName(e.target.value)}
                      placeholder="Player Name"
                      className="w-full px-3 py-2 mb-4 text-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="space-y-3">
                      {timeCategories.map((key) => (
                        <div key={key} className="grid items-center grid-cols-[80px_1fr_auto_1fr] gap-2">
                          <label htmlFor={`edit-${key}-min`} className="text-right text-gray-600">{timeLabels[key]}</label>
                          <input
                            id={`edit-${key}-min`}
                            type="number"
                            value={editingPlayerTimes[key].min}
                            onChange={(e) => handleEditingTimeChange(key, e.target.value, 'min')}
                            placeholder="Min"
                            className="w-full px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="font-bold text-center">:</span>
                          <input
                            id={`edit-${key}-sec`}
                            type="number"
                            value={editingPlayerTimes[key].sec}
                            onChange={(e) => handleEditingTimeChange(key, e.target.value, 'sec')}
                            placeholder="Sec"
                            className="w-full px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button onClick={cancelEditing} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                      </button>
                      <button onClick={() => saveEditing(player.id)} disabled={!isFirebaseConfigured} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={player.enabled !== false}
                        onChange={(e) => handleTogglePlayerEnabled(player.id, e.target.checked)}
                        className="w-5 h-5 mr-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div>
                        <strong className="text-lg font-medium text-gray-900">{player.name}</strong>
                        <ul className="mt-1 text-sm text-gray-600">
                          {timeCategories
                            .filter(category => player.times[category] > 0)
                            .map(category => (
                              <li key={category}><span className="font-medium">{timeLabels[category]}:</span> {formatTime(player.times[category])}</li>
                            ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditing(player)} className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Edit
                      </button>
                      <button onClick={() => removePlayer(player.id)} disabled={!isFirebaseConfigured} className="px-3 py-1 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:bg-red-300">
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
        )}
      </section>

      {players.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4 my-4">
          <div className="flex items-center gap-2">
            <label htmlFor="copy-target-select" className="font-medium">Target:</label>
            <select
              id="copy-target-select"
              data-testid="copy-target-select"
              value={roomData.selectedTarget || 'castle'}
              onChange={(e) => handleTargetChange(e.target.value as keyof MarchTimes)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timeCategories.map(cat => (
                <option key={cat} value={cat}>{timeLabels[cat]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="rally-wait-time" className="font-medium">Rally Waiting Time</label>
            <select
              id="rally-wait-time"
              value={roomData.rallyWaitTime || 0}
              onChange={(e) => handleRallyWaitTimeChange(Number(e.target.value))}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">None</option>
              <option value="60">1 minute</option>
              <option value="180">3 minutes</option>
              <option value="300">5 minutes</option>
              <option value="600">10 minutes</option>
            </select>
          </div>
        </div>
      )}

      {players.length > 0 && (
        <div className="mt-6 text-center">
          <button onClick={calculateDelays} className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700">
            Calculate Delays
          </button>
        </div>
      )}

      {results.length > 0 && (
        <section className="p-6 mt-8 bg-white border border-gray-200 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Calculation Results</h2>
            <button
              onClick={() => setIsResultsOpen(!isResultsOpen)}
              className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={isResultsOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${isResultsOpen ? 'rotate-180' : ''
                  }`}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
          {isResultsOpen && (
            <div>
              <p className="mb-4 text-gray-600">To synchronize the arrival, players should depart with the following delays:</p>
              <ul className="mt-4 space-y-2" data-testid="calculation-results-list">
                {(() => {
                  const sortedResults = results
                    .filter(result => result.delays[roomData.selectedTarget] !== undefined)
                    .sort((a, b) => (a.delays[roomData.selectedTarget] ?? 0) - (b.delays[roomData.selectedTarget] ?? 0));

                  const basePlayer = sortedResults.find(r => (r.delays[roomData.selectedTarget] ?? 0) === 0);
                  const basePlayerName = basePlayer ? basePlayer.name : "N/A";

                  return sortedResults.map((result, index) => (
                    <li key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-800">{result.name}</span>
                      <div className="text-right">
                        {result.delays[roomData.selectedTarget]! > 0 ? (
                          <>
                            <span className="text-sm text-gray-500">
                              Wait for {formatTime(result.delays[roomData.selectedTarget] as number)}
                            </span>
                            {roomData.rallyWaitTime > 0 && (result.delays[roomData.selectedTarget] as number) < roomData.rallyWaitTime &&
                              <div className="font-mono text-lg font-bold text-blue-600" data-testid={`rally-start-time-${result.name}`}>
                                Rally Start Time: {basePlayerName} timer = {formatTime(roomData.rallyWaitTime - (result.delays[roomData.selectedTarget] as number))}
                              </div>
                            }
                          </>
                        ) : (
                          <span className="font-mono text-lg font-bold text-green-600">
                            Depart Now
                          </span>
                        )}
                      </div>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="p-6 mt-8 bg-white border-t-4 border-blue-500 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center">Departure Time Calculator</h2>
        <p className="mt-2 text-center text-gray-600">
          Current UTC Time: <span className="font-mono font-bold text-orange-500">{currentTime.toUTCString().match(/(\d{2}:\d{2}:\d{2})/)?.[0]}</span>
        </p>
        <div className="grid gap-6 mt-6 md:grid-cols-1">
          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            <label className="mb-2 font-medium">Set Arrival Time from Now</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minutesFromNow}
                onChange={(e) => setMinutesFromNow(e.target.value)}
                placeholder="Min"
                className="w-24 px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={secondsFromNow}
                onChange={(e) => setSecondsFromNow(e.target.value)}
                placeholder="Sec"
                className="w-24 px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleSetArrivalTimeFromNow} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Set
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 p-4 mt-4 bg-gray-50 rounded-lg">
          <label htmlFor="arrival-hour" className="font-medium">Arrival Time (UTC)</label>
          <div className="flex items-center gap-2">
            <input
              id="arrival-hour"
              type="number"
              value={roomData.arrivalTime?.hour || ''}
              onChange={(e) => handleArrivalTimeChange(e.target.value, 'hour')}
              placeholder="HH"
              className="w-20 px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>:</span>
            <input
              id="arrival-min"
              type="number"
              value={roomData.arrivalTime?.min || ''}
              onChange={(e) => handleArrivalTimeChange(e.target.value, 'min')}
              placeholder="MM"
              className="w-20 px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>:</span>
            <input
              id="arrival-sec"
              type="number"
              value={roomData.arrivalTime?.sec || ''}
              onChange={(e) => handleArrivalTimeChange(e.target.value, 'sec')}
              placeholder="SS"
              className="w-20 px-3 py-2 text-right border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <button onClick={calculateDepartureTimes} className="px-6 py-3 font-semibold text-white bg-green-600 rounded-lg shadow-md hover:bg-green-700">
            Calculate Departure Times
          </button>
        </div>

        {departureTimes.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Departure Times</h2>
              <button
                onClick={() => setIsDepartureTimesOpen(!isDepartureTimesOpen)}
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-expanded={isDepartureTimesOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${isDepartureTimesOpen ? 'rotate-180' : ''
                    }`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
            {isDepartureTimesOpen && (
              <div>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button onClick={handleDepartureCopy} className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Copy
                  </button>
                  {copyDepartureFeedback && <span className="ml-3 text-sm text-green-600">{copyDepartureFeedback}</span>}
                </div>
                <ul id="departure-times-list" className="mt-4 space-y-2">
                  {departureTimes
                    .filter(player => player.departures[roomData.selectedTarget])
                    .sort((a, b) => a.departures[roomData.selectedTarget].localeCompare(b.departures[roomData.selectedTarget]))
                    .map((player, index) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800">{player.name}</span>
                        <span className="font-mono text-lg font-bold text-blue-600">{player.departures[roomData.selectedTarget]}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
