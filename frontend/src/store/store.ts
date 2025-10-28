"use client";
import { configureStore } from "@reduxjs/toolkit";
import appSlice from "./slices/appSlice";
import authReducer from "./slices/authSlice";

const store = configureStore({
  reducer: {
    app: appSlice,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
