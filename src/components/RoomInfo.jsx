import React from 'react';

export default function RoomInfo({ visible, roomCode, playerNumber, opponentName, onRestart, canRestart }) {
  if (!visible) return null;

  return (
    <div style={{ color: 'white', marginBottom: 12 }}>
      <div>Room: <strong>{roomCode}</strong></div>
      <div>You are Player {playerNumber}</div>
      {opponentName ? <div>Opponent: {opponentName}</div> : null}
      <button onClick={onRestart} disabled={!canRestart} style={{ marginTop: 10 }}>
        Restart
      </button>
    </div>
  );
}
