import { recoverAddress } from "viem";
import { hashTypedData } from "viem";

/**
 * Extract payer wallet address from x402 payment data
 * 
 * The x-payment header can contain different formats:
 * - EIP-2612 permit signature
 * - EIP-3009 transfer authorization
 * - Direct transaction data
 */

export async function extractPayerAddress(paymentData: string | null): Promise<string | null> {
  if (!paymentData) {
    return null;
  }

  try {
    const payment = JSON.parse(paymentData);
    console.log('Parsing payment data:', JSON.stringify(payment, null, 2));

    // Try different possible locations for the payer address
    
    // 1. Direct fields
    if (payment.from) return payment.from;
    if (payment.payer) return payment.payer;
    if (payment.address) return payment.address;
    if (payment.sender) return payment.sender;
    if (payment.owner) return payment.owner;

    // 2. EIP-2612 Permit structure
    if (payment.permit) {
      if (payment.permit.owner) return payment.permit.owner;
      if (payment.permit.from) return payment.permit.from;
    }

    // 3. EIP-3009 Transfer Authorization
    if (payment.authorization) {
      if (payment.authorization.from) return payment.authorization.from;
      if (payment.authorization.owner) return payment.authorization.owner;
    }

    // 4. Transaction structure
    if (payment.transaction) {
      if (payment.transaction.from) return payment.transaction.from;
      if (payment.transaction.sender) return payment.transaction.sender;
    }

    // 5. Signature structure (recover from signature)
    if (payment.signature && payment.message) {
      // The message should contain the owner/from address
      if (payment.message.owner) return payment.message.owner;
      if (payment.message.from) return payment.message.from;
      
      // Try to recover address from signature
      try {
        console.log('Attempting to recover address from signature...');
        
        // Check if we have domain and types for EIP-712
        if (payment.domain && payment.types && payment.primaryType) {
          const hash = hashTypedData({
            domain: payment.domain,
            types: payment.types,
            primaryType: payment.primaryType,
            message: payment.message,
          });
          
          const recoveredAddress = await recoverAddress({
            hash,
            signature: payment.signature,
          });
          
          console.log('Recovered address from signature:', recoveredAddress);
          return recoveredAddress;
        }
      } catch (recoverError) {
        console.error('Failed to recover address from signature:', recoverError);
      }
    }
    
    // 6. Check for 'owner' field in message (EIP-2612 Permit)
    if (payment.message && payment.message.owner) {
      return payment.message.owner;
    }

    // 7. Check if it's a base64 encoded structure (Edge Runtime compatible)
    if (typeof payment === 'string' && payment.includes('base64')) {
      try {
        const base64Part = payment.split(',')[1];
        const decoded = atob(base64Part);
        return extractPayerAddress(decoded);
      } catch (e) {
        console.error('Failed to decode base64 payment data:', e);
      }
    }
    
    // 8. Log the full structure to help debug
    console.log('Payment data structure:', Object.keys(payment));
    console.log('Full payment object:', JSON.stringify(payment, null, 2));

    console.warn('Could not find payer address in payment data structure:', payment);
    return null;

  } catch (error) {
    console.error('Error parsing payment data:', error);
    return null;
  }
}

/**
 * Extract payer address from x402 result object
 */
export async function extractPayerFromResult(result: any): Promise<string | null> {
  if (!result) return null;

  // Check direct payer field
  if (result.payer) return result.payer;
  if (result.from) return result.from;

  // Check response body
  if (result.responseBody) {
    try {
      const body = typeof result.responseBody === 'string'
        ? JSON.parse(result.responseBody)
        : result.responseBody;
      
      if (body.payer) return body.payer;
      if (body.from) return body.from;
      if (body.address) return body.address;
    } catch (e) {
      console.error('Failed to parse response body:', e);
    }
  }

  // Check response headers for any address info
  if (result.responseHeaders) {
    const headers = result.responseHeaders;
    if (headers['x-payer']) return headers['x-payer'];
    if (headers['x-from']) return headers['x-from'];
  }

  return null;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Main function to extract and validate payer address
 */
export async function getPayerAddress(
  paymentData: string | null,
  result: any
): Promise<string> {
  // Try payment data first
  let address = await extractPayerAddress(paymentData);
  
  // If not found, try result object
  if (!address) {
    address = await extractPayerFromResult(result);
  }

  // Validate address
  if (!address) {
    throw new Error('Could not extract payer address from payment data or result');
  }

  if (!isValidAddress(address)) {
    throw new Error(`Invalid Ethereum address format: ${address}`);
  }

  return address;
}
