import { createContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { type ServerAction } from '../actions/serverActions'
import { type ClientAction, type SendToken } from '../actions/clientActions'

export const WebSocketContext = createContext({}, {})

interface WebSocketState {
  socket: WebSocket
  receiver: Array<{
    receiverId: string
    callback: (message: MessageEvent<any>) => void
    serverAction: ServerAction
  }>
  uuid: string | null
  isAuthConfirmed: boolean
}

export type WebSocketStoreInterface = [WebSocketState, {
  addReceiver: (receiverId: string, serverAction: ServerAction, callback: (message: ServerAction) => void) => void
  sendAction: (action: ClientAction) => void
}]

export const WebSocketProvider = (): WebSocketStoreInterface => {
  const ws = new WebSocket('ws://127.0.0.1:3000/ws')

  const [state, setState] =
    createStore<WebSocketState>({
      socket: ws,
      receiver: [],
      uuid: null,
      isAuthConfirmed: false
    })

  // ws.addEventListener('open', () => {
  //   const token = window.localStorage.getItem('token')
  //
  //   if (token === null) {
  //     return
  //   }
  //
  //   const data: SendToken = { action: 'SendToken', token }
  //   ws.send(JSON.stringify(data))
  // })

  ws.addEventListener('message', (message) => {
    console.log(message)
    if (message.data === 'Alive?') {
      return
    }

    const msg = JSON.parse(message.data) as ServerAction

    if (msg.action === 'sendUuid') {
      setState('uuid', msg.uuid)

      const token = window.localStorage.getItem('token')

      if (token === null) {
        return
      }

      const data: SendToken = { action: 'sendToken', token, uuid: msg.uuid }
      ws.send(JSON.stringify(data))

      return
    }

    if (msg.action === 'confirmAuth') {
      setState('isAuthConfirmed', true)
    }

    for (const rv of state.receiver) {
      if (rv.serverAction.action === msg.action) {
        rv.callback(message)
      }
    }
  })

  return [
    state,
    {
      addReceiver (receiverId: string, serverAction: ServerAction, callback: (message: ServerAction) => void) {
        const rv = state.receiver.find(rv => rv.receiverId === receiverId)
        if (rv === undefined) {
          const newRv = structuredClone(state.receiver)

          newRv.push({
            receiverId,
            callback
          })

          setState('receiver', newRv)
        }
      },

      sendAction (action: ClientAction) {
        if (!state.isAuthConfirmed) {
          window.location.pathname = '/auth'
        }

        state.socket.send(JSON.stringify(action))
      }
    }
  ]
}
