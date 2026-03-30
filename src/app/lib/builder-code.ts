/**
 * Base Builder Code (ERC-8021) attribution suffix.
 * Register/manage at https://base.dev > Settings > Builder Codes
 *
 * Builder Code: bc_twf524l4
 * Encoded via: Attribution.toDataSuffix({ codes: ['bc_twf524l4'] })
 */

export const BUILDER_DATA_SUFFIX = '0x62635f7477663532346c340b0080218021802180218021802180218021' as const;

/**
 * Append the Builder Code ERC-8021 dataSuffix to existing calldata.
 * Use this to attribute server-side transactions (payouts) to QrBase.
 */
export function appendBuilderSuffix(data: `0x${string}`): `0x${string}` {
    // Strip the "0x" prefix from the suffix before concatenating
    return `${data}${BUILDER_DATA_SUFFIX.slice(2)}` as `0x${string}`;
}
