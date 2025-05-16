import type { ReactNode , CSSProperties } from 'react';


export type BuyButton = {
  type: any;
  onSuccess: () => void;
};

export interface TokenData {
  priceInUsd: string;
  volumeUsd: string;
  maxMarketCap:string;
}

export interface PieceState {
  image: string;
  link?: string;
  pulse?: boolean;
  reached?: boolean;
}

export interface CoinDisplay  {
  balance: number | null;
  logo: string | null;
};


export interface CoinsBoughtDisplayProps {
  coins: number;
  coinLogoUrl: string;
}



export interface QrBaseQrcodeItemsProps {
  partnerData: any;
  piecesState: PieceState[];
}

export type QrBaseCoinInfoProps = {
  coinInfo: TokenData | null;
  marketCap: any;
  maxMarketCap: any;
  partnerData: any;
  isLoading: boolean;
};

export type QrBaseProviderProps = {
  children: ReactNode;
};

export interface IconProps {
  color?: string;
  size?: number;
  style?: CSSProperties;
}