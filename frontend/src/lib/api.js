import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('playbook-token')
      localStorage.removeItem('playbook-user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete apiClient.defaults.headers.common['Authorization']
  }
}

const token = localStorage.getItem('playbook-token')
if (token) {
  setAuthToken(token)
}

const api = {
  setAuthToken,
  login: async (email, password, recaptchaToken) => {
    const { data } = await apiClient.post('/auth/login', { email, password, recaptchaToken })
    return data
  },
  signup: async (name, email, password, recaptchaToken) => {
    const { data } = await apiClient.post('/auth/signup', {
      name,
      email,
      password,
      recaptchaToken,
    })
    return data
  },
  generateOtp: async () => {
    const { data } = await apiClient.post('/auth/otp/generate')
    return data
  },
  verifyOtpSetup: async (token) => {
    const { data } = await apiClient.post('/auth/otp/verify-setup', { token })
    return data
  },
  verifyOtpLogin: async (email, token) => {
    const { data } = await apiClient.post('/auth/otp/verify-login', { email, token })
    return data
  },
  getPendingUsers: async () => {
    const { data } = await apiClient.get('/superadmin/users/pending')
    return data
  },
  getAllUsers: async () => {
    const { data } = await apiClient.get('/superadmin/users/all')
    return data
  },
  approveUser: async (userId) => {
    const { data } = await apiClient.put(`/superadmin/users/approve/${userId}`)
    return data
  },
  updateUserRole: async (userId, role) => {
    const { data } = await apiClient.put(`/superadmin/users/role/${userId}`, { role })
    return data
  },
  updateUserStatus: async (userId, status) => {
    const { data } = await apiClient.put(`/superadmin/users/status/${userId}`, { status })
    return data
  },
  deleteUser: async (userId) => {
    const { data } = await apiClient.delete(`/superadmin/users/delete/${userId}`)
    return data
  },
  googleLogin: async (credential) => {
    const { data } = await apiClient.post('/auth/oauth/google', { credential })
    return data
  },
  googleOAuthLogin: async (code) => {
    const { data } = await apiClient.post('/auth/oauth/google', { code })
    return data
  },
  discordLogin: async (code) => {
    const { data } = await apiClient.post('/auth/oauth/discord', { code })
    return data
  },
}

export default api