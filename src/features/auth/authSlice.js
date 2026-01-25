import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getSecureItem, setSecureItem, removeSecureItem, SECURE_KEYS } from '../../utils/secureStorage'

// Initial state - check secure storage first, then localStorage for backward compatibility
const getInitialToken = () => {
  const secureToken = getSecureItem(SECURE_KEYS.JWT_TOKEN)
  if (secureToken) return secureToken
  // Fallback to localStorage for migration
  return localStorage.getItem('access_token') || null
}

const getInitialUser = () => {
  try {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

const initialState = {
  token: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: !!getInitialToken(),
  loading: false,
  error: null,
}

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return rejectWithValue(errorData.message || 'Login failed')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState }) => {
    const { token } = getState().auth
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Logout API error:', error)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { access_token, session_id, user, uiModules } = action.payload
      state.token = access_token
      state.user = user
      state.isAuthenticated = true
      state.error = null
      
      // Store in secure storage (memory) - primary storage
      setSecureItem(SECURE_KEYS.JWT_TOKEN, access_token)
      if (session_id) {
        setSecureItem(SECURE_KEYS.SESSION_ID, session_id)
      }
      
      // Also store in localStorage for backward compatibility (non-sensitive data only)
      // Note: In production, consider removing this after migration period
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('loginResponse', JSON.stringify(action.payload))
      
      // Extract tenant/hospital IDs from token and store securely
      try {
        const base64Url = access_token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = JSON.parse(atob(base64))
        if (jsonPayload.tenant_id || jsonPayload.tenantId) {
          setSecureItem(SECURE_KEYS.TENANT_ID, jsonPayload.tenant_id || jsonPayload.tenantId)
        }
        if (jsonPayload.hospital_id || jsonPayload.hospitalId) {
          setSecureItem(SECURE_KEYS.HOSPITAL_ID, jsonPayload.hospital_id || jsonPayload.hospitalId)
        }
      } catch (error) {
        console.error('[AuthSlice] Failed to extract tenant context:', error)
      }
    },
    clearCredentials: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.error = null
      
      // Clear secure storage
      removeSecureItem(SECURE_KEYS.JWT_TOKEN)
      removeSecureItem(SECURE_KEYS.SESSION_ID)
      removeSecureItem(SECURE_KEYS.TENANT_ID)
      removeSecureItem(SECURE_KEYS.HOSPITAL_ID)
      
      // Clear localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('loginResponse')
    },
    clearError: (state) => {
      state.error = null
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        const { access_token, session_id, user, uiModules } = action.payload
        state.token = access_token
        state.user = user
        state.isAuthenticated = true
        state.error = null
        
        // Store in secure storage (memory) - primary storage
        setSecureItem(SECURE_KEYS.JWT_TOKEN, access_token)
        if (session_id) {
          setSecureItem(SECURE_KEYS.SESSION_ID, session_id)
        }
        
        // Also store in localStorage for backward compatibility
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('loginResponse', JSON.stringify(action.payload))
        
        // Extract tenant/hospital IDs from token
        try {
          const base64Url = access_token.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = JSON.parse(atob(base64))
          if (jsonPayload.tenant_id || jsonPayload.tenantId) {
            setSecureItem(SECURE_KEYS.TENANT_ID, jsonPayload.tenant_id || jsonPayload.tenantId)
          }
          if (jsonPayload.hospital_id || jsonPayload.hospitalId) {
            setSecureItem(SECURE_KEYS.HOSPITAL_ID, jsonPayload.hospital_id || jsonPayload.hospitalId)
          }
        } catch (error) {
          console.error('[AuthSlice] Failed to extract tenant context:', error)
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null
        state.user = null
        state.isAuthenticated = false
        state.error = null
        
        // Clear secure storage
        removeSecureItem(SECURE_KEYS.JWT_TOKEN)
        removeSecureItem(SECURE_KEYS.SESSION_ID)
        removeSecureItem(SECURE_KEYS.TENANT_ID)
        removeSecureItem(SECURE_KEYS.HOSPITAL_ID)
        
        // Clear localStorage
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        localStorage.removeItem('loginResponse')
      })
  },
})

export const { setCredentials, clearCredentials, clearError, setLoading } = authSlice.actions

// Selectors
export const selectToken = (state) => state.auth.token
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error

export default authSlice.reducer
