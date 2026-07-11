import React, { useState } from 'react';

export default function JoinRoom({ visible, onJoin, onBack, error }) {
  const [roomCode, setRoomCode] = useState('');
  const [name, setName] = useState('');

  if (!visible) return null;

  return (
    <div className="selection-collon" style={{ paddingTop: 40 }}>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        style={{ padding: '10px 12px', borderRadius: 8, minWidth: 220 }}
      />
      <input
        value={roomCode}
        onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
        placeholder="Room code"
        style={{ padding: '10px 12px', borderRadius: 8, minWidth: 220 }}
      />
      {error ? <div style={{ color: '#ffb3b3' }}>{error}</div> : null}
      <div className="selection-panel1">
        <button onClick={() => onJoin(roomCode, name)}>Join Room</button>
        <button onClick={onBack}>⬅ Back</button>
      </div>
    </div>
  );
}
