import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import plantSlice from './slices/plantSlice'
import careLogSlice from './slices/careLogSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    plants: plantSlice,
    careLogs: careLogSlice,
  },
})

export default store