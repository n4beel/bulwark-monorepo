'use client';

import { useDispatch } from 'react-redux';

export default function useAuthWatcher() {
  const dispatch = useDispatch();

  // useEffect(() => {
  //   const unsub = onAuthStateChanged(auth, (user) => {
  //     if (user) {
  //       dispatch(
  //         setUser({
  //           uid: user.uid,
  //           email: user.email,
  //           displayName: user.displayName,
  //           photoURL: user.photoURL,
  //         }),
  //       );
  //     } else {
  //       // dispatch(setUser(null));
  //     }
  //   });
  //   return () => unsub();
  // }, [dispatch]);
}
