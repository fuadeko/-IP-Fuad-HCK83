import api from './api'

const authService = {
  login: (credentials) => {
    return api.post('/auth/login', credentials)
  },
  
  register: (userData) => {
    return api.post('/auth/register', userData)
  },
  
  googleLogin: (googleData) => {
    return api.post('/auth/google', googleData)
  },
}

export default authService