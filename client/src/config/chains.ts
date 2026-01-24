/**
 * Configuración Multi-Cadena para MexiSwap
 * Soporta: Polygon, BNB Chain, Ethereum, Avalanche, Solana
 */

export interface ChainConfig {
  id: number;
  name: string;
  shortName: string;
  symbol: string;
  logo: string;
  color: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    dai: string;
    router: string;
    perpetuals: string;
    factory: string;
    masterChef: string;
    launchpad: string;
    governance: string;
  };
  bridges: {
    dai: string;
    mexi: string;
  };
  isTestnet: boolean;
  gasMultiplier: number;
}

// Logos de cadenas
export const CHAIN_LOGOS: Record<string, string> = {
  polygon: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  bsc: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  ethereum: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  avalanche: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  solana: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  arbitrum: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
};

export const CHAINS: Record<string, ChainConfig> = {
  polygon: {
    id: 137,
    name: "Polygon",
    shortName: "MATIC",
    symbol: "MATIC",
    logo: CHAIN_LOGOS.polygon,
    color: "#8247E5",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    contracts: {
      dai: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023D60d76546",
      router: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      perpetuals: "0x0000000000000000000000000000000000000001",
      factory: "0x0000000000000000000000000000000000000002",
      masterChef: "0x0000000000000000000000000000000000000003",
      launchpad: "0x0000000000000000000000000000000000000004",
      governance: "0x0000000000000000000000000000000000000005",
    },
    bridges: {
      dai: "0x0000000000000000000000000000000000000006",
      mexi: "0x0000000000000000000000000000000000000007",
    },
    isTestnet: false,
    gasMultiplier: 1.1,
  },

  bsc: {
    id: 56,
    name: "BNB Chain",
    shortName: "BSC",
    symbol: "BNB",
    logo: CHAIN_LOGOS.bsc,
    color: "#F0B90B",
    rpcUrl: "https://bsc-dataseed1.binance.org",
    blockExplorer: "https://bscscan.com",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    contracts: {
      dai: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
      router: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      perpetuals: "0x0000000000000000000000000000000000000008",
      factory: "0x0000000000000000000000000000000000000009",
      masterChef: "0x000000000000000000000000000000000000000a",
      launchpad: "0x000000000000000000000000000000000000000b",
      governance: "0x000000000000000000000000000000000000000c",
    },
    bridges: {
      dai: "0x000000000000000000000000000000000000000d",
      mexi: "0x000000000000000000000000000000000000000e",
    },
    isTestnet: false,
    gasMultiplier: 1.0,
  },

  ethereum: {
    id: 1,
    name: "Ethereum",
    shortName: "ETH",
    symbol: "ETH",
    logo: CHAIN_LOGOS.ethereum,
    color: "#627EEA",
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    contracts: {
      dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      router: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      perpetuals: "0x000000000000000000000000000000000000000f",
      factory: "0x0000000000000000000000000000000000000010",
      masterChef: "0x0000000000000000000000000000000000000011",
      launchpad: "0x0000000000000000000000000000000000000012",
      governance: "0x0000000000000000000000000000000000000013",
    },
    bridges: {
      dai: "0x0000000000000000000000000000000000000014",
      mexi: "0x0000000000000000000000000000000000000015",
    },
    isTestnet: false,
    gasMultiplier: 1.2,
  },

  avalanche: {
    id: 43114,
    name: "Avalanche",
    shortName: "AVAX",
    symbol: "AVAX",
    logo: CHAIN_LOGOS.avalanche,
    color: "#E84142",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    blockExplorer: "https://snowtrace.io",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
    contracts: {
      dai: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
      router: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      perpetuals: "0x0000000000000000000000000000000000000016",
      factory: "0x0000000000000000000000000000000000000017",
      masterChef: "0x0000000000000000000000000000000000000018",
      launchpad: "0x0000000000000000000000000000000000000019",
      governance: "0x000000000000000000000000000000000000001a",
    },
    bridges: {
      dai: "0x000000000000000000000000000000000000001b",
      mexi: "0x000000000000000000000000000000000000001c",
    },
    isTestnet: false,
    gasMultiplier: 1.1,
  },

  solana: {
    id: 900,
    name: "Solana",
    shortName: "SOL",
    symbol: "SOL",
    logo: CHAIN_LOGOS.solana,
    color: "#9945FF",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    blockExplorer: "https://solscan.io",
    nativeCurrency: {
      name: "Solana",
      symbol: "SOL",
      decimals: 9,
    },
    contracts: {
      dai: "EjmyN6qEC1Fg0UvoxqSZzsuUbCa3c4X94VQ2PRoekhH",
      router: "11111111111111111111111111111111",
      perpetuals: "11111111111111111111111111111112",
      factory: "11111111111111111111111111111113",
      masterChef: "11111111111111111111111111111114",
      launchpad: "11111111111111111111111111111115",
      governance: "11111111111111111111111111111116",
    },
    bridges: {
      dai: "11111111111111111111111111111117",
      mexi: "11111111111111111111111111111118",
    },
    isTestnet: false,
    gasMultiplier: 1.0,
  },
};

// Cadenas EVM soportadas (excluye Solana)
export const EVM_CHAINS = ["polygon", "bsc", "ethereum", "avalanche"];

export const SUPPORTED_CHAINS = Object.keys(CHAINS);

export const getChainConfig = (chainId: number): ChainConfig | undefined => {
  return Object.values(CHAINS).find((chain) => chain.id === chainId);
};

export const getChainByName = (name: string): ChainConfig | undefined => {
  return CHAINS[name.toLowerCase()];
};

export const getChainLogo = (chainId: number): string => {
  const chain = getChainConfig(chainId);
  return chain?.logo || CHAIN_LOGOS.ethereum;
};

// Configuración de DAI en cada cadena
export const DAI_CONFIG = {
  polygon: {
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023D60d76546",
    decimals: 18,
  },
  bsc: {
    address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    decimals: 18,
  },
  ethereum: {
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
  },
  avalanche: {
    address: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
    decimals: 18,
  },
  solana: {
    address: "EjmyN6qEC1Fg0UvoxqSZzsuUbCa3c4X94VQ2PRoekhH",
    decimals: 6,
  },
};

// Configuración de bridges para DAI
export const BRIDGE_CONFIG = {
  stargate: {
    name: "Stargate Finance",
    supportedChains: ["polygon", "bsc", "ethereum", "avalanche"],
  },
  wormhole: {
    name: "Wormhole",
    supportedChains: ["polygon", "bsc", "ethereum", "avalanche", "solana"],
  },
  axelar: {
    name: "Axelar",
    supportedChains: ["polygon", "bsc", "ethereum", "avalanche"],
  },
};

// Función para agregar red a MetaMask
export async function addChainToMetaMask(chainKey: string): Promise<boolean> {
  const chain = CHAINS[chainKey];
  if (!chain || !window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${chain.id.toString(16)}`,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [chain.rpcUrl],
          blockExplorerUrls: [chain.blockExplorer],
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Error adding chain to MetaMask:", error);
    return false;
  }
}

// Función para cambiar de red en MetaMask
export async function switchChain(chainId: number): Promise<boolean> {
  if (!window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    return true;
  } catch (error: any) {
    // Si la red no está agregada, intentar agregarla
    if (error.code === 4902) {
      const chainKey = Object.keys(CHAINS).find(
        (key) => CHAINS[key].id === chainId
      );
      if (chainKey) {
        return addChainToMetaMask(chainKey);
      }
    }
    console.error("Error switching chain:", error);
    return false;
  }
}
