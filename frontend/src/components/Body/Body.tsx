import type { Component, JSX } from 'solid-js'
import styles from './Body.module.css'
import logo from '../../assets/logo.svg'
import login from '../../assets/login.svg'
import { useLocation, A, useNavigate } from '@solidjs/router'

interface BodyProps {
  children: JSX.Element
}

const Body: Component<BodyProps> = (props) => {
  const { pathname } = useLocation()

  const navigate = useNavigate()
  const checkPathname = (bool: boolean): string => {
    if (bool) {
      return styles.active
    } else {
      return ''
    }
  }

  return (
    <div class={styles.body}>
      <div class={styles.header}>
        <img src={logo} alt={'ХО'} class={styles.logo}/>
        <div class={styles.links}>
          <A href = '/' class={checkPathname(pathname === '/')}>{'Игровое поле'}</A>
          <A href = '/rating' class={checkPathname(pathname === '/rating')}>{'Рейтинг'}</A>
          <A href = '/active-players' class={checkPathname(pathname === '/active-players')}>{'Активные игроки'}</A>
          <A href = '/history' class={checkPathname(pathname === '/history')}>{'История игр'}</A>
          <A href = '/players' class={checkPathname(pathname === '/players')}>{'Список игроков'}</A>
        </div>
        <img class={styles.login} src={login} alt={'Войти'} onClick={() => { navigate('/auth') }} />
      </div>
      <div class={styles.innerBody}>{props.children}</div>
    </div>
  )
}
export default Body
