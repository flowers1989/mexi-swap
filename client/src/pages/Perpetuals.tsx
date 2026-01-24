/**
 * Página de Perpetuos - MexiSwap
 * DESIGN: Dark Terminal Hacker - Estilo GMX v2
 * - Fondo negro profundo (#0A0A0A)
 * - Verde terminal (#00D26A) para LONG/positivo
 * - Rojo (#FF4757) para SHORT/negativo
 * - Cyan (#00D9FF) para acentos
 * - 50 pares de trading principales
 * - Líneas de trading en gráfico (Entrada, SL, TP, Liquidación)
 * - Multi-cadena funcional (Polygon, BNB, ETH, AVAX)
 * - Validación: SL no puede pasar precio de liquidación
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Settings,
  ChevronDown,
  X,
  Target,
  AlertTriangle,
  Check,
  Zap,
  Shield,
  Wifi,
  WifiOff,
  Gift,
  Users,
  Copy,
} from "lucide-react";
import { createChart, IChartApi, ISeriesApi, LineStyle, LineSeries, CandlestickSeries } from "lightweight-charts";
import { useChainlinkPrices } from "@/hooks/useChainlinkPrices";
import { TOKEN_LOGOS, getTokenLogo } from "@/config/tokens";
import { CHAINS, CHAIN_LOGOS, switchChain } from "@/config/chains";

// 50 Mercados principales (Top 50 tokens por capitalización)
const MARKETS = [
  { symbol: "ETH/USD", name: "Ethereum", maxLeverage: 100, icon: "ETH", volume24h: 892000000, openInterest: 245000000, fundingRate: 0.0012 },
  { symbol: "BTC/USD", name: "Bitcoin", maxLeverage: 100, icon: "BTC", volume24h: 1250000000, openInterest: 520000000, fundingRate: 0.0008 },
  { symbol: "SOL/USD", name: "Solana", maxLeverage: 75, icon: "SOL", volume24h: 425000000, openInterest: 89000000, fundingRate: 0.0025 },
  { symbol: "BNB/USD", name: "BNB", maxLeverage: 75, icon: "BNB", volume24h: 185000000, openInterest: 42000000, fundingRate: -0.0005 },
  { symbol: "XRP/USD", name: "XRP", maxLeverage: 50, icon: "XRP", volume24h: 195000000, openInterest: 55000000, fundingRate: 0.0005 },
  { symbol: "ADA/USD", name: "Cardano", maxLeverage: 50, icon: "ADA", volume24h: 125000000, openInterest: 35000000, fundingRate: 0.0010 },
  { symbol: "AVAX/USD", name: "Avalanche", maxLeverage: 50, icon: "AVAX", volume24h: 95000000, openInterest: 28000000, fundingRate: 0.0015 },
  { symbol: "DOGE/USD", name: "Dogecoin", maxLeverage: 50, icon: "DOGE", volume24h: 285000000, openInterest: 65000000, fundingRate: -0.0015 },
  { symbol: "DOT/USD", name: "Polkadot", maxLeverage: 50, icon: "DOT", volume24h: 85000000, openInterest: 25000000, fundingRate: 0.0012 },
  { symbol: "MATIC/USD", name: "Polygon", maxLeverage: 50, icon: "MATIC", volume24h: 78000000, openInterest: 18000000, fundingRate: 0.0008 },
  { symbol: "LINK/USD", name: "Chainlink", maxLeverage: 50, icon: "LINK", volume24h: 156000000, openInterest: 45000000, fundingRate: 0.0018 },
  { symbol: "TRX/USD", name: "TRON", maxLeverage: 50, icon: "TRX", volume24h: 65000000, openInterest: 18000000, fundingRate: 0.0006 },
  { symbol: "SHIB/USD", name: "Shiba Inu", maxLeverage: 25, icon: "SHIB", volume24h: 145000000, openInterest: 32000000, fundingRate: -0.0020 },
  { symbol: "LTC/USD", name: "Litecoin", maxLeverage: 50, icon: "LTC", volume24h: 72000000, openInterest: 22000000, fundingRate: 0.0008 },
  { symbol: "UNI/USD", name: "Uniswap", maxLeverage: 50, icon: "UNI", volume24h: 68000000, openInterest: 22000000, fundingRate: 0.0012 },
  { symbol: "ATOM/USD", name: "Cosmos", maxLeverage: 50, icon: "ATOM", volume24h: 48000000, openInterest: 15000000, fundingRate: 0.0012 },
  { symbol: "XLM/USD", name: "Stellar", maxLeverage: 50, icon: "XLM", volume24h: 42000000, openInterest: 12000000, fundingRate: 0.0008 },
  { symbol: "BCH/USD", name: "Bitcoin Cash", maxLeverage: 50, icon: "BCH", volume24h: 55000000, openInterest: 18000000, fundingRate: 0.0010 },
  { symbol: "NEAR/USD", name: "NEAR Protocol", maxLeverage: 50, icon: "NEAR", volume24h: 52000000, openInterest: 18000000, fundingRate: 0.0018 },
  { symbol: "APT/USD", name: "Aptos", maxLeverage: 50, icon: "APT", volume24h: 38000000, openInterest: 12000000, fundingRate: 0.0014 },
  { symbol: "ICP/USD", name: "Internet Computer", maxLeverage: 50, icon: "ICP", volume24h: 35000000, openInterest: 10000000, fundingRate: 0.0015 },
  { symbol: "FIL/USD", name: "Filecoin", maxLeverage: 50, icon: "FIL", volume24h: 42000000, openInterest: 14000000, fundingRate: 0.0012 },
  { symbol: "ETC/USD", name: "Ethereum Classic", maxLeverage: 50, icon: "ETC", volume24h: 38000000, openInterest: 12000000, fundingRate: 0.0008 },
  { symbol: "HBAR/USD", name: "Hedera", maxLeverage: 50, icon: "HBAR", volume24h: 28000000, openInterest: 8000000, fundingRate: 0.0010 },
  { symbol: "VET/USD", name: "VeChain", maxLeverage: 50, icon: "VET", volume24h: 32000000, openInterest: 9000000, fundingRate: 0.0012 },
  { symbol: "ARB/USD", name: "Arbitrum", maxLeverage: 50, icon: "ARB", volume24h: 125000000, openInterest: 35000000, fundingRate: 0.0020 },
  { symbol: "OP/USD", name: "Optimism", maxLeverage: 50, icon: "OP", volume24h: 85000000, openInterest: 25000000, fundingRate: 0.0015 },
  { symbol: "MKR/USD", name: "Maker", maxLeverage: 50, icon: "MKR", volume24h: 25000000, openInterest: 8000000, fundingRate: 0.0008 },
  { symbol: "AAVE/USD", name: "Aave", maxLeverage: 50, icon: "AAVE", volume24h: 42000000, openInterest: 15000000, fundingRate: 0.0010 },
  { symbol: "GRT/USD", name: "The Graph", maxLeverage: 50, icon: "GRT", volume24h: 28000000, openInterest: 8000000, fundingRate: 0.0015 },
  { symbol: "ALGO/USD", name: "Algorand", maxLeverage: 50, icon: "ALGO", volume24h: 22000000, openInterest: 6000000, fundingRate: 0.0010 },
  { symbol: "FTM/USD", name: "Fantom", maxLeverage: 50, icon: "FTM", volume24h: 35000000, openInterest: 10000000, fundingRate: 0.0018 },
  { symbol: "SAND/USD", name: "The Sandbox", maxLeverage: 25, icon: "SAND", volume24h: 18000000, openInterest: 5000000, fundingRate: 0.0012 },
  { symbol: "MANA/USD", name: "Decentraland", maxLeverage: 25, icon: "MANA", volume24h: 15000000, openInterest: 4000000, fundingRate: 0.0010 },
  { symbol: "AXS/USD", name: "Axie Infinity", maxLeverage: 25, icon: "AXS", volume24h: 12000000, openInterest: 3500000, fundingRate: 0.0008 },
  { symbol: "THETA/USD", name: "Theta Network", maxLeverage: 50, icon: "THETA", volume24h: 18000000, openInterest: 5000000, fundingRate: 0.0012 },
  { symbol: "XTZ/USD", name: "Tezos", maxLeverage: 50, icon: "XTZ", volume24h: 15000000, openInterest: 4500000, fundingRate: 0.0010 },
  { symbol: "EOS/USD", name: "EOS", maxLeverage: 50, icon: "EOS", volume24h: 22000000, openInterest: 7000000, fundingRate: 0.0008 },
  { symbol: "FLOW/USD", name: "Flow", maxLeverage: 50, icon: "FLOW", volume24h: 12000000, openInterest: 3500000, fundingRate: 0.0012 },
  { symbol: "CRV/USD", name: "Curve", maxLeverage: 50, icon: "CRV", volume24h: 35000000, openInterest: 12000000, fundingRate: 0.0005 },
  { symbol: "LDO/USD", name: "Lido DAO", maxLeverage: 50, icon: "LDO", volume24h: 28000000, openInterest: 9000000, fundingRate: 0.0015 },
  { symbol: "SNX/USD", name: "Synthetix", maxLeverage: 50, icon: "SNX", volume24h: 18000000, openInterest: 5500000, fundingRate: 0.0012 },
  { symbol: "RUNE/USD", name: "THORChain", maxLeverage: 50, icon: "RUNE", volume24h: 22000000, openInterest: 7000000, fundingRate: 0.0018 },
  { symbol: "INJ/USD", name: "Injective", maxLeverage: 50, icon: "INJ", volume24h: 45000000, openInterest: 15000000, fundingRate: 0.0020 },
  { symbol: "SUI/USD", name: "Sui", maxLeverage: 50, icon: "SUI", volume24h: 85000000, openInterest: 28000000, fundingRate: 0.0025 },
  { symbol: "SEI/USD", name: "Sei", maxLeverage: 50, icon: "SEI", volume24h: 42000000, openInterest: 12000000, fundingRate: 0.0018 },
  { symbol: "TIA/USD", name: "Celestia", maxLeverage: 50, icon: "TIA", volume24h: 55000000, openInterest: 18000000, fundingRate: 0.0022 },
  { symbol: "GMX/USD", name: "GMX", maxLeverage: 50, icon: "GMX", volume24h: 28000000, openInterest: 8000000, fundingRate: -0.0008 },
  { symbol: "PEPE/USD", name: "Pepe", maxLeverage: 25, icon: "PEPE", volume24h: 185000000, openInterest: 42000000, fundingRate: -0.0025 },
  { symbol: "MEXI/USD", name: "MexiSwap", maxLeverage: 25, icon: "MEXI", volume24h: 8200000, openInterest: 2500000, fundingRate: 0.0035 },
];

// Cadenas soportadas para trading (TODAS FUNCIONALES)
const SUPPORTED_TRADING_CHAINS = [
  { key: "polygon", id: 137, name: "Polygon", symbol: "MATIC", logo: "https://cryptologos.cc/logos/polygon-matic-logo.png", color: "#8247E5", rpcUrl: "https://polygon-rpc.com" },
  { key: "bsc", id: 56, name: "BNB Chain", symbol: "BNB", logo: "https://cryptologos.cc/logos/bnb-bnb-logo.png", color: "#F3BA2F", rpcUrl: "https://bsc-dataseed.binance.org" },
  { key: "ethereum", id: 1, name: "Ethereum", symbol: "ETH", logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png", color: "#627EEA", rpcUrl: "https://mainnet.infura.io/v3/" },
  { key: "avalanche", id: 43114, name: "Avalanche", symbol: "AVAX", logo: "https://cryptologos.cc/logos/avalanche-avax-logo.png", color: "#E84142", rpcUrl: "https://api.avax.network/ext/bc/C/rpc" },
];

// Posiciones de ejemplo
const INITIAL_POSITIONS = [
  {
    id: 1,
    market: "ETH/USD",
    direction: "LONG" as const,
    leverage: 10,
    size: 5000,
    collateral: 500,
    entryPrice: 3780.5,
    liquidationPrice: 3420.45,
    pnl: 82.15,
    pnlPercent: 16.43,
    stopLoss: 3600,
    takeProfit: 4200,
  },
  {
    id: 2,
    market: "BTC/USD",
    direction: "SHORT" as const,
    leverage: 10,
    size: 10000,
    collateral: 1000,
    entryPrice: 98500,
    liquidationPrice: 108350,
    pnl: 101.52,
    pnlPercent: 10.15,
    stopLoss: 102000,
    takeProfit: 92000,
  },
];

// Órdenes de ejemplo
const INITIAL_ORDERS = [
  {
    id: 1,
    market: "SOL/USD",
    type: "LIMIT",
    direction: "LONG" as const,
    price: 125.0,
    size: 2000,
    leverage: 20,
  },
];

export default function Perpetuals() {
  // Estados principales
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_TRADING_CHAINS[0]);
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [collateral, setCollateral] = useState("100");
  const [leverage, setLeverage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState("1H");
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [showChainSelector, setShowChainSelector] = useState(false);
  
  // Estados para SL/TP con validación
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(true); // Mostrar por defecto
  const [slError, setSlError] = useState("");
  const [tpError, setTpError] = useState("");

  // Referencias del gráfico
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Hook de precios de Chainlink
  const symbols = useMemo(() => MARKETS.map((m) => m.symbol), []);
  const { prices, isLoading: pricesLoading, refresh: refreshPrices } = useChainlinkPrices(
    symbols,
    selectedChain.id
  );

  // Precio actual del mercado seleccionado
  const currentPrice = useMemo(() => {
    return prices[selectedMarket.symbol]?.price || 0;
  }, [prices, selectedMarket.symbol]);

  // Cálculos de posición
  const positionSize = useMemo(() => {
    const col = parseFloat(collateral) || 0;
    return col * leverage;
  }, [collateral, leverage]);

  // Precio de liquidación dinámico basado en dirección, apalancamiento y colateral
  const liquidationPrice = useMemo(() => {
    if (!currentPrice || !leverage || !collateral) return 0;
    const col = parseFloat(collateral) || 0;
    if (col <= 0) return 0;
    
    const maintenanceMargin = 0.01; // 1% margen de mantenimiento
    const liquidationThreshold = 1 / leverage - maintenanceMargin;
    
    if (direction === "LONG") {
      return currentPrice * (1 - liquidationThreshold);
    } else {
      return currentPrice * (1 + liquidationThreshold);
    }
  }, [currentPrice, leverage, direction, collateral]);

  const fee = positionSize * 0.001; // 0.1% fee

  // Validación de Stop Loss - NO puede pasar el precio de liquidación
  const validateStopLoss = useCallback((value: string) => {
    const sl = parseFloat(value);
    if (!value || isNaN(sl)) {
      setSlError("");
      return true;
    }
    
    if (direction === "LONG") {
      // Para LONG, SL debe estar por encima del precio de liquidación
      if (sl <= liquidationPrice) {
        setSlError(`SL debe ser mayor que el precio de liquidación ($${liquidationPrice.toFixed(2)})`);
        return false;
      }
      if (sl >= currentPrice) {
        setSlError("SL debe ser menor que el precio actual");
        return false;
      }
    } else {
      // Para SHORT, SL debe estar por debajo del precio de liquidación
      if (sl >= liquidationPrice) {
        setSlError(`SL debe ser menor que el precio de liquidación ($${liquidationPrice.toFixed(2)})`);
        return false;
      }
      if (sl <= currentPrice) {
        setSlError("SL debe ser mayor que el precio actual");
        return false;
      }
    }
    
    setSlError("");
    return true;
  }, [direction, liquidationPrice, currentPrice]);

  // Validación de Take Profit
  const validateTakeProfit = useCallback((value: string) => {
    const tp = parseFloat(value);
    if (!value || isNaN(tp)) {
      setTpError("");
      return true;
    }
    
    if (direction === "LONG") {
      if (tp <= currentPrice) {
        setTpError("TP debe ser mayor que el precio actual");
        return false;
      }
    } else {
      if (tp >= currentPrice) {
        setTpError("TP debe ser menor que el precio actual");
        return false;
      }
    }
    
    setTpError("");
    return true;
  }, [direction, currentPrice]);

  // Handlers para SL/TP con validación
  const handleStopLossChange = (value: string) => {
    setStopLoss(value);
    validateStopLoss(value);
  };

  const handleTakeProfitChange = (value: string) => {
    setTakeProfit(value);
    validateTakeProfit(value);
  };

  // Filtrar mercados por búsqueda
  const filteredMarkets = useMemo(() => {
    if (!searchQuery) return MARKETS;
    const query = searchQuery.toLowerCase();
    return MARKETS.filter(
      (m) =>
        m.symbol.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Indicador de fuente de precios
  const priceSourceIndicator = useMemo(() => {
    const chainlinkCount = Object.values(prices).filter(p => p.source === "chainlink").length;
    const totalCount = Object.keys(prices).length;
    return { chainlinkCount, totalCount };
  }, [prices]);

  // Cambiar de cadena
  const handleChainSwitch = async (chain: typeof SUPPORTED_TRADING_CHAINS[0]) => {
    try {
      // Intentar cambiar la red en MetaMask
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${chain.id.toString(16)}` }],
          });
        } catch (switchError: any) {
          // Si la red no existe, agregarla
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${chain.id.toString(16)}`,
                chainName: chain.name,
                nativeCurrency: {
                  name: chain.symbol,
                  symbol: chain.symbol,
                  decimals: 18,
                },
                rpcUrls: [chain.rpcUrl],
              }],
            });
          }
        }
      }
      
      setSelectedChain(chain);
      setShowChainSelector(false);
      toast.success(`Cambiado a ${chain.name}`);
    } catch (error) {
      toast.error("Error al cambiar de red");
    }
  };

  // Inicializar gráfico con líneas de trading
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Limpiar gráfico existente
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#0A0A0A" },
        textColor: "#888",
      },
      grid: {
        vertLines: { color: "#1a1a1a" },
        horzLines: { color: "#1a1a1a" },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: "#00D26A", width: 1, style: LineStyle.Dashed },
        horzLine: { color: "#00D26A", width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: "#2a2a2a",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "#2a2a2a",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    chartRef.current = chart;

    // Serie de velas
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00D26A",
      downColor: "#FF4757",
      borderUpColor: "#00D26A",
      borderDownColor: "#FF4757",
      wickUpColor: "#00D26A",
      wickDownColor: "#FF4757",
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Generar datos de velas
    const generateCandleData = () => {
      const data = [];
      const basePrice = currentPrice || 3800;
      let currentTime = Math.floor(Date.now() / 1000) - 86400;
      let lastClose = basePrice * 0.95;

      for (let i = 0; i < 100; i++) {
        const volatility = 0.02;
        const change = (Math.random() - 0.5) * volatility * lastClose;
        const open = lastClose;
        const close = open + change;
        const high = Math.max(open, close) + Math.random() * volatility * lastClose * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * lastClose * 0.5;

        data.push({
          time: currentTime as any,
          open,
          high,
          low,
          close,
        });

        lastClose = close;
        currentTime += 900;
      }
      return data;
    };

    candlestickSeries.setData(generateCandleData());

    // Agregar líneas de trading
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - 86400;

    // Línea de entrada (amarilla/dorada)
    if (currentPrice > 0) {
      const entryLine = chart.addSeries(LineSeries, {
        color: "#FFD700",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        title: "Entrada",
      });
      entryLine.setData([
        { time: startTime as any, value: currentPrice },
        { time: now as any, value: currentPrice },
      ]);
    }

    // Línea de Take Profit (verde brillante)
    const tpValue = parseFloat(takeProfit);
    if (tpValue > 0 && !tpError) {
      const tpLine = chart.addSeries(LineSeries, {
        color: "#00FF7F",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: "Take Profit",
      });
      tpLine.setData([
        { time: startTime as any, value: tpValue },
        { time: now as any, value: tpValue },
      ]);
    }

    // Línea de Stop Loss (roja)
    const slValue = parseFloat(stopLoss);
    if (slValue > 0 && !slError) {
      const slLine = chart.addSeries(LineSeries, {
        color: "#FF4757",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: "Stop Loss",
      });
      slLine.setData([
        { time: startTime as any, value: slValue },
        { time: now as any, value: slValue },
      ]);
    }

    // Línea de liquidación (naranja)
    if (liquidationPrice > 0 && parseFloat(collateral) > 0) {
      const liqLine = chart.addSeries(LineSeries, {
        color: "#FF8C00",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        title: "Liquidación",
      });
      liqLine.setData([
        { time: startTime as any, value: liquidationPrice },
        { time: now as any, value: liquidationPrice },
      ]);
    }

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [selectedMarket, currentPrice, stopLoss, takeProfit, liquidationPrice, collateral, slError, tpError]);

  // Abrir posición
  const handleOpenPosition = () => {
    if (!collateral || parseFloat(collateral) <= 0) {
      toast.error("Ingresa un monto de colateral válido");
      return;
    }

    if (slError || tpError) {
      toast.error("Corrige los errores en SL/TP antes de continuar");
      return;
    }

    const newPosition = {
      id: Date.now(),
      market: selectedMarket.symbol,
      direction,
      leverage,
      size: positionSize,
      collateral: parseFloat(collateral),
      entryPrice: currentPrice,
      liquidationPrice,
      pnl: 0,
      pnlPercent: 0,
      stopLoss: parseFloat(stopLoss) || 0,
      takeProfit: parseFloat(takeProfit) || 0,
    };

    setPositions([...positions, newPosition]);
    toast.success(`Posición ${direction} abierta en ${selectedMarket.symbol}`);
    
    // Reset form
    setCollateral("100");
    setStopLoss("");
    setTakeProfit("");
  };

  // Cerrar posición
  const handleClosePosition = (positionId: number) => {
    setPositions(positions.filter((p) => p.id !== positionId));
    toast.success("Posición cerrada");
  };

  // Cancelar orden
  const handleCancelOrder = (orderId: number) => {
    setOrders(orders.filter((o) => o.id !== orderId));
    toast.success("Orden cancelada");
  };

  // Formatear número
  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Header con estadísticas */}
      <div className="border-b border-[#1a1a1a] bg-[#0A0A0A]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold">Perpetuos</h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-400">
                  Open Interest: <span className="text-white font-mono">{formatNumber(selectedMarket.openInterest)}</span>
                </span>
                <span className="text-gray-400">
                  24h Volume: <span className="text-white font-mono">{formatNumber(selectedMarket.volume24h)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-[#00D26A]" />
                  <span className="text-gray-400">Chainlink:</span>
                  <span className="text-[#00D9FF] font-mono">{priceSourceIndicator.chainlinkCount}/{priceSourceIndicator.totalCount}</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Selector de cadena */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChainSelector(!showChainSelector)}
                  className="gap-2 border-[#2a2a2a] bg-[#111] hover:bg-[#1a1a1a]"
                  style={{ borderColor: selectedChain.color }}
                >
                  <img src={selectedChain.logo} alt={selectedChain.name} className="w-4 h-4" />
                  {selectedChain.name}
                  <ChevronDown className="w-3 h-3" />
                </Button>
                
                {showChainSelector && (
                  <div className="absolute top-full right-0 mt-2 bg-[#111] border border-[#2a2a2a] rounded-lg shadow-xl z-50 min-w-[200px]">
                    {SUPPORTED_TRADING_CHAINS.map((chain) => (
                      <button
                        key={chain.key}
                        onClick={() => handleChainSwitch(chain)}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors ${
                          selectedChain.key === chain.key ? "bg-[#1a1a1a]" : ""
                        }`}
                      >
                        <img src={chain.logo} alt={chain.name} className="w-5 h-5" />
                        <span>{chain.name}</span>
                        {selectedChain.key === chain.key && (
                          <Check className="w-4 h-4 text-[#00D26A] ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={refreshPrices}
                className="text-gray-400 hover:text-white"
                title="Actualizar precios"
              >
                <RefreshCw className={`w-4 h-4 ${pricesLoading ? "animate-spin" : ""}`} />
              </Button>

              <Link href="/migrate">
                <Button variant="outline" size="sm" className="gap-2 border-[#00D26A]/50 text-[#00D26A] hover:bg-[#00D26A]/10">
                  <Gift className="w-4 h-4" />
                  Migrar desde GMX
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Lista de mercados */}
          <div className="col-span-12 lg:col-span-2">
            <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-3 sticky top-24 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar mercado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#0A0A0A] border-[#2a2a2a] text-sm"
                />
              </div>
              
              <div className="text-xs text-gray-500 mb-2 px-1">
                {filteredMarkets.length} mercados disponibles
              </div>

              <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                {filteredMarkets.map((market) => {
                  const price = prices[market.symbol]?.price || 0;
                  const change = prices[market.symbol]?.change24h || 0;
                  const isSelected = selectedMarket.symbol === market.symbol;

                  return (
                    <button
                      key={market.symbol}
                      onClick={() => setSelectedMarket(market)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                        isSelected
                          ? "bg-[#00D26A]/10 border border-[#00D26A]/30"
                          : "hover:bg-[#1a1a1a]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={getTokenLogo(market.icon)}
                          alt={market.icon}
                          className="w-5 h-5 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${market.icon}&background=1a1a1a&color=fff&size=32`;
                          }}
                        />
                        <div className="text-left">
                          <div className="font-medium text-xs">{market.icon}</div>
                          <div className="text-[10px] text-gray-500">{market.maxLeverage}x</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-xs">${formatPrice(price)}</div>
                        <div className={`text-[10px] ${change >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}`}>
                          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfico y posiciones */}
          <div className="col-span-12 lg:col-span-7">
            {/* Header del mercado */}
            <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={getTokenLogo(selectedMarket.icon)}
                    alt={selectedMarket.icon}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${selectedMarket.icon}&background=1a1a1a&color=fff&size=40`;
                    }}
                  />
                  <div>
                    <h2 className="text-xl font-bold">{selectedMarket.symbol}</h2>
                    <p className="text-sm text-gray-400">{selectedMarket.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono">${formatPrice(currentPrice)}</div>
                  <div className={`text-sm ${(prices[selectedMarket.symbol]?.change24h || 0) >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}`}>
                    {(prices[selectedMarket.symbol]?.change24h || 0) >= 0 ? "+" : ""}
                    {(prices[selectedMarket.symbol]?.change24h || 0).toFixed(2)}%
                  </div>
                </div>
                {prices[selectedMarket.symbol]?.source === "chainlink" && (
                  <span className="px-2 py-1 bg-[#00D9FF]/10 text-[#00D9FF] text-xs rounded-full border border-[#00D9FF]/30">
                    Chainlink
                  </span>
                )}
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {["1m", "5m", "15m", "1H", "4H", "1D", "1W"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        timeframe === tf
                          ? "bg-[#00D26A] text-black font-medium"
                          : "bg-[#1a1a1a] text-gray-400 hover:text-white"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                
                {/* Leyenda de líneas */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-[#FFD700]" />
                    Entrada
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-[#00FF7F]" />
                    Take Profit
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-[#FF4757]" />
                    Stop Loss
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-[#FF8C00] opacity-50" style={{ borderStyle: 'dotted' }} />
                    Liquidación: ${liquidationPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <div ref={chartContainerRef} className="w-full" />
            </div>

            {/* Posiciones y órdenes */}
            <div className="bg-[#111] rounded-xl border border-[#1a1a1a]">
              <Tabs defaultValue="positions">
                <TabsList className="w-full justify-start border-b border-[#1a1a1a] bg-transparent rounded-none p-0">
                  <TabsTrigger
                    value="positions"
                    className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#00D26A] data-[state=active]:text-[#00D26A]"
                  >
                    Posiciones ({positions.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="orders"
                    className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#00D26A] data-[state=active]:text-[#00D26A]"
                  >
                    Órdenes ({orders.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#00D26A] data-[state=active]:text-[#00D26A]"
                  >
                    Historial
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="positions" className="p-4">
                  {positions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay posiciones abiertas
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 border-b border-[#1a1a1a]">
                            <th className="text-left py-2">Mercado</th>
                            <th className="text-left py-2">Dirección</th>
                            <th className="text-right py-2">Tamaño</th>
                            <th className="text-right py-2">Entrada</th>
                            <th className="text-right py-2">Liq. Price</th>
                            <th className="text-right py-2">SL/TP</th>
                            <th className="text-right py-2">PnL</th>
                            <th className="text-right py-2">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((pos) => (
                            <tr key={pos.id} className="border-b border-[#1a1a1a]/50">
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={getTokenLogo(pos.market.split("/")[0])}
                                    alt={pos.market}
                                    className="w-6 h-6 rounded-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${pos.market.split("/")[0]}&background=1a1a1a&color=fff&size=24`;
                                    }}
                                  />
                                  <span className="font-medium">{pos.market}</span>
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    pos.direction === "LONG"
                                      ? "bg-[#00D26A]/20 text-[#00D26A]"
                                      : "bg-[#FF4757]/20 text-[#FF4757]"
                                  }`}
                                >
                                  {pos.direction} {pos.leverage}x
                                </span>
                              </td>
                              <td className="text-right font-mono">${pos.size.toLocaleString()}</td>
                              <td className="text-right font-mono">${pos.entryPrice.toLocaleString()}</td>
                              <td className="text-right font-mono text-[#FF8C00]">${pos.liquidationPrice.toLocaleString()}</td>
                              <td className="text-right">
                                <div className="text-xs">
                                  {pos.stopLoss > 0 && (
                                    <div className="text-[#FF4757]">SL: ${pos.stopLoss.toLocaleString()}</div>
                                  )}
                                  {pos.takeProfit > 0 && (
                                    <div className="text-[#00FF7F]">TP: ${pos.takeProfit.toLocaleString()}</div>
                                  )}
                                </div>
                              </td>
                              <td className="text-right">
                                <span className={pos.pnl >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}>
                                  {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                                  <br />
                                  <span className="text-xs">({pos.pnlPercent.toFixed(2)}%)</span>
                                </span>
                              </td>
                              <td className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleClosePosition(pos.id)}
                                  className="text-[#FF4757] hover:text-[#FF4757] hover:bg-[#FF4757]/10"
                                >
                                  Cerrar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="orders" className="p-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay órdenes pendientes
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 border-b border-[#1a1a1a]">
                            <th className="text-left py-2">Mercado</th>
                            <th className="text-left py-2">Tipo</th>
                            <th className="text-right py-2">Precio</th>
                            <th className="text-right py-2">Tamaño</th>
                            <th className="text-right py-2">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.id} className="border-b border-[#1a1a1a]/50">
                              <td className="py-3 font-medium">{order.market}</td>
                              <td>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    order.direction === "LONG"
                                      ? "bg-[#00D26A]/20 text-[#00D26A]"
                                      : "bg-[#FF4757]/20 text-[#FF4757]"
                                  }`}
                                >
                                  {order.type} {order.direction}
                                </span>
                              </td>
                              <td className="text-right font-mono">${order.price}</td>
                              <td className="text-right font-mono">${order.size}</td>
                              <td className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  Cancelar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="p-4">
                  <div className="text-center py-8 text-gray-500">
                    Historial de operaciones vacío
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Panel de trading */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Abrir Posición</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-gray-400 hover:text-white"
                  title="Configuración avanzada"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              {/* Dirección */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button
                  variant={direction === "LONG" ? "default" : "outline"}
                  onClick={() => setDirection("LONG")}
                  className={direction === "LONG" ? "bg-[#00D26A] hover:bg-[#00D26A]/90 text-black" : "border-[#2a2a2a]"}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  LONG
                </Button>
                <Button
                  variant={direction === "SHORT" ? "default" : "outline"}
                  onClick={() => setDirection("SHORT")}
                  className={direction === "SHORT" ? "bg-[#FF4757] hover:bg-[#FF4757]/90 text-white" : "border-[#2a2a2a]"}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  SHORT
                </Button>
              </div>

              {/* Colateral */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Colateral (DAI)</label>
                  <span className="text-xs text-gray-500">Balance: 10,000.00</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={collateral}
                    onChange={(e) => setCollateral(e.target.value)}
                    placeholder="0.0"
                    className="bg-[#0A0A0A] border-[#2a2a2a] pr-16"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollateral("10000")}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-[#00D9FF]"
                  >
                    MAX
                  </Button>
                </div>
              </div>

              {/* Apalancamiento */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Apalancamiento</label>
                  <span className="text-[#00D9FF] font-mono">{leverage}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={selectedMarket.maxLeverage}
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#00D26A]"
                />
                <div className="flex justify-between mt-2 gap-1">
                  {[5, 10, 25, 50, 100].filter(l => l <= selectedMarket.maxLeverage).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLeverage(l)}
                      className={`flex-1 py-1 text-xs rounded ${
                        leverage === l
                          ? "bg-[#00D26A] text-black"
                          : "bg-[#1a1a1a] text-gray-400 hover:text-white"
                      }`}
                    >
                      {l}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Stop Loss y Take Profit */}
              {showAdvanced && (
                <div className="mb-4 space-y-3 p-3 bg-[#0A0A0A] rounded-lg border border-[#1a1a1a]">
                  <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Stop Loss / Take Profit
                  </h4>
                  
                  {/* Stop Loss */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Stop Loss (USD)
                    </label>
                    <Input
                      type="number"
                      value={stopLoss}
                      onChange={(e) => handleStopLossChange(e.target.value)}
                      placeholder={direction === "LONG" ? `> $${liquidationPrice.toFixed(2)}` : `< $${liquidationPrice.toFixed(2)}`}
                      className={`bg-[#111] border-[#2a2a2a] text-sm ${slError ? "border-[#FF4757]" : ""}`}
                    />
                    {slError && (
                      <p className="text-[#FF4757] text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {slError}
                      </p>
                    )}
                  </div>
                  
                  {/* Take Profit */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Take Profit (USD)
                    </label>
                    <Input
                      type="number"
                      value={takeProfit}
                      onChange={(e) => handleTakeProfitChange(e.target.value)}
                      placeholder={direction === "LONG" ? `> $${currentPrice.toFixed(2)}` : `< $${currentPrice.toFixed(2)}`}
                      className={`bg-[#111] border-[#2a2a2a] text-sm ${tpError ? "border-[#FF4757]" : ""}`}
                    />
                    {tpError && (
                      <p className="text-[#FF4757] text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {tpError}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Resumen */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tamaño de posición</span>
                  <span className="font-mono">${positionSize.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Precio de entrada</span>
                  <span className="font-mono">${formatPrice(currentPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#FF8C00]" />
                    Precio de liquidación
                  </span>
                  <span className="font-mono text-[#FF8C00]">${liquidationPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Comisión</span>
                  <span className="font-mono">${fee.toFixed(2)} (0.1%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Funding Rate</span>
                  <span className={`font-mono ${selectedMarket.fundingRate >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}`}>
                    {selectedMarket.fundingRate >= 0 ? "+" : ""}{(selectedMarket.fundingRate * 100).toFixed(4)}%/h
                  </span>
                </div>
              </div>

              {/* Botón de abrir posición */}
              <Button
                onClick={handleOpenPosition}
                disabled={!collateral || parseFloat(collateral) <= 0 || !!slError || !!tpError}
                className={`w-full py-6 text-lg font-bold ${
                  direction === "LONG"
                    ? "bg-[#00D26A] hover:bg-[#00D26A]/90 text-black"
                    : "bg-[#FF4757] hover:bg-[#FF4757]/90 text-white"
                }`}
              >
                Abrir {direction}
              </Button>

              {/* Info del mercado */}
              <div className="mt-4 p-3 bg-[#0A0A0A] rounded-lg border border-[#1a1a1a]">
                <h4 className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Info del Mercado
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Open Interest</span>
                    <p className="font-mono text-white">{formatNumber(selectedMarket.openInterest)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Vol. 24h</span>
                    <p className="font-mono text-white">{formatNumber(selectedMarket.volume24h)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Leverage</span>
                    <p className="font-mono text-white">{selectedMarket.maxLeverage}x</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Funding</span>
                    <p className={`font-mono ${selectedMarket.fundingRate >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}`}>
                      {(selectedMarket.fundingRate * 100).toFixed(4)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer con estado del sistema */}
      <div className="border-t border-[#1a1a1a] bg-[#0A0A0A] py-3">
        <div className="container">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#00D26A] animate-pulse" />
                Sistema: Operativo
              </span>
              <span>
                Red: <span className="text-white">{selectedChain.name}</span>
              </span>
              <span>
                Bloque: <span className="font-mono text-white">#52,847,291</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>Última actualización: {new Date().toLocaleTimeString()}</span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#00D26A]" />
                Gas:<span className="font-mono text-white">32 gwei</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
