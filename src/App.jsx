import * as React from 'react'
import './styles.css'

const CENTER = 4
const ADJACENT = {
  0: [1, 3, 4],
  1: [0, 2, 3, 4, 5],
  2: [1, 4, 5],
  3: [0, 1, 4, 6, 7],
  4: [0, 1, 2, 3, 5, 6, 7, 8],
  5: [1, 2, 4, 7, 8],
  6: [3, 4, 7],
  7: [3, 4, 5, 6, 8],
  8: [4, 5, 7],
}
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function calculateWinner(squares) {
  for (const [a, b, c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] }
    }
  }
  return null
}

function wouldWin(squares, from, to, player) {
  const next = squares.slice()
  next[to] = player
  if (from !== null) next[from] = null
  return !!calculateWinner(next)
}

function getValidDestinations(squares, fromIndex) {
  return ADJACENT[fromIndex].filter(i => squares[i] === null)
}

function Square({ value, onClick, isWinning, isSelected, isValidMove }) {
  let className = 'square'
  if (isWinning) className += ' winning'
  else if (isSelected) className += ' selected'
  else if (isValidMove) className += ' valid-move'

  return (
    <button className={className} onClick={onClick}>
      {value || ''}
    </button>
  )
}

export default function App() {
  const [squares, setSquares] = React.useState(Array(9).fill(null))
  const [isXTurn, setIsXTurn] = React.useState(true)
  const [selected, setSelected] = React.useState(null)
  const [moveError, setMoveError] = React.useState('')

  const currentPlayer = isXTurn ? 'X' : 'O'
  const xCount = squares.filter(s => s === 'X').length
  const oCount = squares.filter(s => s === 'O').length

  const inMovePhase = (isXTurn && xCount === 3) || (!isXTurn && oCount === 3)

  const result = calculateWinner(squares)
  const winningLine = result ? result.line : []

  const playerSquares = squares
    .map((v, i) => (v === currentPlayer ? i : -1))
    .filter(i => i !== -1)
  const playerHasCenter = playerSquares.includes(CENTER)
  const mustMoveCenter = inMovePhase && playerHasCenter

  const validDestinations = selected !== null ? getValidDestinations(squares, selected) : []

  function handleClick(index) {
    if (result) return
    setMoveError('')

    if (!inMovePhase) {
      // Placement phase
      if (squares[index]) return
      const next = squares.slice()
      next[index] = currentPlayer
      setSquares(next)
      setIsXTurn(!isXTurn)
    } else {
      // Move phase - first click selects a piece
      if (selected === null) {
        if (squares[index] !== currentPlayer) {
          setMoveError('Select one of your own pieces.')
          return
        }
        // Center rule: must select center piece unless another piece can win
        if (mustMoveCenter && index !== CENTER) {
          const dests = getValidDestinations(squares, index)
          const canWin = dests.some(d => wouldWin(squares, index, d, currentPlayer))
          if (!canWin) {
            setMoveError('You have a piece in the center — you must move it or win.')
            return
          }
        }
        setSelected(index)
      } else {
        // Second click: deselect, re-select, or move
        if (index === selected) {
          setSelected(null)
          return
        }
        if (squares[index] === currentPlayer) {
          // Re-select another own piece; re-apply center rule
          if (mustMoveCenter && index !== CENTER) {
            const dests = getValidDestinations(squares, index)
            const canWin = dests.some(d => wouldWin(squares, index, d, currentPlayer))
            if (!canWin) {
              setMoveError('You have a piece in the center — you must move it or win.')
              setSelected(null)
              return
            }
          }
          setSelected(index)
          return
        }
        // Destination must be empty
        if (squares[index] !== null) {
          setMoveError('Invalid move — destination must be empty.')
          setSelected(null)
          return
        }
        // Destination must be adjacent
        if (!ADJACENT[selected].includes(index)) {
          setMoveError('Invalid move — must move to an adjacent square.')
          setSelected(null)
          return
        }
        // Center rule: if non-center piece selected, the move must win
        if (mustMoveCenter && selected !== CENTER) {
          if (!wouldWin(squares, selected, index, currentPlayer)) {
            setMoveError('You have a piece in the center — you must move it or win.')
            setSelected(null)
            return
          }
        }
        // Execute move
        const next = squares.slice()
        next[selected] = null
        next[index] = currentPlayer
        setSquares(next)
        setSelected(null)
        setIsXTurn(!isXTurn)
      }
    }
  }

  function handleReset() {
    setSquares(Array(9).fill(null))
    setIsXTurn(true)
    setSelected(null)
    setMoveError('')
  }

  let status = ''
  if (result) {
    status = `${result.winner} wins!`
  } else if (inMovePhase) {
    status = selected !== null
      ? `${currentPlayer}: choose a destination`
      : `${currentPlayer}: select a piece to move`
  } else {
    status = `${currentPlayer}'s turn`
  }

  return (
    <div className="app">
      <h1>Chorus Lapilli</h1>
      <div className="status">{status}</div>
      <div className="error">{moveError}</div>
      <div className="board">
        {squares.map((value, i) => (
          <Square
            key={i}
            value={value}
            onClick={() => handleClick(i)}
            isWinning={winningLine.includes(i)}
            isSelected={selected === i}
            isValidMove={selected !== null && validDestinations.includes(i)}
          />
        ))}
      </div>
      <button className="reset-btn" onClick={handleReset}>New Game</button>
    </div>
  )
}