interface SendUuid {
  action: 'sendUuid'
  uuid: string
}

interface SendGameState {
  action: 'sendGameState'
}

interface ConfirmAuth {
  action: 'confirmAuth'
}

export type ServerAction = SendUuid | SendGameState | ConfirmAuth
