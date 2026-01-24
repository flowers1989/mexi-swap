/*
 * Web3 Context - Manejo de conexión con MetaMask y Polygon
 * Proporciona estado de wallet, balance y funciones de conexión
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { toast } from "sonner";

// Tipos para el contexto
interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  balance: string;
  icon: string;
}

interface Web3ContextType {
  // Estado de conexión
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  shortAddress: string | null;
  chainId: number | null;
  
  // Balances
  nativeBalance: string;
  tokens: Token[];
  
  // Funciones
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToPolygon: () => Promise<void>;
  
  // Estado de red
  isCorrectNetwork: boolean;
  networkName: string;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Configuración de Polygon
const POLYGON_CHAIN_ID = 137;
const POLYGON_CONFIG = {
  chainId: "0x89", // 137 en hex
  chainName: "Polygon Mainnet",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18,
  },
  rpcUrls: ["https://polygon-rpc.com/"],
  blockExplorerUrls: ["https://polygonscan.com/"],
};

// Tokens mock para demostración
const MOCK_TOKENS: Token[] = [
  {
    symbol: "MATIC",
    name: "Polygon",
    address: "0x0000000000000000000000000000000000001010",
    decimals: 18,
    balance: "125.42",
    icon: "/images/polygon-network.png",
  },
  {
    symbol: "MEXI",
    name: "MexiSwap Token",
    address: "0x1234567890ABCDEF1234567890ABCDEF12345678",
    decimals: 18,
    balance: "10,000",
    icon: "/images/token-mexi.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    decimals: 6,
    balance: "1,250.00",
    icon: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=40&h=40&fit=crop",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    decimals: 18,
    balance: "0.85",
    icon: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=40&h=40&fit=crop",
  },
];

export function Web3Provider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [nativeBalance, setNativeBalance] = useState("0");
  const [tokens, setTokens] = useState<Token[]>([]);

  // Verificar si hay wallet conectada al cargar
  useEffect(() => {
    checkConnection();
    
    // Escuchar cambios de cuenta y red
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
      
      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          await updateChainId();
          await updateBalances(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else {
      setAddress(accounts[0]);
      updateBalances(accounts[0]);
    }
  };

  const handleChainChanged = (chainIdHex: string) => {
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    
    if (newChainId !== POLYGON_CHAIN_ID) {
      toast.warning("Red incorrecta", {
        description: "Por favor cambia a Polygon Mainnet para usar MexiSwap",
      });
    }
  };

  const updateChainId = async () => {
    if (window.ethereum) {
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(chainIdHex, 16));
    }
  };

  const updateBalances = async (userAddress: string) => {
    // En producción, aquí se consultarían los balances reales
    // Por ahora usamos datos mock
    setNativeBalance("125.42");
    setTokens(MOCK_TOKENS);
  };

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask no detectado", {
        description: "Por favor instala MetaMask para continuar",
      });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        await updateChainId();
        await updateBalances(accounts[0]);

        // Verificar si está en Polygon
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
        const currentChainId = parseInt(chainIdHex, 16);
        
        if (currentChainId !== POLYGON_CHAIN_ID) {
          toast.info("Cambiando a Polygon...", {
            description: "Confirma el cambio de red en MetaMask",
          });
          await switchToPolygon();
        }

        toast.success("Wallet conectada", {
          description: `Conectado como ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    } catch (error: any) {
      console.error("Error connecting:", error);
      if (error.code === 4001) {
        toast.error("Conexión rechazada", {
          description: "Has rechazado la solicitud de conexión",
        });
      } else {
        toast.error("Error de conexión", {
          description: "No se pudo conectar la wallet",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setChainId(null);
    setNativeBalance("0");
    setTokens([]);
    toast.info("Wallet desconectada");
  }, []);

  const switchToPolygon = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CONFIG.chainId }],
      });
      setChainId(POLYGON_CHAIN_ID);
    } catch (error: any) {
      // Si la red no está agregada, agregarla
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [POLYGON_CONFIG],
          });
          setChainId(POLYGON_CHAIN_ID);
        } catch (addError) {
          toast.error("Error al agregar Polygon", {
            description: "No se pudo agregar la red Polygon",
          });
        }
      } else {
        toast.error("Error al cambiar de red");
      }
    }
  }, []);

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const isCorrectNetwork = chainId === POLYGON_CHAIN_ID;
  
  const networkName = chainId === POLYGON_CHAIN_ID 
    ? "Polygon" 
    : chainId === 1 
    ? "Ethereum" 
    : chainId 
    ? `Chain ${chainId}` 
    : "Desconectado";

  const value: Web3ContextType = {
    isConnected,
    isConnecting,
    address,
    shortAddress,
    chainId,
    nativeBalance,
    tokens,
    connect,
    disconnect,
    switchToPolygon,
    isCorrectNetwork,
    networkName,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

// Declaración de tipos para window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
