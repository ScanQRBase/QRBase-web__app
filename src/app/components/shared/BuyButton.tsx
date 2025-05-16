import type { BuyButton } from '@/src/app/types';
import { Buy } from '@coinbase/onchainkit/buy'; 
import type { Token } from '@coinbase/onchainkit/token';

export function BuyButton({ type, onSuccess }: BuyButton) {
  const token: Token = type;

  return (
    <Buy toToken={token} isSponsored onSuccess={onSuccess} /> 
  );
}