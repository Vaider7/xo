import { type Component, Show, useContext } from 'solid-js'
import { ModalContext, type ModalInterface } from '../../stores/ModalStore'
import styles from './Modal.module.css'
import classNames from 'classnames'

const Modal: Component = () => {
  const [modalState] = useContext(ModalContext) as ModalInterface

  return (
      <div class={classNames(styles.container, modalState.isShow ? styles.containerShow : undefined)}>
        <div class={modalState.isShow ? styles.transition : undefined}>
          <Show when={modalState.content !== null}>
            {modalState.content}
          </Show>
        </div>
      </div>
  )
}

export default Modal
