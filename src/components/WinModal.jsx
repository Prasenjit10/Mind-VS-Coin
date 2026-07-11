import React from 'react'
import userImg from '../assets/user.jpg'

export default function WinModal({data, onRestart}){
  if(!data.show) return null
  return (
    <div id="winModal" className={data.show? 'show':''}>
      <img src={userImg} alt="Player" className="player-icon" />
      <div id="winText">{data.text}</div>
      <button onClick={onRestart}>Play Again</button>
    </div>
  )
}
