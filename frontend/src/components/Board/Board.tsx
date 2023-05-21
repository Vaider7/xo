import { Index, type Accessor, type Component } from 'solid-js'
import styles from './Board.module.css'
import { type LocalGameState } from '../LocalGame/LocalGame'

interface BoardProps {
  localGameState: Accessor<LocalGameState>
  onClick: (index: number) => void
}

const Board: Component<BoardProps> = (props) => {
  const setClass = (item: Accessor<number>, index: number): string => {
    let className = ''
    if (item() === 1) {
      className += styles.x + ' '

      if (props.localGameState().wonCombination.includes(index)) {
        className += styles.xBackground
      }
    } else if (item() === -1) {
      className += styles.o + ' '

      if (props.localGameState().wonCombination.includes(index)) {
        className += styles.oBackground
      }
    }
    return className
  }

  return (
    <div class={styles.board}>
        <Index each={props.localGameState().field}>{(item, index) =>
          <div class={setClass(item, index)} onClick={() => { props.onClick(index) }} />
        }</Index>
    </div>
  )
}
export default Board
