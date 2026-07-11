import React, { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import ModeSelect from './components/ModeSelect'
import takeFile from './assets/take.mpeg'
import winFile from './assets/win.mpeg'
import loseFile from './assets/lose.mpeg'
import startFile from './assets/start.mpeg'
import clickFile from './assets/click.mpeg'
import DifficultySelect from './components/DifficultySelect'
import FirstPlayerSelect from './components/FirstPlayerSelect'
import GameBoard from './components/GameBoard'
import Icons from './components/Icons'
import Controls from './components/Controls'
import WinModal from './components/WinModal'
import AICommentary from './components/AICommentary'
import OnlineMenu from './components/OnlineMenu'
import CreateRoom from './components/CreateRoom'
import JoinRoom from './components/JoinRoom'
import WaitingRoom from './components/WaitingRoom'
import RoomInfo from './components/RoomInfo'
import socket from './socket'

const winningPatterns = [
  [2,5,7],[3,4,7],[3,5,6],[2,4,6],[1,5,4],[3,2,1],[1,1,1],[0,5,5],[0,4,4],[0,3,3],[0,2,2],[0,0,1]
]

function arraysEqual(a,b){
  a=[...a].sort((x,y)=>x-y); b=[...b].sort((x,y)=>x-y); return JSON.stringify(a)===JSON.stringify(b)
}

export default function App(){
  const [boxes, setBoxes] = useState([3,5,7])
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [mode, setMode] = useState('local')
  const [aiLevel, setAiLevel] = useState('easy')
  const [hasAnyMoveHappened, setHasAnyMoveHappened] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [showIcons, setShowIcons] = useState(false)
  const [showRestart, setShowRestart] = useState(false)
  const [aiCommentVisible, setAiCommentVisible] = useState(false)
  const [showDifficultySelect, setShowDifficultySelect] = useState(false)
  const [showFirstPlayerSelect, setShowFirstPlayerSelect] = useState(false)
  const [selectedMap, setSelectedMap] = useState({})
  const [winData, setWinData] = useState({show:false, text:'', winner: null})
  const [isMuted, setIsMuted] = useState(false)
  const [onlineView, setOnlineView] = useState('menu')
  const [roomCode, setRoomCode] = useState('')
  const [playerNumber, setPlayerNumber] = useState(1)
  const [isHost, setIsHost] = useState(false)
  const [roomError, setRoomError] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [onlineMessage, setOnlineMessage] = useState('')
  const [restartPending, setRestartPending] = useState(false)
  const [pendingRestartCount, setPendingRestartCount] = useState(0)
  const [onlineReady, setOnlineReady] = useState(false)

  const audioRefs = {
    takeSound: useRef(null), startSound: useRef(null), clickSound: useRef(null), winSound: useRef(null), loseSound: useRef(null)
  }

  useEffect(() => {
    function resetOnlineUi() {
      setOnlineView('menu')
      setShowGame(false)
      setShowIcons(false)
      setShowRestart(false)
      setRoomCode('')
      setPlayerNumber(1)
      setIsHost(false)
      setOpponentName('')
      setOnlineMessage('')
      setRestartPending(false)
      setPendingRestartCount(0)
      setSelectedMap({})
      setGameOver(false)
      setWinData({show:false, text:'', winner:null})
      setBoxes([3,5,7])
      setCurrentPlayer(1)
    }

    function setOnlineWinStateFromPayload(payload = {}) {
      const mySocketId = socket.id
      const { winnerId, winnerName, loserId, loserName, winner } = payload
      if (mySocketId === winnerId) {
        setGameOver(true)
        setWinData({show:true, text:`🏆 ${winnerName || `Player ${winner || 1}`} wins! 🎉`, winner: winnerName || winner || null})
        playSound('winSound')
        launchFireworks()
        return
      }
      if (mySocketId === loserId) {
        setGameOver(true)
        setWinData({show:true, text:`😢 ${loserName || 'Player'}, You Lost!`, winner: loserName || null})
        playSound('loseSound')
        return
      }
      if (winner) {
        setGameOver(true)
        setWinData({show:true, text:`🏆 ${winnerName || `Player ${winner}`} wins! 🎉`, winner: winnerName || winner || null})
        playSound('winSound')
        launchFireworks()
      } else {
        setGameOver(false)
        setWinData({show:false, text:'', winner:null})
      }
    }

    socket.connect()

    function handleRoomCreated({ roomCode: newCode, playerNumber: newPlayerNumber, room }) {
      setMode('online')
      setOnlineView('waiting')
      setRoomCode(newCode)
      setPlayerNumber(newPlayerNumber)
      setIsHost(true)
      setRoomError('')
      setShowGame(false)
      setShowIcons(false)
      setShowRestart(false)
      setGameOver(false)
      setSelectedMap({})
      setCurrentPlayer(room?.currentPlayer || 1)
      if (Array.isArray(room?.boxes)) setBoxes([...room.boxes])
      setOnlineReady(false)
      setOnlineMessage('')
      setRestartPending(false)
      setPendingRestartCount(0)
    }

    function handleRoomJoined({ roomCode: newCode, playerNumber: newPlayerNumber, isHost: host, room }) {
      const nextPlayer = newPlayerNumber || 1
      setMode('online')
      setRoomCode(newCode)
      setPlayerNumber(nextPlayer)
      setIsHost(host)
      setRoomError('')
      setShowGame(false)
      setShowIcons(false)
      setShowRestart(false)
      setSelectedMap({})
      setOnlineMessage('')
      setOnlineReady(false)
      if (host) {
        setOnlineView('waiting')
      } else {
        setOnlineView('room')
      }
      if (Array.isArray(room?.boxes)) setBoxes([...room.boxes])
      if (room?.currentPlayer !== undefined) setCurrentPlayer(room.currentPlayer)
      if (room?.winner) {
        setOnlineWinStateFromPayload({
          winnerId: room?.player1?.playerNumber === room.winner ? room.player1?.id : room.player2?.id,
          winnerName: room?.player1?.playerNumber === room.winner ? room.player1?.name : room.player2?.name,
          loserId: room?.player1?.playerNumber === room.winner ? room.player2?.id : room.player1?.id,
          loserName: room?.player1?.playerNumber === room.winner ? room.player2?.name : room.player1?.name,
          winner: room.winner
        })
      } else {
        setGameOver(false)
        setWinData({show:false, text:'', winner:null})
      }
      const opponent = room?.players?.find((player) => player.playerNumber !== nextPlayer)
      setOpponentName(opponent?.name || '')
    }

    function handleGameStart({ room, playerNumber: serverPlayerNumber }) {
      setMode('online')
      setOnlineView('room')
      setOnlineReady(true)
      setShowGame(true)
      setShowIcons(true)
      setShowRestart(true)
      setSelectedMap({})
      setGameOver(false)
      setWinData({show:false, text:'', winner:null})
      setRoomError('')
      setOnlineMessage('')
      if (Array.isArray(room?.boxes)) setBoxes([...room.boxes])
      if (room?.currentPlayer !== undefined) setCurrentPlayer(room.currentPlayer)
      if (room?.players) {
        const opponent = room.players.find((player) => player.playerNumber !== serverPlayerNumber)
        setOpponentName(opponent?.name || '')
      }
      setPlayerNumber(serverPlayerNumber)
    }

    function handlePlayerJoined({ room }) {
      const currentPlayerNumber = socket.data.playerNumber || playerNumber
      const player = room?.players?.find((entry) => entry.playerNumber !== currentPlayerNumber)
      setOpponentName(player?.name || '')
      if (currentPlayerNumber === 1) {
        setOnlineView('waiting')
      } else {
        setOnlineView('room')
      }
      setShowGame(false)
      setShowIcons(false)
      setShowRestart(false)
    }

    function handleBoardUpdate({ boxes, currentPlayer: serverPlayer, winner, winnerId, winnerName, loserId, loserName }) {
      if (Array.isArray(boxes)) setBoxes([...boxes])
      if (serverPlayer !== undefined) setCurrentPlayer(serverPlayer)
      setShowGame(true)
      setShowIcons(true)
      setShowRestart(true)
      if (winner) {
        setOnlineWinStateFromPayload({ winnerId, winnerName, loserId, loserName, winner })
      } else {
        setGameOver(false)
        setWinData({show:false, text:'', winner:null})
      }
    }

    function handleTurnUpdate({ currentPlayer: serverPlayer, winner, winnerId, winnerName, loserId, loserName }) {
      if (serverPlayer !== undefined) setCurrentPlayer(serverPlayer)
      if (winner) {
        setOnlineWinStateFromPayload({ winnerId, winnerName, loserId, loserName, winner })
      } else {
        setGameOver(false)
        setWinData({show:false, text:'', winner:null})
      }
    }

    function handlePlayAgainRequest({ message }) {
      setRestartPending(true)
      setPendingRestartCount(1)
      setOnlineMessage(message || 'Opponent wants to play again.')
    }

    function handleRestartApproved({ board, currentPlayer: serverPlayer, winner, winnerId, winnerName, loserId, loserName }) {
      if (Array.isArray(board)) setBoxes([...board])
      if (serverPlayer !== undefined) setCurrentPlayer(serverPlayer)
      setRestartPending(false)
      setPendingRestartCount(0)
      setOnlineMessage('')
      if (winner) {
        setOnlineWinStateFromPayload({ winnerId, winnerName, loserId, loserName, winner })
      } else {
        setGameOver(false)
        setWinData({show:false, text:'', winner:null})
      }
    }

    function handleRestartRejected() {
      setRestartPending(false)
      setPendingRestartCount(0)
      setOnlineMessage('Restart was rejected.')
    }

    function handleGameOver(payload = {}) {
      setOnlineWinStateFromPayload(payload)
    }

    function handleGameReset({ boxes: resetBoxes, currentPlayer: serverPlayer, gameOver: serverGameOver }) {
      if (Array.isArray(resetBoxes)) setBoxes([...resetBoxes])
      setSelectedMap({})
      setCurrentPlayer(serverPlayer ?? 1)
      setGameOver(serverGameOver ?? false)
      setWinData({show:false, text:'', winner:null})
      setOnlineReady(true)
      setShowGame(true)
      setShowIcons(true)
      setShowRestart(true)
      setOnlineMessage('')
      setRestartPending(false)
      setPendingRestartCount(0)
    }

    function handlePlayerDisconnected({ message }) {
      setOnlineMessage(message)
      setOnlineView('menu')
      setShowGame(false)
      setShowIcons(false)
      setShowRestart(false)
      setRoomCode('')
      setPlayerNumber(1)
      setIsHost(false)
      setOpponentName('')
      setRestartPending(false)
      setPendingRestartCount(0)
      setSelectedMap({})
      setGameOver(false)
      setWinData({show:false, text:'', winner:null})
      setBoxes([3,5,7])
      setCurrentPlayer(1)
    }

    socket.on('room-created', handleRoomCreated)
    socket.on('room-joined', handleRoomJoined)
    socket.on('game-start', handleGameStart)
    socket.on('player-joined', handlePlayerJoined)
    socket.on('board-update', handleBoardUpdate)
    socket.on('turn-update', handleTurnUpdate)
    socket.on('play-again-request', handlePlayAgainRequest)
    socket.on('restart-approved', handleRestartApproved)
    socket.on('restart-rejected', handleRestartRejected)
    socket.on('game-over', handleGameOver)
    socket.on('game-reset', handleGameReset)
    socket.on('player-disconnected', handlePlayerDisconnected)
    socket.on('room-error', (message) => {
      setRoomError(message)
      setOnlineMessage(message)
    })

    return () => {
      socket.off('room-created', handleRoomCreated)
      socket.off('room-joined', handleRoomJoined)
      socket.off('game-start', handleGameStart)
      socket.off('player-joined', handlePlayerJoined)
      socket.off('board-update', handleBoardUpdate)
      socket.off('turn-update', handleTurnUpdate)
      socket.off('play-again-request', handlePlayAgainRequest)
      socket.off('restart-approved', handleRestartApproved)
      socket.off('restart-rejected', handleRestartRejected)
      socket.off('game-over', handleGameOver)
      socket.off('game-reset', handleGameReset)
      socket.off('player-disconnected', handlePlayerDisconnected)
      socket.disconnect()
    }
  }, [])

  function playSound(id){
    if(isMuted) return
    const ref = audioRefs[id]
    if(ref && ref.current){ ref.current.currentTime = 0; ref.current.play().catch(()=>{}) }
  }

  function selectMode(selectedMode, difficulty='easy'){
    playSound('clickSound')
    setMode(selectedMode); setAiLevel(difficulty)
    setShowDifficultySelect(false)
    if(selectedMode==='ai'){
      setShowFirstPlayerSelect(true)
    } else if (selectedMode === 'online') {
      setOnlineView('menu')
      setShowGame(false)
      setShowIcons(false)
      setShowRestart(false)
    } else {
      startGameAs(1)
    }
  }

  function startGameAs(startingPlayer){
    setCurrentPlayer(startingPlayer)
    playSound('startSound')
    setShowGame(true); setShowIcons(true); setShowRestart(true)
    setShowFirstPlayerSelect(false)
    if(mode==='ai' && startingPlayer===2){
      setTimeout(()=>aiMove([...boxes]),800)
    }
  }

  function validateSelection(selectedMap){
    const keys = Object.keys(selectedMap)
    if(keys.length===0) return false
    const boxIndex = keys[0].split('-')[0]
    return keys.every(k=>k.split('-')[0]===boxIndex)
  }

  function takeCoins(selectedMap, clearSelection) {
    if (gameOver) return;

    if (mode === 'online') {
      if (!onlineReady) {
        setOnlineMessage('Waiting for the other player...')
        return
      }
      const keys = Object.keys(selectedMap)
      if (keys.length === 0) {
        setOnlineMessage('Please select at least one coin.')
        return
      }
      if (currentPlayer !== playerNumber) {
        setOnlineMessage('Opponent\'s Turn')
        return
      }
      socket.emit('move', { roomCode, selectedMap })
      clearSelection()
      setOnlineMessage('')
      return
    }

    const keys = Object.keys(selectedMap)

    if (keys.length === 0) {
        alert("Please select at least one coin.")
        return;
    }

    const boxIndex = parseInt(keys[0].split("-")[0]);

    if (!keys.every(k => parseInt(k.split("-")[0]) === boxIndex)) {
        alert("Select coins from only one box.");
        return;
    }

    const remove = keys.length;

    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex] = Math.max(0, updatedBoxes[boxIndex] - remove);

    setBoxes(updatedBoxes);

    playSound("takeSound");

    setHasAnyMoveHappened(true);

    clearSelection();

    const total = updatedBoxes.reduce((a, b) => a + b, 0);

    if (total === 1) {
        setGameOver(true);
        showWinner(currentPlayer);
        return;
    }

    if (total === 0) {
        setGameOver(true);
        showWinner(3 - currentPlayer);
        return;
    }

    const nextPlayer = 3 - currentPlayer;

    setCurrentPlayer(nextPlayer);

    if (mode === "ai" && nextPlayer === 2) {
        setTimeout(() => {
            aiMove(updatedBoxes);
        }, 800);
    }
}

  function aiMove(currentBoxes){
    if(gameOver) return
    if(hasAnyMoveHappened) showAICommentary()
    const nonEmpty = currentBoxes.map((v,i)=>v>0?i:-1).filter(i=>i!==-1)
    let effectiveLevel = aiLevel
    if(aiLevel==='medium') effectiveLevel = Math.random()<0.2?'hard':'easy'
    let box = nonEmpty[Math.floor(Math.random()*nonEmpty.length)]
    let removeCount = 1
    if(effectiveLevel==='hard'){
      let moved=false
      for(let i=0;i<3;i++){
        for(let remove=1; remove<=currentBoxes[i]; remove++){
          let newConfig=[...currentBoxes]; newConfig[i]-=remove
          if(winningPatterns.some(p=>arraysEqual(p,newConfig))){ box=i; removeCount=remove; moved=true; break }
        }
        if(moved) break
      }
    }
   playSound("takeSound");

const updated = [...currentBoxes];

updated[box] = Math.max(
    0,
    updated[box] - removeCount
);

setBoxes(updated);

const total = updated.reduce((a, b) => a + b, 0);

if (total === 1) {
    setGameOver(true);
    setAiCommentVisible(false);
    showLoser();
    return;
}

if (total === 0) {
    setGameOver(true);
    setAiCommentVisible(false);
    showWinner(1);
    launchFireworks();
    return;
}

setCurrentPlayer(1);
setShowRestart(true);
  }

  function showAICommentary(){ setAiCommentVisible(true); setTimeout(()=>setAiCommentVisible(false),2500) }

  function updateTurnIndicatorText(){
    if(gameOver) return ''
    if(mode==='ai') return currentPlayer===1?"🧠 Your Turn!":"🤖 Bot is thinking..."
    if(mode==='online') return currentPlayer===playerNumber?"🎮 Your Turn":"⏳ Opponent's Turn"
    return currentPlayer===1?"👤 Player 1's Turn":"👤 Player 2's Turn"
  }

  function showWinner(player){
    const winnerName = mode==='ai' ? (player===1? 'You' : 'Bot') : `Player ${player}`
    setWinData({show:true, text:`${winnerName} wins!🎉`, winner: player})
    playSound('winSound')
    launchFireworks()
  }

  function showLoser(){ setWinData({show:true, text:`you Lose!👎🏻`, winner: 2}); playSound('loseSound') }

  function confirmRestart(){ if(!gameOver && !confirm('Are you sure you want to restart the game?')) return; restart() }
  function restart(){
    if(mode==='online'){
      if (!roomCode) return
      socket.emit('play-again', { roomCode })
      setRestartPending(true)
      setOnlineMessage('Waiting for the other player...')
      return
    }
    setBoxes([3,5,7]); setCurrentPlayer(1); setGameOver(false); setHasAnyMoveHappened(false); setShowGame(false); setShowIcons(false); setShowRestart(false); setWinData({show:false,text:'',winner:null})
  }

  function launchFireworks(){ const duration = 2*1000; const animationEnd = Date.now()+duration; const defaults={ startVelocity:30, spread:360, ticks:60, zIndex:1000 }
    const interval = setInterval(()=>{
      const timeLeft = animationEnd - Date.now(); if(timeLeft<=0){ clearInterval(interval); return }
      const particleCount = 50 * (timeLeft/duration)
      confetti({...defaults, particleCount, origin: { x: Math.random()*0.2, y: Math.random()*0.5 } })
      confetti({...defaults, particleCount, origin: { x: 1-Math.random()*0.2, y: Math.random()*0.5 } })
    },250)
  }

  function createOnlineRoom(name){
    setRoomError('')
    setOnlineMessage('')
    socket.emit('create-room', { name: name || 'Player' })
  }

  function joinOnlineRoom(roomInput, name){
    setRoomError('')
    setOnlineMessage('')
    socket.emit('join-room', { roomCode: roomInput, name: name || 'Player' })
  }

  function handleCopyRoomCode(){
    if (!roomCode) return
    navigator.clipboard?.writeText(roomCode).then(() => setOnlineMessage('Room code copied.'))
  }

  function exitOnlineMenu(){
    setOnlineView('menu')
    setShowGame(false)
    setShowIcons(false)
    setShowRestart(false)
    setMode('local')
    setRoomError('')
    setOnlineMessage('')
    setRoomCode('')
    setPlayerNumber(1)
    setIsHost(false)
    setOpponentName('')
    setRestartPending(false)
    setPendingRestartCount(0)
    setSelectedMap({})
  }

  return (
    <div>
      <button className="mute" onClick={()=>setIsMuted(m=>!m)}>{isMuted? '🔇':'🔊'}</button>
      <h1 id="logo"><span className="mind">Mind</span><span className="vs"> VS </span><span className="cointxt">Coin</span></h1>
      <hr id="line" className="underline" />

      <ModeSelect
        onSelectLocal={(m)=>{ setMode('local'); startGameAs(1) }}
        onShowDifficulty={()=>{ playSound('clickSound'); setShowDifficultySelect(true) }}
        onSelectOnline={()=>{ playSound('clickSound'); setMode('online'); setOnlineView('menu') }}
        visible={!showGame && !showDifficultySelect && !showFirstPlayerSelect && mode !== 'online'}
      />
      <DifficultySelect onSelect={(d)=>selectMode('ai',d)} visible={showDifficultySelect && !showGame} />
      <FirstPlayerSelect startGameAs={(p)=>startGameAs(p)} visible={showFirstPlayerSelect && !showGame} />

      <OnlineMenu visible={mode==='online' && onlineView==='menu'} onCreate={()=>setOnlineView('create')} onJoin={()=>setOnlineView('join')} onBack={exitOnlineMenu} />
      <CreateRoom visible={mode==='online' && onlineView==='create'} onCreate={createOnlineRoom} onBack={()=>setOnlineView('menu')} />
      <JoinRoom visible={mode==='online' && onlineView==='join'} onJoin={joinOnlineRoom} onBack={()=>setOnlineView('menu')} error={roomError} />
      <WaitingRoom visible={mode==='online' && onlineView==='waiting'} roomCode={roomCode} onBack={()=>setOnlineView('menu')} onCopy={handleCopyRoomCode} />

      {showGame && <div style={{color:'white', fontSize:20}}>{updateTurnIndicatorText()}</div>}
      {mode === 'online' && roomCode && onlineView !== 'menu' ? <RoomInfo visible={mode==='online' && onlineView==='room'} roomCode={roomCode} playerNumber={playerNumber} opponentName={opponentName} onRestart={restart} canRestart={!gameOver && roomCode} /> : null}
      {onlineMessage ? <div style={{ color: '#ffd966', marginTop: 10 }}>{onlineMessage}</div> : null}

      <GameBoard
        boxes={boxes}
        visible={showGame}
        selectedMap={selectedMap}
        canInteract={mode !== 'online' || (onlineReady && currentPlayer === playerNumber)}
        toggleCoin={(bi, ci) => {
          if (mode === 'online' && (!onlineReady || currentPlayer !== playerNumber)) return
          const key = `${bi}-${ci}`;

          setSelectedMap(prev => {
            const copy = { ...prev };

            if (copy[key]) {
              delete copy[key];
              return copy;
            }

            Object.keys(copy).forEach(k => {
              const oldBox = parseInt(k.split("-")[0]);
              if (oldBox !== bi) {
                delete copy[k];
              }
            });

            copy[key] = true;

            return copy;
          });
        }}
      />

      <AICommentary visible={aiCommentVisible} />

      <Icons visible={showIcons} mode={mode} currentPlayer={currentPlayer} winner={winData.winner} />

      <Controls visible={showRestart} onTake={takeCoins} selectedMap={selectedMap} clearSelection={()=>setSelectedMap({})} validateSelection={validateSelection} />

      <WinModal data={winData} onRestart={restart} />

      <audio ref={audioRefs.takeSound} id="takeSound" src={takeFile} />
      <audio ref={audioRefs.winSound} id="winSound" src={winFile} />
      <audio ref={audioRefs.loseSound} id="loseSound" src={loseFile} />
      <audio ref={audioRefs.startSound} id="startSound" src={startFile} />
      <audio ref={audioRefs.clickSound} id="clickSound" src={clickFile} />
    </div>
  )
}
