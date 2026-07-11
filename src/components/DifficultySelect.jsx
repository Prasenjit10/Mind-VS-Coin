import React from 'react'

export default function DifficultySelect({onSelect, visible=true}){
  if(!visible) return null
  return (
    <div id="difficultySelect" className="selection-panel">
      <button onClick={()=>onSelect('easy')}>Easy😊</button>
      <button onClick={()=>onSelect('medium')}>Medium😎</button>
      <button onClick={()=>onSelect('hard')}>Hard😈</button>
    </div>
  )
}
