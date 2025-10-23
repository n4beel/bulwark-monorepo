"use client";
import { configureStore } from "@reduxjs/toolkit";
import apppSlice from "./slices/appSlice";

const store = configureStore({
  reducer: {
    appp: apppSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
