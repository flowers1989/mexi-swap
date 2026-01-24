/**
 * Hook useChainlinkPrices
 * Obtiene precios en tiempo real de Chainlink Price Feeds
 * Con fallback a datos simulados si no hay conexión Web3
 * Los precios simulados se muestran inmediatamente mientras se cargan los de Chainlink
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ethers } from "ethers";
import { 
  CHAINLINK_AGGREGATOR_ABI, 
  CHAINLINK_PRICE_FEEDS,
  getPriceFeedAddress,
  CHAIN_ID_TO_NETWORK
} from "@/config/chainlinkFeeds";

// Tipo para los datos de precio
export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  lastUpdate: number;
  source: "chainlink" | "simulated";
}

// Precios simulados como fallback - se muestran inmediatamente
const SIMULATED_PRICES: Record<string, { price: number; change24h: number }> = {
  "ETH/USD": { price: 3842.50, change24h: 2.4 },
  "BTC/USD": { price: 97500.00, change24h: 1.8 },
  "SOL/USD": { price: 198.45, change24h: 5.2 },
  "BNB/USD": { price: 715.20, change24h: -0.8 },
  "AVAX/USD": { price: 42.15, change24h: 3.1 },
  "MATIC/USD": { price: 1.24, change24h: 1.2 },
  "LINK/USD": { price: 24.50, change24h: 4.5 },
  "UNI/USD": { price: 14.20, change24h: 2.8 },
  "AAVE/USD": { price: 285.00, change24h: 1.5 },
  "GMX/USD": { price: 52.00, change24h: -1.2 },
  "CRV/USD": { price: 1.15, change24h: 0.8 },
  "ARB/USD": { price: 1.85, change24h: 3.8 },
  "OP/USD": { price: 3.80, change24h: 2.2 },
  "NEAR/USD": { price: 7.20, change24h: 4.1 },
  "ATOM/USD": { price: 12.50, change24h: 1.8 },
  "APT/USD": { price: 14.50, change24h: 2.5 },
  "DOGE/USD": { price: 0.38, change24h: -2.1 },
  "XRP/USD": { price: 2.35, change24h: 0.5 },
  "LTC/USD": { price: 108.00, change24h: 1.2 },
  "MEXI/USD": { price: 0.0847, change24h: 12.4 },
  "DAI/USD": { price: 1.00, change24h: 0.01 }
};

// Función para generar precios iniciales simulados
function getInitialPrices(symbols: string[]): Record<string, PriceData> {
  const initial: Record<string, PriceData> = {};
  symbols.forEach(symbol => {
    const simulated = SIMULATED_PRICES[symbol] || { price: 0, change24h: 0 };
    // Agregar pequeña variación aleatoria para simular movimiento
    const variation = 1 + (Math.random() - 0.5) * 0.01;
    initial[symbol] = {
      symbol,
      price: simulated.price * variation,
      change24h: simulated.change24h + (Math.random() - 0.5) * 0.5,
      lastUpdate: Date.now(),
      source: "simulated"
    };
  });
  return initial;
}

// Cache de precios para evitar llamadas excesivas
const priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const CACHE_DURATION = 10000; // 10 segundos

// RPC URLs públicos para cada red
const RPC_URLS: Record<string, string> = {
  polygon: "https://polygon-rpc.com",
  ethereum: "https://eth.llamarpc.com",
  bsc: "https://bsc-dataseed.binance.org",
  avalanche: "https://api.avax.network/ext/bc/C/rpc",
  arbitrum: "https://arb1.arbitrum.io/rpc"
};

// Función para obtener precio de un feed específico
async function fetchPriceFromChainlink(
  symbol: string,
  chainId: number
): Promise<number | null> {
  try {
    const feedAddress = getPriceFeedAddress(symbol, chainId);
    if (!feedAddress) return null;

    // Verificar cache
    const cacheKey = `${symbol}-${chainId}`;
    const cached = priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    const network = CHAIN_ID_TO_NETWORK[chainId];
    if (!network) return null;

    const rpcUrl = RPC_URLS[network];
    if (!rpcUrl) return null;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(
      feedAddress,
      CHAINLINK_AGGREGATOR_ABI,
      provider
    );

    const [, answer] = await contract.latestRoundData();
    const decimals = await contract.decimals();
    
    const price = Number(answer) / Math.pow(10, Number(decimals));
    
    // Guardar en cache
    priceCache.set(cacheKey, { price, timestamp: Date.now() });
    
    return price;
  } catch (error) {
    console.warn(`Error fetching Chainlink price for ${symbol}:`, error);
    return null;
  }
}

// Hook principal
export function useChainlinkPrices(
  symbols: string[],
  chainId: number = 137, // Polygon por defecto
  refreshInterval: number = 15000 // 15 segundos
) {
  // Inicializar con precios simulados inmediatamente
  const initialPrices = useMemo(() => getInitialPrices(symbols), [symbols.join(',')]);
  
  const [prices, setPrices] = useState<Record<string, PriceData>>(initialPrices);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousPrices = useRef<Record<string, number>>({});
  const isMounted = useRef(true);

  // Función para calcular cambio porcentual
  const calculateChange = useCallback((symbol: string, currentPrice: number): number => {
    const prevPrice = previousPrices.current[symbol];
    if (prevPrice && prevPrice !== currentPrice) {
      const change = ((currentPrice - prevPrice) / prevPrice) * 100;
      return Math.round(change * 100) / 100;
    }
    // Usar cambio simulado si no hay precio previo
    return SIMULATED_PRICES[symbol]?.change24h || 0;
  }, []);

  // Función para obtener todos los precios
  const fetchAllPrices = useCallback(async () => {
    if (!isMounted.current) return;
    
    setIsLoading(true);
    
    try {
      const newPrices: Record<string, PriceData> = {};
      
      // Procesar en paralelo pero con límite
      const results = await Promise.allSettled(
        symbols.map(async (symbol) => {
          // Intentar obtener precio de Chainlink
          const chainlinkPrice = await fetchPriceFromChainlink(symbol, chainId);
          
          if (chainlinkPrice !== null && chainlinkPrice > 0) {
            return {
              symbol,
              data: {
                symbol,
                price: chainlinkPrice,
                change24h: calculateChange(symbol, chainlinkPrice),
                lastUpdate: Date.now(),
                source: "chainlink" as const
              }
            };
          } else {
            // Fallback a precio simulado con variación aleatoria
            const simulated = SIMULATED_PRICES[symbol] || { price: 0, change24h: 0 };
            const variation = 1 + (Math.random() - 0.5) * 0.002; // ±0.1% variación
            const price = simulated.price * variation;
            
            return {
              symbol,
              data: {
                symbol,
                price,
                change24h: simulated.change24h + (Math.random() - 0.5) * 0.2,
                lastUpdate: Date.now(),
                source: "simulated" as const
              }
            };
          }
        })
      );

      // Procesar resultados
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { symbol, data } = result.value;
          newPrices[symbol] = data;
          previousPrices.current[symbol] = data.price;
        }
      });

      if (isMounted.current && Object.keys(newPrices).length > 0) {
        setPrices(newPrices);
        setLastFetch(Date.now());
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching prices:", err);
      if (isMounted.current) {
        setError("Error al obtener precios");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [symbols, chainId, calculateChange]);

  // Efecto para iniciar y manejar el polling
  useEffect(() => {
    isMounted.current = true;
    
    // Fetch inicial después de un pequeño delay para no bloquear el render
    const initialFetchTimeout = setTimeout(() => {
      fetchAllPrices();
    }, 100);

    // Configurar intervalo de actualización
    intervalRef.current = setInterval(fetchAllPrices, refreshInterval);

    return () => {
      isMounted.current = false;
      clearTimeout(initialFetchTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllPrices, refreshInterval]);

  // Función para obtener precio de un símbolo específico
  const getPrice = useCallback(
    (symbol: string): PriceData | null => {
      return prices[symbol] || null;
    },
    [prices]
  );

  // Función para forzar actualización
  const refresh = useCallback(() => {
    fetchAllPrices();
  }, [fetchAllPrices]);

  return {
    prices,
    isLoading,
    error,
    lastFetch,
    getPrice,
    refresh
  };
}

// Hook para obtener precio de un solo símbolo
export function useChainlinkPrice(
  symbol: string,
  chainId: number = 137,
  refreshInterval: number = 15000
) {
  const { prices, isLoading, error, refresh } = useChainlinkPrices(
    [symbol],
    chainId,
    refreshInterval
  );

  return {
    price: prices[symbol] || null,
    isLoading,
    error,
    refresh
  };
}

// Hook para obtener múltiples precios con formato
export function useFormattedPrices(
  symbols: string[],
  chainId: number = 137
) {
  const { prices, isLoading, error, lastFetch, refresh } = useChainlinkPrices(
    symbols,
    chainId
  );

  const formattedPrices = Object.entries(prices).reduce(
    (acc, [symbol, data]) => {
      acc[symbol] = {
        ...data,
        formattedPrice: formatPrice(data.price),
        formattedChange: formatChange(data.change24h),
        isPositive: data.change24h >= 0
      };
      return acc;
    },
    {} as Record<string, PriceData & { formattedPrice: string; formattedChange: string; isPositive: boolean }>
  );

  return {
    prices: formattedPrices,
    isLoading,
    error,
    lastFetch,
    refresh
  };
}

// Funciones de formato
function formatPrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(6)}`;
  }
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
}

export default useChainlinkPrices;
