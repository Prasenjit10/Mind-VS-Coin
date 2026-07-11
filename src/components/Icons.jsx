import React from 'react'
import userImg from '../assets/user.jpg'

export default function Icons({visible=true, mode, currentPlayer=1, winner=null}){
  if(!visible) return null
  const p1Class = 'player-icon' + (currentPlayer===1 ? ' active' : '') + (winner===1 ? ' winner' : '')
  const p2Class = 'player-icon' + (currentPlayer===2 ? ' active' : '') + (winner===2 ? ' winner' : '')
  return (
    <div id="icons" className="player-icons">
      <div>
        <div><img src={userImg} alt="Player" id="player1Icon" className={p1Class}/></div>
        <div>{mode==='ai'? 'You':'Player 1'}</div>
      </div>
      <div>
        <div><img src={userImg} alt="Player" id="player2Icon" className={p2Class}/></div>
        <div>{mode==='ai'? 'Bot':'Player 2'}</div>
      </div>
    </div>
  )
}
