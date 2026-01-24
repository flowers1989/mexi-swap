/*
 * DESIGN: Dark Terminal Hacker
 * - Widget de swap con estilo terminal
 * - Selector de tokens con dropdown
 * - Integración Web3 para swap real
 * - Indicadores de precio y slippage
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  ArrowDownUp, 
  ChevronDown, 
  Settings,
  Info,
  Loader2,
  AlertTriangle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWeb3 } from "@/contexts/Web3Context";
import { useSwap, AVAILABLE_TOKENS, TokenInfo } from "@/hooks/useSwap";
import { toast } from "sonner";

export default function SwapWidget() {
  const { isConnected, connect, isConnecting } = useWeb3();
  const {
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
  } = useSwap();

  const [showSettings, setShowSettings] = useState(false);

  const handleTokenSelect = (token: TokenInfo, isInput: boolean) => {
    if (isInput) {
      if (token.symbol === tokenOut.symbol) {
        swapTokens();
      } else {
        setTokenIn(token);
      }
    } else {
      if (token.symbol === tokenIn.symbol) {
        swapTokens();
      } else {
        setTokenOut(token);
      }
    }
  };

  const getButtonText = () => {
    if (!isConnected) return "Conectar Wallet";
    if (isSwapping) return "Intercambiando...";
    if (isLoadingQuote) return "Calculando...";
    if (error) return error;
    if (!amountIn) return "Ingresa una cantidad";
    return "Intercambiar";
  };

  const handleButtonClick = () => {
    if (!isConnected) {
      connect();
    } else if (canSwap) {
      executeSwap();
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg">Swap</h3>
        <Popover open={showSettings} onOpenChange={setShowSettings}>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 bg-card border-border" align="end">
            <div className="space-y-4">
              <h4 className="font-semibold">Configuración</h4>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Tolerancia de Slippage
                </label>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-mono transition-colors ${
                        slippage === value
                          ? "bg-terminal-green/20 text-terminal-green border border-terminal-green/50"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <Input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                    className="w-20 text-center font-mono bg-background"
                    step="0.1"
                    min="0.1"
                    max="50"
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Tu transacción se revertirá si el precio cambia más del {slippage}%
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Token Input - Vender */}
      <div className="bg-background rounded-xl p-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Vender</span>
          <span className="text-xs text-muted-foreground font-mono">
            Balance: {tokenIn.balance}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="0.0"
            value={amountIn}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, '');
              setAmountIn(value);
            }}
            className="flex-1 bg-transparent border-none text-2xl font-mono p-0 h-auto focus-visible:ring-0"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-card/50 border-border/50 h-10">
                <img src={tokenIn.icon} alt={tokenIn.symbol} className="w-5 h-5 rounded-full" />
                <span className="font-mono">{tokenIn.symbol}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              {AVAILABLE_TOKENS.map((token) => (
                <DropdownMenuItem
                  key={token.symbol}
                  onClick={() => handleTokenSelect(token, true)}
                  className="gap-3"
                >
                  <img src={token.icon} alt={token.symbol} className="w-6 h-6 rounded-full" />
                  <div>
                    <div className="font-mono font-medium">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">
                    {token.balance}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {amountIn && tokenIn.price && (
          <div className="text-xs text-muted-foreground mt-2 font-mono">
            ≈ ${(parseFloat(amountIn) * tokenIn.price).toFixed(2)}
          </div>
        )}
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={swapTokens}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-white/5 transition-colors"
        >
          <ArrowDownUp className="w-4 h-4" />
        </button>
      </div>

      {/* Token Output - Comprar */}
      <div className="bg-background rounded-xl p-4 mt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Comprar</span>
          <span className="text-xs text-muted-foreground font-mono">
            Balance: {tokenOut.balance}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            {isLoadingQuote ? (
              <div className="flex items-center gap-2 text-2xl font-mono text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="text-2xl font-mono">
                {amountOut || "0.0"}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-card/50 border-border/50 h-10">
                <img src={tokenOut.icon} alt={tokenOut.symbol} className="w-5 h-5 rounded-full" />
                <span className="font-mono">{tokenOut.symbol}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              {AVAILABLE_TOKENS.map((token) => (
                <DropdownMenuItem
                  key={token.symbol}
                  onClick={() => handleTokenSelect(token, false)}
                  className="gap-3"
                >
                  <img src={token.icon} alt={token.symbol} className="w-6 h-6 rounded-full" />
                  <div>
                    <div className="font-mono font-medium">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground font-mono">
                    {token.balance}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {amountOut && tokenOut.price && (
          <div className="text-xs text-muted-foreground mt-2 font-mono">
            ≈ ${(parseFloat(amountOut) * tokenOut.price).toFixed(2)}
          </div>
        )}
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="mt-4 p-3 rounded-lg bg-background/50 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              Precio
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Precio de ejecución estimado</p>
                </TooltipContent>
              </Tooltip>
            </span>
            <span className="font-mono">
              1 {tokenIn.symbol} = {quote.executionPrice} {tokenOut.symbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price Impact</span>
            <span className={`font-mono ${quote.priceImpact > 3 ? "text-terminal-red" : "text-terminal-green"}`}>
              {quote.priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Mínimo recibido</span>
            <span className="font-mono">{quote.minimumReceived} {tokenOut.symbol}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Fee (0.3%)</span>
            <span className="font-mono">{quote.fee} {tokenOut.symbol}</span>
          </div>
          {quote.priceImpact > 3 && (
            <div className="flex items-center gap-2 p-2 rounded bg-terminal-red/10 text-terminal-red text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Alto price impact. Considera reducir el monto.</span>
            </div>
          )}
        </div>
      )}

      {/* Swap Button */}
      <Button
        onClick={handleButtonClick}
        disabled={isConnected && (!canSwap || isSwapping)}
        className={`w-full mt-4 h-14 text-lg font-semibold ${
          !isConnected || canSwap
            ? "bg-terminal-green hover:bg-terminal-green/90 text-black glow-green"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isSwapping || isConnecting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {getButtonText()}
          </>
        ) : (
          getButtonText()
        )}
      </Button>

      {/* Network Info */}
      {isConnected && (
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-terminal-green pulse-green" />
          <span>Conectado a Polygon Mainnet</span>
        </div>
      )}
    </div>
  );
}
