import { type Accessor, type Component, createSignal, Match, Switch } from 'solid-js'
import styles from './Auth.module.css'
import dog from '../../assets/dog.png'
import { request } from '../../utils/request'
import { type AxiosError } from 'axios'

enum UsersError {
  LoginBusy,
  UserNotFound,
  IncorrectPassword,
}

interface TokenResponse {
  accessToken: string
  tokenType: string
}

enum AuthState {
  SignIn,
  SignUp
}

const Auth: Component = () => {
  const [state, setState] = createSignal(AuthState.SignIn)
  const [login, setLogin] = createSignal('')
  const [password, setPassword] = createSignal('')

  const [newLogin, setNewLogin] = createSignal('')
  const [newPassword, setNewPassword] = createSignal('')
  const [firstname, setFirstname] = createSignal('')
  const [lastname, setLastname] = createSignal('')
  const [patronymic, setPatronymic] = createSignal('')

  const [errLogin, setErrLogin] = createSignal('')
  const [errPassword, setErrPassword] = createSignal('')

  const [errNewLogin, setErrNewLogin] = createSignal('')
  const [errNewPassword, setErrNewPassword] = createSignal('')
  const [errFirstname, setErrFirstname] = createSignal('')
  const [errLastname, setErrLastname] = createSignal('')
  const [errPatronymic, setErrPatronymic] = createSignal('')

  const checkLogin = (): boolean => {
    if (login().length < 3) {
      setErrLogin('Логин должен содержать не менее 3 символов')
      return false
    } else if (login().length > 20) {
      setErrLogin('Логин должен содержать не более 20 символов')
      return false
    } else {
      setErrLogin('')
      return true
    }
  }

  const checkPassword = (): boolean => {
    if (password().length < 6) {
      setErrPassword('Пароль должен содержать не менее 6 символов')
      return false
    } else if (password().length > 20) {
      setErrPassword('Пароль должен содержать не более 20 символов')
      return false
    } else {
      setErrPassword('')
      return true
    }
  }

  const checkNewLogin = (): boolean => {
    if (newLogin().length < 3) {
      setErrNewLogin('Логин должен содержать не менее 3 символов')
      return false
    } else if (newLogin().length > 20) {
      setErrNewLogin('Логин должен содержать не более 20 символов')
      return false
    } else {
      setErrNewLogin('')
      return true
    }
  }

  const checkNewPassword = (): boolean => {
    if (newPassword().length < 6) {
      setErrNewPassword('Пароль должен содержать не менее 6 символов')
      return false
    } else if (newPassword().length > 20) {
      setErrNewPassword('Пароль должен содержать не более 20 символов')
      return false
    } else {
      setErrNewPassword('')
      return true
    }
  }

  const checkFirstname = (): boolean => {
    if (firstname().length < 3) {
      setErrFirstname('Имя должно содержать не менее 3 символов')
      return false
    } else if (firstname().length > 20) {
      setErrFirstname('Имя должно содержать не более 20 символов')
      return false
    } else {
      setErrFirstname('')
      return true
    }
  }

  const checkLastname = (): boolean => {
    if (lastname().length < 3) {
      setErrLastname('Фамилия должна содержать не менее 3 символов')
      return false
    } else if (lastname().length > 20) {
      setErrLastname('Фамилия должно содержать не более 20 символов')
      return false
    } else {
      setErrLastname('')
      return true
    }
  }

  const checkPatronymic = (): boolean => {
    if (patronymic().length < 3) {
      setErrPatronymic('Отчество должно содержать не менее 3 символов')
      return false
    } else if (patronymic().length > 20) {
      setErrPatronymic('Отчество должно содержать не более 20 символов')
      return false
    } else {
      setErrPatronymic('')
      return true
    }
  }

  const signUpActive = (): boolean =>
    newLogin().length > 0 &&
    newPassword().length > 0 &&
    firstname().length > 0 &&
    lastname().length > 0 &&
    patronymic().length > 0

  const signInActive = (): boolean =>
    login().length > 0 &&
    password().length > 0

  const P: Component<{ err: Accessor<string> }> = (props) => {
    return (
      <p style={props.err().length > 0 ? 'display: block' : undefined}>{props.err()}</p>
    )
  }

  const checkInputErr = (elem: Accessor<string>): string | undefined => {
    if (elem().length > 0) {
      return styles.inputErr
    }

    return undefined
  }

  const checkSignIn = (): boolean => {
    return checkLogin() && checkPassword()
  }

  const checkSignUp = (): boolean => {
    return (
      checkNewLogin() &&
      checkNewPassword() &&
      checkFirstname() &&
      checkLastname() &&
      checkPatronymic()
    )
  }

  const signIn = (): void => {
    if (!checkSignIn()) {
      return
    }

    request<TokenResponse>(
      '/users/login',
      'post',
      false,
      {
        login: login(),
        password: password()
      })
      .then((value) => {
        const {
          accessToken,
          tokenType
        } = value
        window.localStorage.setItem('token', `${tokenType} ${accessToken}`)
        window.location.pathname = '/'
      })
      .catch((err: AxiosError) => {
        if (err.response !== undefined) {
          if (err.response.status === 666) {
            if (err.response.data === UsersError.UserNotFound) {
              setErrLogin('Неверный логин')
            } else if (err.response.data === UsersError.IncorrectPassword) {
              setErrPassword('Неверный пароль')
            }
          }
        }
      })
  }

  const signUp = (): void => {
    if (!checkSignUp()) {
      return
    }

    request<TokenResponse>(
      '/users/create',
      'post',
      false,
      {
        login: newLogin(),
        password: newPassword(),
        firstname: firstname(),
        lastname: lastname(),
        patronymic: patronymic()
      })
      .then((value) => {
        const {
          accessToken,
          tokenType
        } = value
        window.localStorage.setItem('token', `${tokenType} ${accessToken}`)
        window.location.pathname = '/'
      })
      .catch((err: AxiosError) => {
        if (err.response !== undefined) {
          if (err.response.status === 666) {
            if (err.response.data === UsersError.LoginBusy) {
              setErrNewLogin('Логин занят')
            }
          }
        }
      })
  }

  return (
      <div class={styles.container}>
        <Switch>
          <Match when={state() === AuthState.SignIn}>
            <div>
              <img src={dog} alt={''}/>
              <p>Войдите в игру</p>
              <div class={styles.inputGroup}>
                <div>
                  <input
                    class={checkInputErr(errLogin)}
                    onFocusOut={() => checkLogin()}
                    placeholder={'Логин'}
                    value={login()}
                    onInput={(event) => setLogin(event.target.value)}
                  />
                  <P err={errLogin}/>
                </div>
                <div>
                  <input
                    class={checkInputErr(errPassword)}
                    onFocusOut={() => checkPassword()}
                    placeholder={'Пароль'}
                    type={'password'}
                    value={password()}
                    onInput={(event) => setPassword(event.target.value)}
                  />
                  <P err={errPassword}/>
                </div>
              </div>
              <button class={signInActive() ? styles.active : undefined} onClick={signIn}>Войти</button>
              <span onClick={() => setState(AuthState.SignUp)}>Зарегистрироваться</span>
            </div>
          </Match>
          <Match when={state() === AuthState.SignUp}>
            <div>
              <img src={dog} alt={''}/>
              <p>Регистрация</p>
              <div class={styles.inputGroup}>
                <div>
                  <input
                    class={checkInputErr(errNewLogin)}
                    onFocusOut={() => {
                      checkNewLogin()
                    }}
                    placeholder={'Логин'}
                    value={newLogin()}
                    onInput={(event) => setNewLogin(event.target.value)}
                  />
                  <P err={errNewLogin}/>
                </div>
                <div>
                  <input
                    class={checkInputErr(errNewPassword)}
                    onFocusOut={() => {
                      checkNewPassword()
                    }}
                    placeholder={'Пароль'}
                    type={'password'}
                    value={newPassword()}
                    onInput={(event) => setNewPassword(event.target.value)}
                  />
                  <P err={errNewPassword}/>
                </div>
                <div>
                  <input
                    class={checkInputErr(errFirstname)}
                    onFocusOut={() => {
                      checkFirstname()
                    }}
                    placeholder={'Имя'}
                    value={firstname()}
                    onInput={(event) => setFirstname(event.target.value)}
                  />
                  <P err={errFirstname}/>
                </div>
                <div>
                  <input
                    class={checkInputErr(errLastname)}
                    onFocusOut={() => {
                      checkLastname()
                    }}
                    placeholder={'Фамилия'}
                    value={lastname()}
                    onInput={(event) => setLastname(event.target.value)}
                  />
                  <P err={errLastname}/>
                </div>
                <div>
                  <input
                    class={checkInputErr(errPatronymic)}
                    onFocusOut={() => {
                      checkPatronymic()
                    }}
                    placeholder={'Отчество'}
                    value={patronymic()}
                    onInput={(event) => setPatronymic(event.target.value)}
                  />
                  <P err={errPatronymic}/>
                </div>
              </div>
              <button class={signUpActive() ? styles.active : undefined} onClick={() => {
                signUp()
              }}>Зарегистрироваться
              </button>
              <span onClick={() => setState(AuthState.SignIn)}>Войти</span>
            </div>
          </Match>
        </Switch>
      </div>
  )
}

export default Auth
