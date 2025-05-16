
export const NEXT_PUBLIC_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'qrbase.xyz';
// Add your API KEY from the Coinbase Developer Portal
export const NEXT_PUBLIC_ONCHAINKIT_API_KEY =
  process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || '';
