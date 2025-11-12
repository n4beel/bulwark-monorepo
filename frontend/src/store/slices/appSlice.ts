import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isLoading: boolean;
  error: string | null;
  openGithubAuthModal: boolean;
}

const initialState: AppState = {
  isLoading: false,
  error: null,
  openGithubAuthModal: false,
};

const apppSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
    resetState: (state) => {
      state.isLoading = false;
      state.error = null;
    },

    setOpenGithubAuthModal: (state, action: PayloadAction<boolean>) => {
      state.openGithubAuthModal = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  resetState,
  setOpenGithubAuthModal,
} = apppSlice.actions;
export default apppSlice.reducer;
