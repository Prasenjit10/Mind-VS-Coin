import React from 'react'

export default function GameBoard({boxes, visible=true, selectedMap, toggleCoin, canInteract=true}){
  if(!visible) return null

  return (
    <div id="game" style={{display:'flex'}}>
      {boxes.map((count,bi)=> (
        <div key={bi} className="box" data-box={bi}>
          {Array.from({length:count}).map((_,ci)=>{
            const key=`${bi}-${ci}`
            return <div key={key} className={'coin'+(selectedMap && selectedMap[key] ? ' selected' : '')} onClick={() => canInteract && toggleCoin(bi,ci)} />
          })}
        </div>
      ))}
    </div>
  )
}
