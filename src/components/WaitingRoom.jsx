import React from 'react';

export default function WaitingRoom({ visible, roomCode, onBack, onCopy }) {
  if (!visible) return null;

  return (
    <div className="selection-collon" style={{ paddingTop: 40 }}>
      <h3 style={{ color: 'white' }}>Waiting for another player...</h3>
      <div style={{ color: '#ffd966', fontSize: 24, letterSpacing: 2 }}>{roomCode}</div>
      <div className="selection-panel1">
        <button onClick={onCopy}>📋 Copy Room Code</button>
        <button onClick={onBack}>⬅ Back</button>
      </div>
    </div>
  );
}
