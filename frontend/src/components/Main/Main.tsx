import type { Component, Setter } from 'solid-js'
import styles from './Main.module.css'
import classNames from 'classnames'
import { createSignal, Switch, Match, useContext } from 'solid-js'
import LocalGame, { type LocalGameState } from '../LocalGame/LocalGame'
import { WebSocketContext, type WebSocketStoreInterface } from '../../stores/WebScoketStore'
export enum MainPageState {
  MainMenu,
  LocalGame,
  EnemyGame,
}

const initLocalGame = (setMainPageState: Setter<MainPageState>): void => {
  window.localStorage.setItem('localGameState',
    JSON.stringify(
      {
        field: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        currentPlayer: 1,
        startTime: Date.now(),
        wonCombination: []
      } satisfies LocalGameState))
  setMainPageState((_) => {
    return MainPageState.LocalGame
  })
}

const Main: Component = () => {
  const [webSocketStore] = useContext(WebSocketContext) as WebSocketStoreInterface

  const [mainPageState, setMainPageState] = createSignal(MainPageState.MainMenu)
  const localGameState = window.localStorage.getItem('localGameState')

  if (localGameState !== null) {
    setMainPageState(MainPageState.LocalGame)
  }

  return (
    <Switch fallback={
      <div class={styles.outerContainer}>
        <div class={styles.container}>
          <button class={classNames(styles.playEnemy, styles.play)} onClick={() => { webSocketStore.socket.send('Just hello') }}>Сыграть с противником</button>
          <button
            class={classNames(styles.playSolo, styles.play)}
            onClick={() => {
              initLocalGame(setMainPageState)
            }}
          >
            Сыграть одному
          </button>
        </div>
      </div>
    }>
      <Match when={mainPageState() === MainPageState.LocalGame}>
        <LocalGame setMainPageState={setMainPageState} />
      </Match>
      {/* <Match when={state.route === "settings"}> */}
      {/*   <Settings /> */}
      {/* </Match> */}
    </Switch>
  )
}
export default Main
