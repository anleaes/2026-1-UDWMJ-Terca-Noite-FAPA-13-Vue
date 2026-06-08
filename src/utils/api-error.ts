import axios from 'axios'

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'API indisponível. Execute npm run dev:all ou npm run server em outro terminal.'
    }

    if (typeof error.response.data === 'string') {
      return error.response.data
    }

    if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      return String(error.response.data.message)
    }

    return 'Erro ao comunicar com a API.'
  }

  return 'Erro inesperado.'
}
