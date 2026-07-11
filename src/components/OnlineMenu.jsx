import React from 'react';

export default function OnlineMenu({ visible, onCreate, onJoin, onBack }) {
  if (!visible) return null;

  return (
    <div className="selection-collon" style={{ paddingTop: 40 }}>
      <div className="selection-panel1">
        <button onClick={onCreate}>➕ Create Room</button>
        <button onClick={onJoin}>🔗 Join Room</button>
      </div>
      <button onClick={onBack} style={{ marginTop: 12 }}>⬅ Back</button>
    </div>
  );
}
