/**
 * Chainlink Price Feeds Configuration
 * Direcciones oficiales de los Price Feeds de Chainlink para cada red soportada
 * 
 * Documentación: https://docs.chain.link/data-feeds/price-feeds/addresses
 */

// ABI mínimo para leer precios de Chainlink
export const CHAINLINK_AGGREGATOR_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// Tipo para los feeds de precio
export interface PriceFeed {
  symbol: string;
  name: string;
  decimals: number;
  address: {
    polygon: string;
    ethereum: string;
    bsc: string;
    avalanche: string;
    arbitrum: string;
  };
}

// Direcciones de Chainlink Price Feeds por red
export const CHAINLINK_PRICE_FEEDS: Record<string, PriceFeed> = {
  "ETH/USD": {
    symbol: "ETH/USD",
    name: "Ethereum",
    decimals: 8,
    address: {
      polygon: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
      ethereum: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      bsc: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e",
      avalanche: "0x976B3D034E162d8bD72D6b9C989d545b839003b0",
      arbitrum: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612"
    }
  },
  "BTC/USD": {
    symbol: "BTC/USD",
    name: "Bitcoin",
    decimals: 8,
    address: {
      polygon: "0xc907E116054Ad103354f2D350FD2514433D57F6f",
      ethereum: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      bsc: "0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf",
      avalanche: "0x2779D32d5166BAaa2B2b658333bA7e6Ec0C65743",
      arbitrum: "0x6ce185860a4963106506C203335A2910E0824f9A"
    }
  },
  "SOL/USD": {
    symbol: "SOL/USD",
    name: "Solana",
    decimals: 8,
    address: {
      polygon: "0x10C8264C0935b3B9870013e057f330Ff3e9C56dC",
      ethereum: "0x4ffC43a60e009B551865A93d232E33Fce9f01507",
      bsc: "0x0E8a53DD9c13589df6382F13dA6B3Ec8F919B323",
      avalanche: "0xFE6BC81a6B0c3C8e28c2F27A5b0E5E1F95F1C3C3",
      arbitrum: "0x24ceA4b8ce57cdA5058b924B9B9987992450590c"
    }
  },
  "BNB/USD": {
    symbol: "BNB/USD",
    name: "BNB",
    decimals: 8,
    address: {
      polygon: "0x82a6c4AF830caa6c97bb504425f6A66165C2c26e",
      ethereum: "0x14e613AC84a31f709eadbdF89C6CC390fDc9540A",
      bsc: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
      avalanche: "0x02D5c618DBC591544b19d0bf13543c0728A3c4Ec",
      arbitrum: "0x6970460aabF80C5BE983C6b74e5D06dEDCA95D4A"
    }
  },
  "AVAX/USD": {
    symbol: "AVAX/USD",
    name: "Avalanche",
    decimals: 8,
    address: {
      polygon: "0xe01eA2fbd8D76ee323FbEd03eB9a8625EC981A10",
      ethereum: "0xFF3EEb22B22E0b3b8d17a5B6c9d1E8f9E0F9E0F9",
      bsc: "0x5974855ce31EE8E1fff2e76591CbF83D7110F151",
      avalanche: "0x0A77230d17318075983913bC2145DB16C7366156",
      arbitrum: "0x8bf61728eeDCE2F32c456454d87B5d6eD6150208"
    }
  },
  "MATIC/USD": {
    symbol: "MATIC/USD",
    name: "Polygon",
    decimals: 8,
    address: {
      polygon: "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0",
      ethereum: "0x7bAC85A8a13A4BcD8abb3eB7d6b4d632c5a57676",
      bsc: "0x7CA57b0cA6367191c94C8914d7Df09A57655905f",
      avalanche: "0x1db18D41E4AD2403d9f52b5624031a2D9932Fd73",
      arbitrum: "0x52099D4523531f678Dfc568a7B1e5038aadcE1d6"
    }
  },
  "LINK/USD": {
    symbol: "LINK/USD",
    name: "Chainlink",
    decimals: 8,
    address: {
      polygon: "0xd9FFdb71EbE7496cC440152d43986Aae0AB76665",
      ethereum: "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c",
      bsc: "0xca236E327F629f9Fc2c30A4E95775EbF0B89fac8",
      avalanche: "0x49ccd9ca821EfEab2b98c60dC60F518E765EDa9a",
      arbitrum: "0x86E53CF1B870786351Da77A57575e79CB55812CB"
    }
  },
  "UNI/USD": {
    symbol: "UNI/USD",
    name: "Uniswap",
    decimals: 8,
    address: {
      polygon: "0xdf0Fb4e4F928d2dCB76f438575fDD8682386e13C",
      ethereum: "0x553303d460EE0afB37EdFf9bE42922D8FF63220e",
      bsc: "0xb57f259E7C24e56a1dA00F66b55A5640d9f9E7e4",
      avalanche: "0x9a1372f9b1B71B3A5a72E092AE67E172dBd7D6D6",
      arbitrum: "0x9C917083fDb403ab5ADbEC26Ee294f6EcAda2720"
    }
  },
  "AAVE/USD": {
    symbol: "AAVE/USD",
    name: "Aave",
    decimals: 8,
    address: {
      polygon: "0x72484B12719E23115761D5DA1646945632979bB6",
      ethereum: "0x547a514d5e3769680Ce22B2361c10Ea13619e8a9",
      bsc: "0xA8357BF572460fC40f4B0aCacbB2a6A61c89f475",
      avalanche: "0x3CA13391E9fb38a75330fb28f8cc2eB3D9ceceED",
      arbitrum: "0xaD1d5344AaDE45F43E596773Bcc4c423EAbdD034"
    }
  },
  "CRV/USD": {
    symbol: "CRV/USD",
    name: "Curve",
    decimals: 8,
    address: {
      polygon: "0x336584C8E6Dc19637A5b36206B1c79923111b405",
      ethereum: "0xCd627aA160A6fA45Eb793D19286F5C6E6c4A8e4a",
      bsc: "0x2e1C3b6Fcae47b20Dd343D9354F7B1140a1E6B27",
      avalanche: "0x7CF8A6090A9053B01F3DF4D4e6CfEdd8c90d9027",
      arbitrum: "0xaebDA2c976cfd1eE1977Eac079B4382acb849325"
    }
  },
  "ARB/USD": {
    symbol: "ARB/USD",
    name: "Arbitrum",
    decimals: 8,
    address: {
      polygon: "0x0000000000000000000000000000000000000000", // No disponible
      ethereum: "0x0000000000000000000000000000000000000000", // No disponible
      bsc: "0x0000000000000000000000000000000000000000", // No disponible
      avalanche: "0x0000000000000000000000000000000000000000", // No disponible
      arbitrum: "0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6"
    }
  },
  "OP/USD": {
    symbol: "OP/USD",
    name: "Optimism",
    decimals: 8,
    address: {
      polygon: "0x0000000000000000000000000000000000000000", // No disponible
      ethereum: "0x0D276FC14719f9292D5C1eA2198673d1f4269246",
      bsc: "0x0000000000000000000000000000000000000000", // No disponible
      avalanche: "0x0000000000000000000000000000000000000000", // No disponible
      arbitrum: "0x0000000000000000000000000000000000000000" // No disponible
    }
  },
  "NEAR/USD": {
    symbol: "NEAR/USD",
    name: "NEAR",
    decimals: 8,
    address: {
      polygon: "0x0000000000000000000000000000000000000000", // No disponible
      ethereum: "0xC12A6d1D827e23318266Ef16BA6F397F2F91dA9b",
      bsc: "0x0000000000000000000000000000000000000000", // No disponible
      avalanche: "0x0000000000000000000000000000000000000000", // No disponible
      arbitrum: "0x0000000000000000000000000000000000000000" // No disponible
    }
  },
  "ATOM/USD": {
    symbol: "ATOM/USD",
    name: "Cosmos",
    decimals: 8,
    address: {
      polygon: "0x0000000000000000000000000000000000000000", // No disponible
      ethereum: "0xDC4BDB458C6361093069Ca2aD30D74cc152EdC75",
      bsc: "0xb056B7C804297279A9a673289264c17E6Dc6055d",
      avalanche: "0x0000000000000000000000000000000000000000", // No disponible
      arbitrum: "0x0000000000000000000000000000000000000000" // No disponible
    }
  },
  "APT/USD": {
    symbol: "APT/USD",
    name: "Aptos",
    decimals: 8,
    address: {
      polygon: "0x0000000000000000000000000000000000000000", // No disponible
      ethereum: "0x0000000000000000000000000000000000000000", // No disponible
      bsc: "0x0000000000000000000000000000000000000000", // No disponible
      avalanche: "0x0000000000000000000000000000000000000000", // No disponible
      arbitrum: "0x0000000000000000000000000000000000000000" // No disponible
    }
  },
  "DOGE/USD": {
    symbol: "DOGE/USD",
    name: "Dogecoin",
    decimals: 8,
    address: {
      polygon: "0xbaf9327b6564454F4a3364C33eFeEf032b4b4444",
      ethereum: "0x2465CeF79c92c753a74586f80eF9C7e6e9D93f0e",
      bsc: "0x3AB0A0d137D4F946fBB19eecc6e92E64660231C8",
      avalanche: "0x0000000000000000000000000000000000000000", // No disponible
      arbitrum: "0x9A7FB1b3950837a8D9b40517626E11D4127C098C"
    }
  },
  "XRP/USD": {
    symbol: "XRP/USD",
    name: "XRP",
    decimals: 8,
    address: {
      polygon: "0x785ba89291f676b5386652eB12b30cF361020694",
      ethereum: "0xCed2660c6Dd1Ffd856A5A82C67f3482d88C50b12",
      bsc: "0x93A67D414896A280bF8FFB3b389fE3686E014fda",
      avalanche: "0x0000000000000000000000000000000000000000", // No disponible
      arbitrum: "0x0000000000000000000000000000000000000000" // No disponible
    }
  },
  "LTC/USD": {
    symbol: "LTC/USD",
    name: "Litecoin",
    decimals: 8,
    address: {
      polygon: "0xEB99F173cf7d9a6dC4D889C2Ad7103e8383b6Efa",
      ethereum: "0x6AF09DF7563C363B5763b9102712EbeD3b9e859B",
      bsc: "0x74E72F37A8c415c8f1a98Ed42E78Ff997435791D",
      avalanche: "0x0000000000000000000000000000000000000000", // No disponible
      arbitrum: "0x0000000000000000000000000000000000000000" // No disponible
    }
  },
  "GMX/USD": {
    symbol: "GMX/USD",
    name: "GMX",
    decimals: 8,
    address: {
      polygon: "0x0000000000000000000000000000000000000000", // No disponible
      ethereum: "0x0000000000000000000000000000000000000000", // No disponible
      bsc: "0x0000000000000000000000000000000000000000", // No disponible
      avalanche: "0x3F968A21647d7ca81Fb8A5b69c0A452701d5DCe9",
      arbitrum: "0xDB98056FecFff59D032aB628337A4887110df3dB"
    }
  },
  "DAI/USD": {
    symbol: "DAI/USD",
    name: "DAI",
    decimals: 8,
    address: {
      polygon: "0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D",
      ethereum: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
      bsc: "0x132d3C0B1D2cEa0BC552588063bdBb210FDeecfA",
      avalanche: "0x51D7180edA2260cc4F6e4EebB82FEF5c3c2B8300",
      arbitrum: "0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB"
    }
  }
};

// Mapeo de Chain ID a nombre de red
export const CHAIN_ID_TO_NETWORK: Record<number, keyof PriceFeed["address"]> = {
  1: "ethereum",
  137: "polygon",
  56: "bsc",
  43114: "avalanche",
  42161: "arbitrum"
};

// Función helper para obtener la dirección del feed por chain ID
export function getPriceFeedAddress(symbol: string, chainId: number): string | null {
  const feed = CHAINLINK_PRICE_FEEDS[symbol];
  if (!feed) return null;
  
  const network = CHAIN_ID_TO_NETWORK[chainId];
  if (!network) return null;
  
  const address = feed.address[network];
  if (address === "0x0000000000000000000000000000000000000000") return null;
  
  return address;
}

// Símbolos disponibles
export const AVAILABLE_SYMBOLS = Object.keys(CHAINLINK_PRICE_FEEDS);
