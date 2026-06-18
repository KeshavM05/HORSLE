import { useState, useEffect, useCallback } from 'react'
import './App.css'

const ANSWER = 'HORSE'
const MAX_GUESSES = 6
const WORD_LENGTH = 5

type LetterStatus = 'correct' | 'present' | 'absent'

function App() {
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [shake, setShake] = useState(false)
  const [message, setMessage] = useState('')
  const [revealedRows, setRevealedRows] = useState<number[]>([])
  const [tileFlipPhase, setTileFlipPhase] = useState<Record<string, 'in' | 'out'>>({})
  const [tileColorRevealed, setTileColorRevealed] = useState<Record<string, boolean>>({})
  const [isRevealing, setIsRevealing] = useState(false)

  const showMessage = (msg: string, duration = 2000) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), duration)
  }

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH) {
      setShake(true)
      showMessage('Not enough letters')
      setTimeout(() => setShake(false), 500)
      return
    }

    const newGuesses = [...guesses, currentGuess]
    const rowIndex = guesses.length
    setGuesses(newGuesses)
    setCurrentGuess('')
    setIsRevealing(true)

    const TILE_DELAY = 500
    const HALF_FLIP = 400

    for (let i = 0; i < WORD_LENGTH; i++) {
      const tileStart = i * TILE_DELAY
      setTimeout(() => {
        setTileFlipPhase(prev => ({ ...prev, [`${rowIndex}-${i}`]: 'in' }))
      }, tileStart)
      setTimeout(() => {
        setTileColorRevealed(prev => ({ ...prev, [`${rowIndex}-${i}`]: true }))
        setTileFlipPhase(prev => ({ ...prev, [`${rowIndex}-${i}`]: 'out' }))
      }, tileStart + HALF_FLIP)
    }

    const revealDone = (WORD_LENGTH - 1) * TILE_DELAY + HALF_FLIP * 2
    setTimeout(() => {
      setRevealedRows(prev => [...prev, rowIndex])
      setIsRevealing(false)

      if (currentGuess === ANSWER) {
        setGameOver(true)
        const trollMessages = [
          "No way... you guessed HORSE?! 🐴",
          "Wow, incredible detective work! 🕵️",
          "Who could have POSSIBLY seen that coming?!",
          "You're basically a genius. The word was HORSE. In HORSLE.",
        ]
        showMessage(trollMessages[Math.min(newGuesses.length - 1, 3)], 5000)
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true)
        showMessage("The word was HORSE. It's literally called HORSLE. 🐴💀", 10000)
      }
    }, revealDone)
  }, [currentGuess, guesses])

  const handleKey = useCallback((key: string) => {
    if (gameOver || isRevealing) return

    if (key === 'ENTER') {
      submitGuess()
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => prev + key)
    }
  }, [gameOver, isRevealing, currentGuess, submitGuess])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Enter') handleKey('ENTER')
      else if (e.key === 'Backspace') handleKey('BACKSPACE')
      else if (/^[a-zA-Z]$/.test(e.key)) handleKey(e.key.toUpperCase())
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  const getLetterStatus = (guess: string, index: number): LetterStatus => {
    const letter = guess[index]
    if (ANSWER[index] === letter) return 'correct'
    if (ANSWER.includes(letter)) return 'present'
    return 'absent'
  }

  const getKeyStatus = () => {
    const status: Record<string, LetterStatus> = {}
    guesses.forEach((guess, rowIndex) => {
      if (!revealedRows.includes(rowIndex)) return
      guess.split('').forEach((letter, i) => {
        const s = getLetterStatus(guess, i)
        if (s === 'correct') status[letter] = 'correct'
        else if (s === 'present' && status[letter] !== 'correct') status[letter] = 'present'
        else if (!status[letter]) status[letter] = 'absent'
      })
    })
    return status
  }

  const keyStatus = getKeyStatus()
  const keyboardRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['ENTER','Z','X','C','V','B','N','M','BACKSPACE']
  ]

  return (
    <div className="game">
      <header>
        <h1>🐴 HORSLE</h1>
        <div className="subtitle-wrapper">
          <p className="subtitle">Like WORDLE but the word is always HORSE</p>
          {message && <div className="message">{message}</div>}
        </div>
      </header>

      <div className="board">
        {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
          const guess = guesses[rowIndex]
          const isCurrentRow = rowIndex === guesses.length
          const letters = guess
            ? guess.split('')
            : isCurrentRow
            ? currentGuess.padEnd(WORD_LENGTH).split('')
            : Array(WORD_LENGTH).fill('')

          return (
            <div
              key={rowIndex}
              className={`row ${isCurrentRow && shake ? 'shake' : ''}`}
            >
              {letters.map((letter: string, colIndex: number) => {
                const key = `${rowIndex}-${colIndex}`
                const flipPhase = tileFlipPhase[key]
                const colorRevealed = tileColorRevealed[key]
                return (
                  <div
                    key={colIndex}
                    className={`tile ${colorRevealed && guess ? getLetterStatus(guess, colIndex) : ''} ${
                      letter.trim() ? 'filled' : ''
                    } ${flipPhase === 'in' ? 'flip-in' : ''} ${flipPhase === 'out' ? 'flip-out' : ''}`}
                  >
                    {letter.trim()}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      <div className="keyboard">
        {keyboardRows.map((row, i) => (
          <div key={i} className="keyboard-row">
            {row.map(key => (
              <button
                key={key}
                className={`key ${keyStatus[key] || ''} ${
                  key === 'ENTER' || key === 'BACKSPACE' ? 'wide' : ''
                }`}
                onClick={() => handleKey(key)}
              >
                {key === 'BACKSPACE' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
