'use client';

import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setUser } from '@/store/slices/authSlice';

export default function useAuthWatcher() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          }),
        );
      } else {
        // dispatch(setUser(null));
      }
    });
    return () => unsub();
  }, [dispatch]);
}
