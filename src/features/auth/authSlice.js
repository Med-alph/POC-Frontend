import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getSecureItem, setSecureItem, removeSecureItem, SECURE_KEYS } from '../../utils/secureStorage'
import { baseUrl } from '../../constants/Constant'

// Initial state - check secure storage first, then localStorage for backward compatibility
const getInitialToken = () => {
  // SOC 2: Tokens are now in httpOnly cookies, frontend doesn't manage them
  return null
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
  isAuthenticated: !!localStorage.getItem('user'), // Use existence of user as indicator
  loading: false,
  error: null,
}

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await fetch(`${baseUrl}/auth/staff/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SOC 2: Required for httpOnly cookies
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
  async (_, { dispatch }) => {
    try {
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SOC 2: Required for httpOnly cookies
      })
      dispatch(clearCredentials())
    } catch (error) {
      console.error('Logout API error:', error)
      // Still clear credentials on frontend even if backend fails
      dispatch(clearCredentials())
    }
  }
)

// Async thunk to check auth status on app load
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${baseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // SOC 2: Required for httpOnly cookies
      })

      if (!response.ok) {
        throw new Error('Session expired')
      }

      const data = await response.json()

      // Side effects belong in the thunk, not the reducer
      if (data.access_token) {
        setSecureItem(SECURE_KEYS.JWT_TOKEN, data.access_token)
      }

      return data
    } catch (error) {
      return rejectWithValue(error.message)
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

      // Store in memory for immediate use
      setSecureItem(SECURE_KEYS.JWT_TOKEN, access_token)
      if (session_id) {
        setSecureItem(SECURE_KEYS.SESSION_ID, session_id)
      }

      // SOC 2: Token is in httpOnly cookie, don't store in localStorage
      localStorage.setItem('user', JSON.stringify(user))
      if (session_id) {
        localStorage.setItem('session_id', session_id)
      }

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
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('loginResponse')
      localStorage.removeItem('session_id')
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

        // Store in localStorage for persistence across page refreshes
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('loginResponse', JSON.stringify(action.payload))
        if (session_id) {
          localStorage.setItem('session_id', session_id)
        }

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
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        const { user, access_token } = action.payload
        state.loading = false
        state.user = user
        state.token = access_token
        state.isAuthenticated = true
        state.error = null

        // localStorage sync for user profile (non-sensitive)
        localStorage.setItem('user', JSON.stringify(user))
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        localStorage.removeItem('user')
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null
        state.user = null
        state.isAuthenticated = false
        state.error = null
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
