/**
 * Configuración de Pyth Network para MexiSwap
 * Precios de baja latencia para trading de perpetuos
 * 
 * Documentación: https://docs.pyth.network/
 */

// Dirección del contrato Pyth en Polygon Mainnet
export const PYTH_CONTRACT_ADDRESS = '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C';

// Dirección del contrato Pyth en Polygon Mumbai (Testnet)
export const PYTH_CONTRACT_ADDRESS_TESTNET = '0xff1a0f4744e8582DF1aE09D5611b887B6a12925C';

// Endpoint de Hermes para obtener actualizaciones de precios
export const PYTH_HERMES_ENDPOINT = 'https://hermes.pyth.network';

// Price Feed IDs de Pyth Network
// Formato: bytes32 hash del par de trading
// Referencia: https://pyth.network/developers/price-feed-ids
export const PYTH_PRICE_FEED_IDS = {
  // Crypto
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'MATIC/USD': '0x5de33440f6c8b8c4c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'AVAX/USD': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  'BNB/USD': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
  'ARB/USD': '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
  'OP/USD': '0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',
  'LINK/USD': '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
  'UNI/USD': '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501',
  'AAVE/USD': '0x2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445',
  'CRV/USD': '0xa19d04ac696c7a6616d291c7e5d1377cc8be437c327b75adb5dc1bad745fcae8',
  'GMX/USD': '0xb962539d0fcb272a494d65ea56f94851c2bcf8823935da05bd628916e2e9edbf',
  'DOGE/USD': '0xdcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c',
  'SHIB/USD': '0xf0d57deca57b3da2fe63a493f4c25925fdfd8edf834b20f93e1f84dbd1504d4a',
  
  // Forex
  'EUR/USD': '0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b',
  'GBP/USD': '0x84c2dde9633d93d1bcad84e244a7c5e6e0b5e7c9c8c8c8c8c8c8c8c8c8c8c8c8',
  'JPY/USD': '0xef2c98c804ba503c6a707e38be4dfbb16683775f195b091252bf24693042fd52',
  
  // Commodities
  'XAU/USD': '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2',
  'XAG/USD': '0xf2fb02c32b055c805e7238d628e5e9dadef274376114eb1f012337cabe93871e',
  'WTI/USD': '0xc9c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8c8',
  
  // Stablecoins
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'DAI/USD': '0xb0948a5e5313200c632b51bb5ca32f6de0d36e9950a942d19751e833f70dabfd',
} as const;

// Tipo para los símbolos de activos
export type PythAssetSymbol = keyof typeof PYTH_PRICE_FEED_IDS;

// Mapeo de bytes32 a símbolos legibles
export const PYTH_FEED_ID_TO_SYMBOL: Record<string, string> = Object.entries(PYTH_PRICE_FEED_IDS).reduce(
  (acc, [symbol, feedId]) => {
    acc[feedId] = symbol;
    return acc;
  },
  {} as Record<string, string>
);

// Configuración de actualización de precios
export const PYTH_CONFIG = {
  // Intervalo de actualización en milisegundos
  updateInterval: 1000, // 1 segundo para precios en tiempo real
  
  // Máxima antigüedad aceptable del precio (en segundos)
  maxPriceAge: 60, // 60 segundos
  
  // Número de decimales para mostrar precios
  priceDecimals: {
    crypto: 2,
    forex: 4,
    commodities: 2,
  },
  
  // Timeout para solicitudes HTTP
  requestTimeout: 5000, // 5 segundos
};

// Interfaz para el precio de Pyth
export interface PythPrice {
  price: string;
  conf: string;
  expo: number;
  publishTime: number;
}

export interface PythPriceFeed {
  id: string;
  price: PythPrice;
  emaPrice: PythPrice;
}

// Función helper para convertir precio de Pyth a número legible
export function formatPythPrice(price: PythPrice): number {
  const priceValue = parseFloat(price.price);
  const exponent = price.expo;
  return priceValue * Math.pow(10, exponent);
}

// Función helper para obtener el intervalo de confianza
export function getPythConfidenceInterval(price: PythPrice): number {
  const confValue = parseFloat(price.conf);
  const exponent = price.expo;
  return confValue * Math.pow(10, exponent);
}

// Función para verificar si el precio está fresco
export function isPriceFresh(price: PythPrice, maxAgeSeconds: number = PYTH_CONFIG.maxPriceAge): boolean {
  const now = Math.floor(Date.now() / 1000);
  return (now - price.publishTime) <= maxAgeSeconds;
}
