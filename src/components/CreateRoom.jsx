import React, { useState } from 'react';

export default function CreateRoom({ visible, onCreate, onBack }) {
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
      <div className="selection-panel1">
        <button onClick={() => onCreate(name)}>Create Room</button>
        <button onClick={onBack}>⬅ Back</button>
      </div>
    </div>
  );
}
