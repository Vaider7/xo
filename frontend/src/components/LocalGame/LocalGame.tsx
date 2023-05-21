import { type Component, createSignal, type Setter, useContext } from 'solid-js'
import Board from '../Board/Board'
import { MainPageState } from '../Main/Main'
import styles from './LocalGame.module.css'
import x from '../../assets/x.svg'
import o from '../../assets/o.svg'
import { ModalContext, type ModalInterface } from '../../stores/ModalStore'
import cup from '../../assets/cup.png'

export interface LocalGameState {
  field: number[]
  currentPlayer: number
  startTime: number
  wonCombination: number[]
}

interface BoardProps {
  setMainPageState: Setter<MainPageState>
}

enum Winner {
  X,
  O,
  Tie
}

enum Player {
  X = 1,
  O = -1,
}

const checkWinner = (field: number[], gameState: Setter<LocalGameState>): Winner | null => {
  const position1 = [field[0], field[1], field[2]].reduce((a, b) => a + b, 0)
  const position2 = [field[3], field[4], field[5]].reduce((a, b) => a + b, 0)
  const position3 = [field[6], field[7], field[8]].reduce((a, b) => a + b, 0)
  const position4 = [field[0], field[3], field[6]].reduce((a, b) => a + b, 0)
  const position5 = [field[1], field[4], field[7]].reduce((a, b) => a + b, 0)
  const position6 = [field[2], field[5], field[8]].reduce((a, b) => a + b, 0)
  const position7 = [field[0], field[4], field[8]].reduce((a, b) => a + b, 0)
  const position8 = [field[2], field[4], field[6]].reduce((a, b) => a + b, 0)

  if (position1 === 3) {
    updateWonPosition(gameState, [0, 1, 2])
    return Winner.X
  } else if (position1 === -3) {
    updateWonPosition(gameState, [0, 1, 2])
    return Winner.O
  }

  if (position2 === 3) {
    updateWonPosition(gameState, [3, 4, 5])
    return Winner.X
  } else if (position2 === -3) {
    updateWonPosition(gameState, [3, 4, 5])
    return Winner.O
  }

  if (position3 === 3) {
    updateWonPosition(gameState, [6, 7, 8])
    return Winner.X
  } else if (position3 === -3) {
    updateWonPosition(gameState, [6, 7, 8])
    return Winner.O
  }

  if (position4 === 3) {
    updateWonPosition(gameState, [0, 3, 6])
    return Winner.X
  } else if (position4 === -3) {
    updateWonPosition(gameState, [0, 3, 6])
    return Winner.O
  }

  if (position5 === 3) {
    updateWonPosition(gameState, [1, 4, 7])
    return Winner.X
  } else if (position5 === -3) {
    updateWonPosition(gameState, [1, 4, 7])
    return Winner.O
  }

  if (position6 === 3) {
    updateWonPosition(gameState, [2, 5, 8])
    return Winner.X
  } else if (position6 === -3) {
    updateWonPosition(gameState, [2, 5, 8])
    return Winner.O
  }

  if (position7 === 3) {
    updateWonPosition(gameState, [0, 4, 8])
    return Winner.X
  } else if (position7 === -3) {
    updateWonPosition(gameState, [0, 4, 8])
    return Winner.O
  }

  if (position8 === 3) {
    updateWonPosition(gameState, [2, 4, 6])
    return Winner.X
  } else if (position8 === -3) {
    updateWonPosition(gameState, [2, 4, 6])
    return Winner.O
  }

  let counter = 0
  for (const i of field) {
    if (i !== 0) {
      counter += 1
    }
  }

  if (counter === 9) {
    return Winner.Tie
  }
  return null
}

const updateGameState = (cellNumber: number, setGameState: Setter<LocalGameState>, currentPlayer: Player): void => {
  setGameState((prev) => {
    if (prev.field[cellNumber] !== 0) {
      return prev
    }

    prev.field[cellNumber] = currentPlayer
    prev.currentPlayer = currentPlayer === -1 ? 1 : -1
    window.localStorage.setItem('localGameState', JSON.stringify(prev))

    return prev
  })
}

const updateWonPosition = (setGameState: Setter<LocalGameState>, wonPosition: number[]): void => {
  setGameState((prev) => {
    prev.wonCombination = wonPosition
    return prev
  })
}

const Modal: Component<{
  winner: Winner,
  setLocalGameState: Setter<LocalGameState>,
  setMainPageState: Setter<MainPageState>,
  closeModal: () => void
}> = (props) => {
  const newGame = (): void => {
    props.setLocalGameState((prev) => {
      prev.wonCombination = []
      prev.startTime = Date.now()
      prev.field = [0, 0, 0, 0, 0, 0, 0, 0, 0]
      prev.currentPlayer = 1

      return prev
    })
    props.closeModal()
  }

  return (
    <div class={styles.modal}>
      <img src={cup} alt={'Кубок'}/>
      <p>{props.winner === Winner.X ? 'Победили крестики!' : 'Победили нолики!'}</p>
      <button onClick={newGame}>Новая игра</button>
      <button
        onClick={() => {
          props.setMainPageState(MainPageState.MainMenu)
          props.closeModal()
        }}
        class={styles.toMainMenu}
      >
        Выйти в меню
      </button>
    </div>
  )
}
const LocalGame: Component<BoardProps> = (props) => {
  const [, {
    setModalContent,
    closeModal
  }] = useContext(ModalContext) as ModalInterface
  const localGameStateString = window.localStorage.getItem('localGameState') as string
  console.log(localGameStateString)
  const [localGameState, setLocalGameState] =
    createSignal(JSON.parse(localGameStateString) as LocalGameState, { equals: false })

  const onCellClick = (index: number): void => {
    if (localGameState().wonCombination.length > 0) {
      return
    }
    updateGameState(index, setLocalGameState, localGameState().currentPlayer)
    const winner = checkWinner(localGameState().field, setLocalGameState)

    if (winner !== null) {
      setTimeout(() => {
        window.localStorage.removeItem('localGameState')
        setModalContent(<Modal winner={winner} setLocalGameState={setLocalGameState}
                               setMainPageState={props.setMainPageState} closeModal={closeModal}/>)
      }, 2000)
    }
  }

  const [gameTime, setGameTime] = createSignal('00:00')
  const timer = (): void => {
    const distinction = Math.floor((Date.now() - localGameState().startTime) / 1000)
    let seconds = (distinction % 60).toString()
    let minutes = Math.floor(distinction / 60).toString()

    if (seconds.length < 2) {
      seconds = '0' + seconds
    }

    if (minutes.length < 2) {
      minutes = '0' + minutes
    }
    setGameTime(`${minutes}:${seconds}`)
  }

  // eslint-disable-next-line solid/reactivity
  timer()

  setInterval(timer, 1000)

  return (
    <div class={styles.container}>
      <div class={styles.timer}>
        <p>{gameTime()}</p>
      </div>
      <Board onClick={onCellClick} localGameState={localGameState}/>
      <div class={styles.currentPlayer}>
        <p>Сейчас ходит</p>
        {localGameState().currentPlayer === -1 ? <img src={o} alt={'Нолики'}/> : <img src={x} alt={'Крестики'}/>}
      </div>
    </div>
  )
}
export default LocalGame
