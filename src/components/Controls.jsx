import React from 'react'

export default function Controls({visible=true, onTake, selectedMap, clearSelection, validateSelection}){
  if(!visible) return null
  const valid = validateSelection ? validateSelection(selectedMap) : (selectedMap && Object.keys(selectedMap).length>0)
  return (
    <div className="controls">
      <button id="takeBtn" className={valid ? 'valid' : 'invalid'} onClick={()=>onTake(selectedMap, clearSelection)}>Take</button>
    </div>
  )
}
