import { useEffect } from 'react'

export function useIpcSubscription<T>(subscribe: (callback: (value: T) => void) => void, onValue: (value: T) => void): void {
  useEffect(() => {
    subscribe(onValue)
  }, [subscribe, onValue])
}
