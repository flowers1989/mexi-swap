/*
 * Hook useSwap - Lógica de intercambio de tokens
 * Maneja cotizaciones, slippage y ejecución de swaps
 */

import { useState, useCallback, useEffect } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { toast } from "sonner";

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  balance: string;
  icon: string;
  price?: number;
}

// Tokens disponibles en MexiSwap
export const AVAILABLE_TOKENS: TokenInfo[] = [
  {
    symbol: "MATIC",
    name: "Polygon",
    address: "0x0000000000000000000000000000000000001010",
    decimals: 18,
    balance: "125.42",
    icon: "/images/polygon-network.png",
    price: 1.24,
  },
  {
    symbol: "MEXI",
    name: "MexiSwap Token",
    address: "0x1234567890ABCDEF1234567890ABCDEF12345678",
    decimals: 18,
    balance: "10,000",
    icon: "/images/token-mexi.png",
    price: 0.0847,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    decimals: 6,
    balance: "1,250.00",
    icon: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=40&h=40&fit=crop",
    price: 1.0,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    decimals: 18,
    balance: "0.85",
    icon: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=40&h=40&fit=crop",
    price: 3842,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    decimals: 8,
    balance: "0.025",
    icon: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=40&h=40&fit=crop",
    price: 98500,
  },
];

interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  minimumReceived: string;
  fee: string;
  route: string[];
  executionPrice: string;
}

interface UseSwapReturn {
  // Tokens seleccionados
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  setTokenIn: (token: TokenInfo) => void;
  setTokenOut: (token: TokenInfo) => void;
  
  // Cantidades
  amountIn: string;
  amountOut: string;
  setAmountIn: (amount: string) => void;
  
  // Quote y estado
  quote: SwapQuote | null;
  isLoadingQuote: boolean;
  isSwapping: boolean;
  
  // Configuración
  slippage: number;
  setSlippage: (slippage: number) => void;
  
  // Acciones
  swapTokens: () => void;
  executeSwap: () => Promise<void>;
  
  // Validación
  error: string | null;
  canSwap: boolean;
}

export function useSwap(): UseSwapReturn {
  const { isConnected, isCorrectNetwork, address } = useWeb3();
  
  // Estado de tokens
  const [tokenIn, setTokenIn] = useState<TokenInfo>(AVAILABLE_TOKENS[0]); // MATIC
  const [tokenOut, setTokenOut] = useState<TokenInfo>(AVAILABLE_TOKENS[1]); // MEXI
  
  // Estado de cantidades
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");
  
  // Estado de quote
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  
  // Estado de swap
  const [isSwapping, setIsSwapping] = useState(false);
  
  // Configuración
  const [slippage, setSlippage] = useState(0.5); // 0.5%
  
  // Error
  const [error, setError] = useState<string | null>(null);

  // Calcular quote cuando cambia el input
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) === 0) {
      setAmountOut("");
      setQuote(null);
      return;
    }

    const calculateQuote = async () => {
      setIsLoadingQuote(true);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const inputValue = parseFloat(amountIn);
      const inputUSD = inputValue * (tokenIn.price || 0);
      const outputValue = inputUSD / (tokenOut.price || 1);
      
      // Aplicar fee del 0.3%
      const feeAmount = outputValue * 0.003;
      const outputAfterFee = outputValue - feeAmount;
      
      // Calcular price impact (simulado basado en tamaño)
      const priceImpact = Math.min(inputUSD / 100000 * 0.5, 5); // Max 5%
      
      // Calcular mínimo recibido con slippage
      const minReceived = outputAfterFee * (1 - slippage / 100);
      
      const newQuote: SwapQuote = {
        inputAmount: amountIn,
        outputAmount: outputAfterFee.toFixed(6),
        priceImpact,
        minimumReceived: minReceived.toFixed(6),
        fee: feeAmount.toFixed(6),
        route: [tokenIn.symbol, tokenOut.symbol],
        executionPrice: (outputAfterFee / inputValue).toFixed(6),
      };
      
      setQuote(newQuote);
      setAmountOut(outputAfterFee.toFixed(6));
      setIsLoadingQuote(false);
    };

    const debounce = setTimeout(calculateQuote, 300);
    return () => clearTimeout(debounce);
  }, [amountIn, tokenIn, tokenOut, slippage]);

  // Validar swap
  useEffect(() => {
    if (!isConnected) {
      setError("Conecta tu wallet");
      return;
    }
    
    if (!isCorrectNetwork) {
      setError("Cambia a Polygon");
      return;
    }
    
    if (!amountIn || parseFloat(amountIn) === 0) {
      setError("Ingresa una cantidad");
      return;
    }
    
    const balance = parseFloat(tokenIn.balance.replace(/,/g, ""));
    if (parseFloat(amountIn) > balance) {
      setError("Balance insuficiente");
      return;
    }
    
    if (quote && quote.priceImpact > 5) {
      setError("Price impact muy alto");
      return;
    }
    
    setError(null);
  }, [isConnected, isCorrectNetwork, amountIn, tokenIn, quote]);

  // Intercambiar tokens (swap posiciones)
  const swapTokens = useCallback(() => {
    const tempToken = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn(amountOut);
  }, [tokenIn, tokenOut, amountOut]);

  // Ejecutar swap
  const executeSwap = useCallback(async () => {
    if (!quote || error) return;
    
    setIsSwapping(true);
    
    try {
      // Simular transacción
      toast.info("Confirmando transacción...", {
        description: "Aprueba la transacción en tu wallet",
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("¡Swap exitoso!", {
        description: `Intercambiaste ${amountIn} ${tokenIn.symbol} por ${amountOut} ${tokenOut.symbol}`,
      });
      
      // Limpiar estado
      setAmountIn("");
      setAmountOut("");
      setQuote(null);
      
    } catch (err) {
      toast.error("Error en el swap", {
        description: "La transacción fue rechazada o falló",
      });
    } finally {
      setIsSwapping(false);
    }
  }, [quote, error, amountIn, amountOut, tokenIn, tokenOut]);

  const canSwap = !error && !!quote && !isSwapping && !isLoadingQuote;

  return {
    tokenIn,
    tokenOut,
    setTokenIn,
    setTokenOut,
    amountIn,
    amountOut,
    setAmountIn,
    quote,
    isLoadingQuote,
    isSwapping,
    slippage,
    setSlippage,
    swapTokens,
    executeSwap,
    error,
    canSwap,
  };
}
