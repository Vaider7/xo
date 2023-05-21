export interface SendToken {
  action: 'sendToken'
  token: string
  uuid: string
}

export interface MakeMove {
  action: 'sendToken'
}

export type ClientAction = SendToken | MakeMove
