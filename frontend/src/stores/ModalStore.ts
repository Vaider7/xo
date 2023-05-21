import { createContext, type JSX } from 'solid-js'
import { createStore } from 'solid-js/store'

export const ModalContext = createContext({}, {})

interface ModalState {
  content: null | JSX.Element
  isShow: boolean
}

export type ModalInterface = [ModalState, { setModalContent: (content: JSX.Element) => void, closeModal: () => void }]
export const ModalProvider = (): ModalInterface => {
  const [state, setState] =
    createStore<ModalState>({ content: null, isShow: false })
  return [
    state,
    {
      setModalContent (content: JSX.Element) {
        setState('content', (_) => content)
        setState('isShow', (_) => true)
      },
      closeModal () {
        setState('isShow', (_) => false)
        setTimeout(() => { setState('content', (_) => null) }, 300)
      }
    }
  ]
}
