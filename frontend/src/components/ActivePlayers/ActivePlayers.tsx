import { type Component, createResource, createSignal } from 'solid-js'
import { request } from '../../utils/request'

interface ActivePlayer {
  firstname: string
  lastname: string
  patronymic: string
  isPlaying: boolean
  id: number
}
const fetchActivePlayers = async (): Promise<ActivePlayer[]> => {
  return await request<ActivePlayer[]>(
    '/users/active',
    'get',
    false
  )
}

const ActivePlayers: Component = () => {
  // const [activePlayers, { mutateActivePlayers, refetchActivePlayers }] = createResource(fetchActivePlayers)

  // console.log(activePlayers)

  return (
    <div>
      Здарова лох
    </div>
  )
}

export default ActivePlayers
