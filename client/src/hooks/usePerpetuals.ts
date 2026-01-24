/**
 * Hook para trading de perpetuos en MexiSwap
 * Apalancamiento hasta 100x | Colateral DAI | Multi-cadena
 */

import { useState, useCallback, useMemo } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { CHAINS, getChainConfig } from "@/config/chains";

// Configuración de perpetuos
export const PERPETUALS_CONFIG = {
  maxLeverage: 100,
  minLeverage: 1,
  maintenanceMargin: 0.05, // 5%
  liquidationFee: 0.005, // 0.5%
  tradingFee: 0.001, // 0.1%
  fundingInterval: 3600, // 1 hora
  collateral: "DAI",
};

// Assets disponibles para trading
export const TRADING_ASSETS = [
  { symbol: "ETH", name: "Ethereum", decimals: 18 },
  { symbol: "BTC", name: "Bitcoin", decimals: 8 },
  { symbol: "MATIC", name: "Polygon", decimals: 18 },
  { symbol: "BNB", name: "BNB", decimals: 18 },
  { symbol: "AVAX", name: "Avalanche", decimals: 18 },
  { symbol: "SOL", name: "Solana", decimals: 9 },
];

// Precios simulados (en producción usar Chainlink)
export const MOCK_PRICES: Record<string, number> = {
  ETH: 2550,
  BTC: 48250,
  MATIC: 1.25,
  BNB: 625,
  AVAX: 42,
  SOL: 125,
};

export interface Position {
  id: string;
  asset: string;
  isLong: boolean;
  collateral: number;
  size: number;
  leverage: number;
  entryPrice: number;
  liquidationPrice: number;
  pnl: number;
  fundingAccrued: number;
  timestamp: number;
  status: "active" | "liquidated" | "closed";
}

export interface MarketInfo {
  asset: string;
  price: number;
  change24h: number;
  openInterest: number;
  volume24h: number;
  fundingRate: number;
  longRatio: number;
  shortRatio: number;
}

export function usePerpetuals() {
  const { isConnected, address, chainId } = useWeb3();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener precio actual de un asset
  const getPrice = useCallback((asset: string): number => {
    return MOCK_PRICES[asset] || 0;
  }, []);

  // Calcular precio de liquidación
  const calculateLiquidationPrice = useCallback((
    entryPrice: number,
    leverage: number,
    isLong: boolean,
    maintenanceMargin: number = PERPETUALS_CONFIG.maintenanceMargin
  ): number => {
    const marginRatio = 1 / leverage;
    const liquidationThreshold = marginRatio - maintenanceMargin;
    
    if (isLong) {
      return entryPrice * (1 - liquidationThreshold);
    } else {
      return entryPrice * (1 + liquidationThreshold);
    }
  }, []);

  // Calcular P&L de una posición
  const calculatePnL = useCallback((position: Position): number => {
    const currentPrice = getPrice(position.asset.replace("/USD", ""));
    const priceDiff = currentPrice - position.entryPrice;
    const direction = position.isLong ? 1 : -1;
    
    return (priceDiff / position.entryPrice) * position.size * direction;
  }, [getPrice]);

  // Calcular tamaño de posición
  const calculatePositionSize = useCallback((
    collateral: number,
    leverage: number
  ): number => {
    return collateral * leverage;
  }, []);

  // Calcular comisión de trading
  const calculateTradingFee = useCallback((positionSize: number): number => {
    return positionSize * PERPETUALS_CONFIG.tradingFee;
  }, []);

  // Abrir posición
  const openPosition = useCallback(async (
    asset: string,
    isLong: boolean,
    collateral: number,
    leverage: number
  ): Promise<Position | null> => {
    if (!isConnected) {
      setError("Wallet no conectada");
      return null;
    }

    if (leverage < PERPETUALS_CONFIG.minLeverage || leverage > PERPETUALS_CONFIG.maxLeverage) {
      setError(`Apalancamiento debe estar entre ${PERPETUALS_CONFIG.minLeverage}x y ${PERPETUALS_CONFIG.maxLeverage}x`);
      return null;
    }

    if (collateral <= 0) {
      setError("Colateral debe ser mayor a 0");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simular transacción (en producción, llamar al contrato)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const entryPrice = getPrice(asset);
      const size = calculatePositionSize(collateral, leverage);
      const liquidationPrice = calculateLiquidationPrice(entryPrice, leverage, isLong);

      const newPosition: Position = {
        id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        asset: `${asset}/USD`,
        isLong,
        collateral,
        size,
        leverage,
        entryPrice,
        liquidationPrice,
        pnl: 0,
        fundingAccrued: 0,
        timestamp: Date.now(),
        status: "active",
      };

      setPositions(prev => [...prev, newPosition]);
      return newPosition;
    } catch (err) {
      setError("Error al abrir posición");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getPrice, calculatePositionSize, calculateLiquidationPrice]);

  // Cerrar posición
  const closePosition = useCallback(async (positionId: string): Promise<boolean> => {
    if (!isConnected) {
      setError("Wallet no conectada");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simular transacción
      await new Promise(resolve => setTimeout(resolve, 1500));

      setPositions(prev => prev.filter(p => p.id !== positionId));
      return true;
    } catch (err) {
      setError("Error al cerrar posición");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  // Actualizar P&L de todas las posiciones
  const updatePositionsPnL = useCallback(() => {
    setPositions(prev => prev.map(pos => ({
      ...pos,
      pnl: calculatePnL(pos),
    })));
  }, [calculatePnL]);

  // Obtener información del mercado
  const getMarketInfo = useCallback((asset: string): MarketInfo => {
    const price = getPrice(asset);
    
    // Datos simulados (en producción, obtener de API/contrato)
    return {
      asset,
      price,
      change24h: (Math.random() - 0.5) * 10, // -5% a +5%
      openInterest: Math.random() * 100000000, // Hasta $100M
      volume24h: Math.random() * 50000000, // Hasta $50M
      fundingRate: (Math.random() - 0.5) * 0.1, // -0.05% a +0.05%
      longRatio: 0.5 + (Math.random() - 0.5) * 0.3, // 35% a 65%
      shortRatio: 0,
    };
  }, [getPrice]);

  // Posiciones activas
  const activePositions = useMemo(() => 
    positions.filter(p => p.status === "active"),
    [positions]
  );

  // Total P&L
  const totalPnL = useMemo(() => 
    activePositions.reduce((acc, pos) => acc + calculatePnL(pos), 0),
    [activePositions, calculatePnL]
  );

  // Total colateral en uso
  const totalCollateral = useMemo(() => 
    activePositions.reduce((acc, pos) => acc + pos.collateral, 0),
    [activePositions]
  );

  return {
    // Estado
    positions,
    activePositions,
    isLoading,
    error,
    
    // Métricas
    totalPnL,
    totalCollateral,
    
    // Acciones
    openPosition,
    closePosition,
    updatePositionsPnL,
    
    // Utilidades
    getPrice,
    getMarketInfo,
    calculateLiquidationPrice,
    calculatePositionSize,
    calculateTradingFee,
    calculatePnL,
    
    // Configuración
    config: PERPETUALS_CONFIG,
    assets: TRADING_ASSETS,
  };
}

export default usePerpetuals;
