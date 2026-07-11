import React from 'react'

export default function ModeSelect({onSelectLocal, onShowDifficulty, onSelectOnline, visible=true}){
  if(!visible) return null
  return (
    <div id="modeSelect" className="selection-collon">
      <div className="selection-panel1">
        <button onClick={()=>onSelectLocal('local')}>🎮 Local 2 Player</button>
        <button onClick={()=>onShowDifficulty()}>🤖 Play With Bot</button>
        <button onClick={()=>onSelectOnline()}>🌐 Play Online</button>
      </div>
    </div>
  )
}
