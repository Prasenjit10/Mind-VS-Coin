import React from 'react'

export default function FirstPlayerSelect({startGameAs, visible=true}){
  if(!visible) return null
  return (
    <div id="firstPlayerSelect" className="selection-panel">
      <button onClick={()=>startGameAs(1)}>🙋‍♂️ I'll play first</button>
      <button onClick={()=>startGameAs(2)}>🤖 Let AI start</button>
    </div>
  )
}
