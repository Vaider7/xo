/* @refresh reload */
import { render } from 'solid-js/web'

import App from './App'
import './index.css'

const root = document.getElementById('root')

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found'
  )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
render(() => <App />, root!)
