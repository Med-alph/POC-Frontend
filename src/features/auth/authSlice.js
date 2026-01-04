import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Initial state
const initialState = {
  token: localStorage.getItem('access_token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),
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
      const { access_token, user, uiModules } = action.payload
      state.token = access_token
      state.user = user
      state.isAuthenticated = true
      state.error = null
      
      // Persist to localStorage
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('loginResponse', JSON.stringify(action.payload)) // Store complete response
    },
    clearCredentials: (state) => {
      state.token = null
      state.user = null
      state.isAuthenticated = false
      state.error = null
      
      // Clear localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('loginResponse') // Clear complete response
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
        const { access_token, user, uiModules } = action.payload
        state.token = access_token
        state.user = user
        state.isAuthenticated = true
        state.error = null
        
        // Persist to localStorage
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('loginResponse', JSON.stringify(action.payload)) // Store complete response
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
        
        // Clear localStorage
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        localStorage.removeItem('loginResponse') // Clear complete response
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
