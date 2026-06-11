import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const BASE_URL = Platform.OS === 'web'
  ? 'https://siradify-api-production.up.railway.app/api'
  : 'https://siradify-api-production.up.railway.app/api'

console.log('API URL:', BASE_URL)
console.log('Platform:', Platform.OS)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api