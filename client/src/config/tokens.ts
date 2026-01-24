/**
 * Configuración de tokens con logos reales
 * URLs de logos oficiales de cada criptomoneda
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  logo: string;
  decimals: number;
  coingeckoId: string;
}

// Logos oficiales de criptomonedas (usando CoinGecko CDN)
export const TOKEN_LOGOS: Record<string, string> = {
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
  UNI: "https://assets.coingecko.com/coins/images/12504/small/uniswap-logo.png",
  AAVE: "https://assets.coingecko.com/coins/images/12645/small/AAVE.png",
  GMX: "https://assets.coingecko.com/coins/images/18323/small/arbit.png",
  CRV: "https://assets.coingecko.com/coins/images/12124/small/Curve.png",
  ARB: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
  OP: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
  NEAR: "https://assets.coingecko.com/coins/images/10365/small/near.jpg",
  ATOM: "https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png",
  APT: "https://assets.coingecko.com/coins/images/26455/small/aptos_round.png",
  DOGE: "https://assets.coingecko.com/coins/images/5/small/dogecoin.png",
  XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  LTC: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
  MEXI: "/images/mexi-token.png", // Logo local del token MEXI
  DAI: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
  WBTC: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
  WETH: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
};

// Información completa de tokens
export const TOKENS: Record<string, TokenInfo> = {
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    logo: TOKEN_LOGOS.ETH,
    decimals: 18,
    coingeckoId: "ethereum"
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    logo: TOKEN_LOGOS.BTC,
    decimals: 8,
    coingeckoId: "bitcoin"
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    logo: TOKEN_LOGOS.SOL,
    decimals: 9,
    coingeckoId: "solana"
  },
  BNB: {
    symbol: "BNB",
    name: "BNB",
    logo: TOKEN_LOGOS.BNB,
    decimals: 18,
    coingeckoId: "binancecoin"
  },
  AVAX: {
    symbol: "AVAX",
    name: "Avalanche",
    logo: TOKEN_LOGOS.AVAX,
    decimals: 18,
    coingeckoId: "avalanche-2"
  },
  MATIC: {
    symbol: "MATIC",
    name: "Polygon",
    logo: TOKEN_LOGOS.MATIC,
    decimals: 18,
    coingeckoId: "matic-network"
  },
  LINK: {
    symbol: "LINK",
    name: "Chainlink",
    logo: TOKEN_LOGOS.LINK,
    decimals: 18,
    coingeckoId: "chainlink"
  },
  UNI: {
    symbol: "UNI",
    name: "Uniswap",
    logo: TOKEN_LOGOS.UNI,
    decimals: 18,
    coingeckoId: "uniswap"
  },
  AAVE: {
    symbol: "AAVE",
    name: "Aave",
    logo: TOKEN_LOGOS.AAVE,
    decimals: 18,
    coingeckoId: "aave"
  },
  GMX: {
    symbol: "GMX",
    name: "GMX",
    logo: TOKEN_LOGOS.GMX,
    decimals: 18,
    coingeckoId: "gmx"
  },
  CRV: {
    symbol: "CRV",
    name: "Curve",
    logo: TOKEN_LOGOS.CRV,
    decimals: 18,
    coingeckoId: "curve-dao-token"
  },
  ARB: {
    symbol: "ARB",
    name: "Arbitrum",
    logo: TOKEN_LOGOS.ARB,
    decimals: 18,
    coingeckoId: "arbitrum"
  },
  OP: {
    symbol: "OP",
    name: "Optimism",
    logo: TOKEN_LOGOS.OP,
    decimals: 18,
    coingeckoId: "optimism"
  },
  NEAR: {
    symbol: "NEAR",
    name: "NEAR Protocol",
    logo: TOKEN_LOGOS.NEAR,
    decimals: 24,
    coingeckoId: "near"
  },
  ATOM: {
    symbol: "ATOM",
    name: "Cosmos",
    logo: TOKEN_LOGOS.ATOM,
    decimals: 6,
    coingeckoId: "cosmos"
  },
  APT: {
    symbol: "APT",
    name: "Aptos",
    logo: TOKEN_LOGOS.APT,
    decimals: 8,
    coingeckoId: "aptos"
  },
  DOGE: {
    symbol: "DOGE",
    name: "Dogecoin",
    logo: TOKEN_LOGOS.DOGE,
    decimals: 8,
    coingeckoId: "dogecoin"
  },
  XRP: {
    symbol: "XRP",
    name: "XRP",
    logo: TOKEN_LOGOS.XRP,
    decimals: 6,
    coingeckoId: "ripple"
  },
  LTC: {
    symbol: "LTC",
    name: "Litecoin",
    logo: TOKEN_LOGOS.LTC,
    decimals: 8,
    coingeckoId: "litecoin"
  },
  MEXI: {
    symbol: "MEXI",
    name: "MexiSwap",
    logo: TOKEN_LOGOS.MEXI,
    decimals: 18,
    coingeckoId: "mexiswap"
  },
  DAI: {
    symbol: "DAI",
    name: "Dai",
    logo: TOKEN_LOGOS.DAI,
    decimals: 18,
    coingeckoId: "dai"
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    logo: TOKEN_LOGOS.USDC,
    decimals: 6,
    coingeckoId: "usd-coin"
  },
  USDT: {
    symbol: "USDT",
    name: "Tether",
    logo: TOKEN_LOGOS.USDT,
    decimals: 6,
    coingeckoId: "tether"
  }
};

// Función helper para obtener logo de un token
export function getTokenLogo(symbol: string): string {
  const cleanSymbol = symbol.split("/")[0].toUpperCase();
  return TOKEN_LOGOS[cleanSymbol] || TOKEN_LOGOS.ETH;
}

// Función helper para obtener info de un token
export function getTokenInfo(symbol: string): TokenInfo | null {
  const cleanSymbol = symbol.split("/")[0].toUpperCase();
  return TOKENS[cleanSymbol] || null;
}
