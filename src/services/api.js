import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:5000/api'
  : 'http://192.168.0.112:5000/api'

console.log('API URL:', BASE_URL)
console.log('Platform:', Platform.OS)

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api