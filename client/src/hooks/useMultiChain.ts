/**
 * Hook para soporte multi-cadena en MexiSwap
 * Redes: Polygon, BNB Chain, Ethereum, Avalanche, Solana
 */

import { useState, useCallback, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { CHAINS, getChainConfig, SUPPORTED_CHAINS, type ChainConfig } from "@/config/chains";

export interface ChainStatus {
  chainKey: string;
  config: ChainConfig;
  isConnected: boolean;
  isSupported: boolean;
  daiBalance: string;
  mexiBalance: string;
}

export function useMultiChain() {
  const { isConnected, chainId, address } = useWeb3();
  
  const [currentChain, setCurrentChain] = useState<ChainConfig | null>(null);
  const [chainStatuses, setChainStatuses] = useState<ChainStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detectar cadena actual
  useEffect(() => {
    if (chainId) {
      const config = getChainConfig(chainId);
      setCurrentChain(config || null);
    } else {
      setCurrentChain(null);
    }
  }, [chainId]);

  // Verificar si la cadena actual es soportada
  const isCurrentChainSupported = useCallback((): boolean => {
    if (!chainId) return false;
    return Object.values(CHAINS).some(chain => chain.id === chainId);
  }, [chainId]);

  // Cambiar a una cadena específica
  const switchChain = useCallback(async (chainKey: string): Promise<boolean> => {
    const targetChain = CHAINS[chainKey];
    
    if (!targetChain) {
      setError(`Cadena ${chainKey} no soportada`);
      return false;
    }

    // Solana requiere wallet diferente
    if (chainKey === "solana") {
      setError("Para Solana, conecta con Phantom Wallet");
      return false;
    }

    if (!window.ethereum) {
      setError("MetaMask no detectado");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const chainIdHex = `0x${targetChain.id.toString(16)}`;

      try {
        // Intentar cambiar a la cadena
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch (switchError: any) {
        // Si la cadena no existe, agregarla
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: chainIdHex,
              chainName: targetChain.name,
              nativeCurrency: targetChain.nativeCurrency,
              rpcUrls: [targetChain.rpcUrl],
              blockExplorerUrls: [targetChain.blockExplorer],
            }],
          });
        } else {
          throw switchError;
        }
      }

      return true;
    } catch (err: any) {
      setError(err.message || "Error al cambiar de cadena");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Obtener balance de DAI en la cadena actual
  const getDaiBalance = useCallback(async (): Promise<string> => {
    if (!isConnected || !currentChain || !address) {
      return "0";
    }

    // En producción, llamar al contrato ERC20
    // Por ahora, retornar balance simulado
    return (Math.random() * 10000).toFixed(2);
  }, [isConnected, currentChain, address]);

  // Obtener balance de MEXI en la cadena actual
  const getMexiBalance = useCallback(async (): Promise<string> => {
    if (!isConnected || !currentChain || !address) {
      return "0";
    }

    // En producción, llamar al contrato ERC20
    // Por ahora, retornar balance simulado
    return (Math.random() * 50000).toFixed(2);
  }, [isConnected, currentChain, address]);

  // Obtener todas las cadenas soportadas con su estado
  const getAllChainStatuses = useCallback(async (): Promise<ChainStatus[]> => {
    const statuses: ChainStatus[] = [];

    for (const [key, config] of Object.entries(CHAINS)) {
      const isCurrentChain = chainId === config.id;
      
      statuses.push({
        chainKey: key,
        config,
        isConnected: isConnected && isCurrentChain,
        isSupported: true,
        daiBalance: isCurrentChain ? await getDaiBalance() : "0",
        mexiBalance: isCurrentChain ? await getMexiBalance() : "0",
      });
    }

    setChainStatuses(statuses);
    return statuses;
  }, [chainId, isConnected, getDaiBalance, getMexiBalance]);

  // Obtener dirección del contrato DAI para la cadena actual
  const getDaiAddress = useCallback((): string => {
    if (!currentChain) return "";
    return currentChain.contracts.dai;
  }, [currentChain]);

  // Obtener dirección del contrato de perpetuos para la cadena actual
  const getPerpetualsAddress = useCallback((): string => {
    if (!currentChain) return "";
    return currentChain.contracts.perpetuals;
  }, [currentChain]);

  // Verificar si es una cadena EVM
  const isEVMChain = useCallback((chainKey: string): boolean => {
    return chainKey !== "solana";
  }, []);

  // Obtener explorador de bloques
  const getBlockExplorerUrl = useCallback((txHash?: string): string => {
    if (!currentChain) return "";
    
    const baseUrl = currentChain.blockExplorer;
    if (txHash) {
      return `${baseUrl}/tx/${txHash}`;
    }
    return baseUrl;
  }, [currentChain]);

  // Obtener URL de dirección en explorador
  const getAddressExplorerUrl = useCallback((addr?: string): string => {
    if (!currentChain) return "";
    
    const targetAddress = addr || address;
    if (!targetAddress) return currentChain.blockExplorer;
    
    return `${currentChain.blockExplorer}/address/${targetAddress}`;
  }, [currentChain, address]);

  return {
    // Estado
    currentChain,
    chainStatuses,
    isLoading,
    error,
    
    // Verificaciones
    isCurrentChainSupported,
    isEVMChain,
    
    // Acciones
    switchChain,
    getAllChainStatuses,
    
    // Balances
    getDaiBalance,
    getMexiBalance,
    
    // Direcciones
    getDaiAddress,
    getPerpetualsAddress,
    
    // Exploradores
    getBlockExplorerUrl,
    getAddressExplorerUrl,
    
    // Datos
    supportedChains: SUPPORTED_CHAINS,
    allChains: CHAINS,
  };
}

export default useMultiChain;
