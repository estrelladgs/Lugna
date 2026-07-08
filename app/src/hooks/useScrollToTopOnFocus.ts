import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

type Scrollable = { scrollTo: (options: { y: number; animated: boolean }) => void };

/** Resets a ScrollView to the top every time the screen gains focus. */
export function useScrollToTopOnFocus<T extends Scrollable>() {
  const ref = useRef<T>(null);
  useFocusEffect(
    useCallback(() => {
      ref.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );
  return ref;
}
