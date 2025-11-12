// store/slices/authSlice.ts
'use client';

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthState {
  user: AuthUser | null;
  githubToken: string;
  jwtToken: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  githubToken: '',
  jwtToken: null,
  loading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.loading = false;
    },
    setTokens: (
      state,
      action: PayloadAction<{ githubToken?: string; jwtToken?: string }>,
    ) => {
      if (action.payload.githubToken) {
        state.githubToken = action.payload.githubToken;
      }
      if (action.payload.jwtToken) {
        state.jwtToken = action.payload.jwtToken;
      }
    },
    logout: (state) => {
      state.user = null;
      state.jwtToken = null;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, setTokens, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
