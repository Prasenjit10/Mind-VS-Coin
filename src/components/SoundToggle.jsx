import React from 'react'

export default function SoundToggle({isMuted, toggle}){
  return <button id="soundToggle" className="mute" onClick={toggle}>{isMuted? '🔇':'🔊'}</button>
}
