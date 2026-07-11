import React from 'react'

export default function AICommentary({visible}){
  if(!visible) return null
  const comments = [
    "Let me think... 🤔",
    "You won't beat me that easily!",
    "Interesting choice…",
    "Aha! Got you now 😏",
    "Just a warm-up...",
    "You're playing well... for now!",
    "Time to flip the game!",
  ]
  const comment = comments[Math.floor(Math.random()*comments.length)]
  return <div id="aiCommentary" className="comment">{comment}</div>
}
