import type { Component } from 'solid-js'
import { Router, Route, Routes } from '@solidjs/router'
import { ModalProvider, ModalContext } from './stores/ModalStore'
import Modal from './components/Modal/Modal'
import { WebSocketContext, WebSocketProvider } from './stores/WebScoketStore'
import Auth from './components/Auth/Auth'
import MainView from './views/MainView'
const App: Component = () => {
  return (
    <Router>
      <ModalContext.Provider value={ModalProvider()}>
        <WebSocketContext.Provider value={WebSocketProvider()}>
            <Routes>
              <Route path={'/auth'} component={Auth} />
              <Route path={'/'} component={MainView} />
              <Route path={'/rating'} component={MainView} />
              <Route path={'/active-players'} component={MainView} />
              <Route path={'/history'} component={MainView} />
              <Route path={'/players'} component={MainView} />
            </Routes>
          <Modal />
        </WebSocketContext.Provider>
      </ModalContext.Provider>
    </Router>
  )
}

export default App
