import { createContext, useContext } from 'react';
import { usePrivy } from '@privy-io/react-auth'; // Add this
import { QrBaseProviderProps } from '@/src/app/types';

const QrbaseContext = createContext(undefined);

export function QrBaseProvider({ children }: QrBaseProviderProps) {
  const privy = usePrivy(); // Expose Privy state

  return (
    <QrbaseContext.Provider value={undefined}>
      {children}
    </QrbaseContext.Provider>
  );
}

export function useOnchainStoreContext() {
  return useContext(QrbaseContext);
}