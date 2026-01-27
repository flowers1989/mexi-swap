/**
 * Hook para obtener precios en tiempo real desde Pyth Network
 * Utiliza el endpoint de Hermes para actualizaciones de baja latencia
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PYTH_HERMES_ENDPOINT,
  PYTH_PRICE_FEED_IDS,
  PYTH_CONFIG,
  PythPriceFeed,
  PythPrice,
  formatPythPrice,
  getPythConfidenceInterval,
  isPriceFresh,
  PythAssetSymbol,
} from '../config/pythFeeds';

interface PriceData {
  symbol: string;
  price: number;
  confidence: number;
  publishTime: number;
  isFresh: boolean;
  change24h?: number;
}

interface UsePythPricesReturn {
  prices: Record<string, PriceData>;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshPrices: () => Promise<void>;
  getPrice: (symbol: PythAssetSymbol) => PriceData | null;
  getPriceUpdateData: (symbols: PythAssetSymbol[]) => Promise<string[]>;
}

// Cache para almacenar precios anteriores y calcular cambios
const priceCache: Record<string, { price: number; timestamp: number }[]> = {};

export function usePythPrices(
  symbols: PythAssetSymbol[] = ['BTC/USD', 'ETH/USD', 'MATIC/USD'],
  autoRefresh: boolean = true
): UsePythPricesReturn {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Obtener los feed IDs para los símbolos solicitados
  const getFeedIds = useCallback((syms: PythAssetSymbol[]): string[] => {
    return syms
      .map(symbol => PYTH_PRICE_FEED_IDS[symbol])
      .filter(Boolean);
  }, []);

  // Fetch de precios via HTTP (polling)
  const fetchPrices = useCallback(async () => {
    try {
      const feedIds = getFeedIds(symbols);
      if (feedIds.length === 0) {
        throw new Error('No valid feed IDs found for the requested symbols');
      }

      const idsParam = feedIds.map(id => `ids[]=${id}`).join('&');
      const url = `${PYTH_HERMES_ENDPOINT}/api/latest_price_feeds?${idsParam}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(PYTH_CONFIG.requestTimeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PythPriceFeed[] = await response.json();
      
      const newPrices: Record<string, PriceData> = {};
      
      data.forEach((feed) => {
        // Encontrar el símbolo correspondiente al feed ID
        const symbol = symbols.find(
          s => PYTH_PRICE_FEED_IDS[s]?.toLowerCase() === feed.id.toLowerCase()
        );
        
        if (symbol && feed.price) {
          const price = formatPythPrice(feed.price);
          const confidence = getPythConfidenceInterval(feed.price);
          const isFresh = isPriceFresh(feed.price);
          
          // Calcular cambio 24h (simplificado, en producción usar API histórica)
          let change24h = 0;
          if (priceCache[symbol] && priceCache[symbol].length > 0) {
            const oldestPrice = priceCache[symbol][0];
            if (Date.now() - oldestPrice.timestamp >= 24 * 60 * 60 * 1000) {
              change24h = ((price - oldestPrice.price) / oldestPrice.price) * 100;
            }
          }
          
          // Actualizar cache
          if (!priceCache[symbol]) {
            priceCache[symbol] = [];
          }
          priceCache[symbol].push({ price, timestamp: Date.now() });
          // Mantener solo últimas 24h de datos
          const cutoff = Date.now() - 24 * 60 * 60 * 1000;
          priceCache[symbol] = priceCache[symbol].filter(p => p.timestamp >= cutoff);
          
          newPrices[symbol] = {
            symbol,
            price,
            confidence,
            publishTime: feed.price.publishTime,
            isFresh,
            change24h,
          };
        }
      });

      setPrices(newPrices);
      setLastUpdate(new Date());
      setError(null);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching prices';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Pyth price fetch error:', err);
    }
  }, [symbols, getFeedIds]);

  // Conectar via WebSocket para actualizaciones en tiempo real
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const feedIds = getFeedIds(symbols);
      const wsUrl = `${PYTH_HERMES_ENDPOINT.replace('https', 'wss')}/ws`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Pyth WebSocket connected');
        // Suscribirse a los feeds
        ws.send(JSON.stringify({
          type: 'subscribe',
          ids: feedIds,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'price_update' && data.price_feed) {
            const feed = data.price_feed as PythPriceFeed;
            const symbol = symbols.find(
              s => PYTH_PRICE_FEED_IDS[s]?.toLowerCase() === feed.id.toLowerCase()
            );
            
            if (symbol && feed.price) {
              const price = formatPythPrice(feed.price);
              const confidence = getPythConfidenceInterval(feed.price);
              const isFresh = isPriceFresh(feed.price);
              
              setPrices(prev => ({
                ...prev,
                [symbol]: {
                  symbol,
                  price,
                  confidence,
                  publishTime: feed.price.publishTime,
                  isFresh,
                  change24h: prev[symbol]?.change24h || 0,
                },
              }));
              setLastUpdate(new Date());
            }
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('Pyth WebSocket error:', error);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('Pyth WebSocket closed');
        // Reconectar después de un delay
        setTimeout(() => {
          if (autoRefresh) {
            connectWebSocket();
          }
        }, 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('WebSocket connection error:', err);
      // Fallback a polling si WebSocket falla
      if (autoRefresh && !intervalRef.current) {
        intervalRef.current = setInterval(fetchPrices, PYTH_CONFIG.updateInterval);
      }
    }
  }, [symbols, getFeedIds, autoRefresh, fetchPrices]);

  // Obtener datos de actualización de precios para transacciones on-chain
  const getPriceUpdateData = useCallback(async (syms: PythAssetSymbol[]): Promise<string[]> => {
    try {
      const feedIds = getFeedIds(syms);
      const idsParam = feedIds.map(id => `ids[]=${id}`).join('&');
      const url = `${PYTH_HERMES_ENDPOINT}/api/latest_vaas?${idsParam}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data; // Array de VAAs (Verified Action Approvals) en formato base64
    } catch (err) {
      console.error('Error fetching price update data:', err);
      throw err;
    }
  }, [getFeedIds]);

  // Obtener precio de un símbolo específico
  const getPrice = useCallback((symbol: PythAssetSymbol): PriceData | null => {
    return prices[symbol] || null;
  }, [prices]);

  // Efecto para iniciar la conexión
  useEffect(() => {
    // Fetch inicial
    fetchPrices();

    if (autoRefresh) {
      // Intentar WebSocket primero
      connectWebSocket();
      
      // Fallback a polling si WebSocket no está disponible
      if (!wsRef.current) {
        intervalRef.current = setInterval(fetchPrices, PYTH_CONFIG.updateInterval);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchPrices, connectWebSocket, autoRefresh]);

  return {
    prices,
    isLoading,
    error,
    lastUpdate,
    refreshPrices: fetchPrices,
    getPrice,
    getPriceUpdateData,
  };
}

// Hook simplificado para obtener un solo precio
export function usePythPrice(symbol: PythAssetSymbol): {
  price: number | null;
  isLoading: boolean;
  error: string | null;
} {
  const { prices, isLoading, error } = usePythPrices([symbol]);
  
  return {
    price: prices[symbol]?.price || null,
    isLoading,
    error,
  };
}

// Hook para obtener múltiples precios con formato específico para trading
export function useTradingPrices(symbols: PythAssetSymbol[]): {
  prices: Record<string, { bid: number; ask: number; mid: number; spread: number }>;
  isLoading: boolean;
} {
  const { prices, isLoading } = usePythPrices(symbols);
  
  const tradingPrices = Object.entries(prices).reduce((acc, [symbol, data]) => {
    // Simular bid/ask usando el intervalo de confianza
    const mid = data.price;
    const halfSpread = data.confidence;
    
    acc[symbol] = {
      bid: mid - halfSpread,
      ask: mid + halfSpread,
      mid,
      spread: (halfSpread * 2 / mid) * 100, // Spread en porcentaje
    };
    
    return acc;
  }, {} as Record<string, { bid: number; ask: number; mid: number; spread: number }>);
  
  return { prices: tradingPrices, isLoading };
}
