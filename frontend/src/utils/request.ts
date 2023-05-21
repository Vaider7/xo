import axios, { type AxiosRequestConfig } from 'axios'

export const request =
  async <T>(
    url: string,
    method: 'get' | 'post' | 'delete' | 'patch' | 'put' | 'update',
    isTokenRequired: boolean,
    dataToSend?: object
  ): Promise<T> => {
    const axiosOptions: AxiosRequestConfig = {
      url,
      method,
      data: dataToSend
    }

    if (isTokenRequired) {
      const token = window.localStorage.getItem('token')

      if (token === null) {
        window.location.pathname = '/auth'
        // @ts-expect-error cause redirect
        return
      }

      axiosOptions.headers = {
        Authorization: token
      }
    }

    const { data } = await axios.request<T>(axiosOptions)

    return data
  }
