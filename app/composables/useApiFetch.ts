import { useApi } from './useApi';

export const useApiFetch = () => {
  const { api } = useApi()

  const apiFetch = async <T>(url: string, options?: Parameters<typeof api>[1]): Promise<T> => {
    return await api<T>(url, options)
  }

  return { apiFetch }
}