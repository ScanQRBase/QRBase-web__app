import { createContext, useContext } from 'react';
import { QrBaseProviderProps } from '@/src/app/types';

const QrbaseContext = createContext(undefined);



export function QrBaseProvider({ children }: QrBaseProviderProps) {
  return (
    <QrbaseContext.Provider value={undefined}>
      {children}
    </QrbaseContext.Provider>
  );
}

export function useOnchainStoreContext() {
  return useContext(QrbaseContext);
}
