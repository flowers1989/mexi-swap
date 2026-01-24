/*
 * DESIGN: Dark Terminal Hacker
 * - Fondo negro profundo (#0A0A0A)
 * - Verde terminal (#00D26A) para velas alcistas
 * - Rojo (#FF4757) para velas bajistas
 * - Cyan (#00D9FF) para líneas y acentos
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, type IChartApi, type CandlestickData, type Time, type ISeriesApi } from "lightweight-charts";

interface TradingViewChartProps {
  symbol: string;
  interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";
  height?: number;
  onPriceChange?: (price: number, change: number) => void;
}

// Generar datos de velas simulados (en producción conectar a API real)
const generateCandlestickData = (symbol: string, interval: string, count: number = 200): CandlestickData<Time>[] => {
  const data: CandlestickData<Time>[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  // Precios base por símbolo
  const basePrices: Record<string, number> = {
    "ETH/USD": 3842,
    "BTC/USD": 97500,
    "LINK/USD": 24.5,
    "ARB/USD": 1.85,
    "SOL/USD": 198,
    "UNI/USD": 14.2,
    "XRP/USD": 2.35,
    "DOGE/USD": 0.38,
    "LTC/USD": 108,
    "AVAX/USD": 42,
    "MATIC/USD": 1.24,
    "BNB/USD": 715,
    "NEAR/USD": 7.2,
    "ATOM/USD": 12.5,
    "OP/USD": 3.8,
    "APT/USD": 14.5,
    "GMX/USD": 52,
    "AAVE/USD": 285,
    "CRV/USD": 1.15,
    "MEXI/USD": 0.0847,
  };

  const basePrice = basePrices[symbol] || 100;
  let currentPrice = basePrice * (0.95 + Math.random() * 0.1);
  
  // Intervalos en segundos
  const intervalSeconds: Record<string, number> = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "1d": 86400,
    "1w": 604800,
  };

  const step = intervalSeconds[interval] || 3600;

  for (let i = count; i >= 0; i--) {
    const time = (now - i * step) as Time;
    const volatility = basePrice * 0.02;
    
    const open = currentPrice;
    const change = (Math.random() - 0.48) * volatility;
    const high = open + Math.abs(change) + Math.random() * volatility * 0.5;
    const low = open - Math.abs(change) - Math.random() * volatility * 0.5;
    const close = open + change;
    
    const decimals = symbol.includes("DOGE") || symbol.includes("MEXI") ? 6 : 2;
    
    data.push({
      time,
      open: parseFloat(open.toFixed(decimals)),
      high: parseFloat(Math.max(open, close, high).toFixed(decimals)),
      low: parseFloat(Math.min(open, close, low).toFixed(decimals)),
      close: parseFloat(close.toFixed(decimals)),
    });
    
    currentPrice = close;
  }

  return data;
};

export default function TradingViewChart({ 
  symbol, 
  interval, 
  height = 400,
  onPriceChange 
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const candleDataRef = useRef<CandlestickData<Time>[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [ohlc, setOhlc] = useState({ open: 0, high: 0, low: 0, close: 0 });

  const updatePriceCallback = useCallback((price: number, change: number) => {
    if (onPriceChange) {
      onPriceChange(price, change);
    }
  }, [onPriceChange]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Crear chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: "#0A0A0A" },
        textColor: "#9CA3AF",
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#00D9FF",
          width: 1,
          style: 2,
          labelBackgroundColor: "#00D9FF",
        },
        horzLine: {
          color: "#00D9FF",
          width: 1,
          style: 2,
          labelBackgroundColor: "#00D9FF",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Crear serie de velas usando la nueva API v5
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00D26A",
      downColor: "#FF4757",
      borderUpColor: "#00D26A",
      borderDownColor: "#FF4757",
      wickUpColor: "#00D26A",
      wickDownColor: "#FF4757",
    });
    candleSeriesRef.current = candlestickSeries;

    // Crear serie de volumen
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });
    volumeSeriesRef.current = volumeSeries;

    // Configurar escala de volumen
    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Cargar datos
    const candleData = generateCandlestickData(symbol, interval);
    candleDataRef.current = candleData;
    candlestickSeries.setData(candleData);

    // Generar datos de volumen
    const volumeData = candleData.map((candle) => ({
      time: candle.time,
      value: Math.random() * 1000000 + 500000,
      color: candle.close >= candle.open ? "rgba(0, 210, 106, 0.3)" : "rgba(255, 71, 87, 0.3)",
    }));
    volumeSeries.setData(volumeData);

    // Calcular precio actual y cambio
    if (candleData.length > 1) {
      const lastCandle = candleData[candleData.length - 1];
      const prevCandle = candleData[candleData.length - 2];
      const change = ((lastCandle.close - prevCandle.close) / prevCandle.close) * 100;
      
      setCurrentPrice(lastCandle.close);
      setPriceChange(change);
      setOhlc({
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close,
      });
      
      updatePriceCallback(lastCandle.close, change);
    }

    // Ajustar tamaño
    chart.timeScale().fitContent();

    // Manejar resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    // Simular actualizaciones en tiempo real
    const updateInterval = setInterval(() => {
      const candleData = candleDataRef.current;
      if (candleData.length > 0 && candleSeriesRef.current) {
        const lastCandle = candleData[candleData.length - 1];
        const volatility = lastCandle.close * 0.001;
        const change = (Math.random() - 0.5) * volatility;
        
        const newClose = lastCandle.close + change;
        const updatedCandle: CandlestickData<Time> = {
          ...lastCandle,
          high: Math.max(lastCandle.high, newClose),
          low: Math.min(lastCandle.low, newClose),
          close: newClose,
        };
        
        candleSeriesRef.current.update(updatedCandle);
        candleDataRef.current[candleData.length - 1] = updatedCandle;
        
        setCurrentPrice(newClose);
        setOhlc({
          open: updatedCandle.open,
          high: updatedCandle.high,
          low: updatedCandle.low,
          close: updatedCandle.close,
        });
        
        const prevCandle = candleData[candleData.length - 2];
        const newChange = ((newClose - prevCandle.close) / prevCandle.close) * 100;
        setPriceChange(newChange);
        
        updatePriceCallback(newClose, newChange);
      }
    }, 2000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearInterval(updateInterval);
      chart.remove();
    };
  }, [symbol, interval, height, updatePriceCallback]);

  const decimals = symbol.includes("DOGE") || symbol.includes("MEXI") ? 6 : 2;

  return (
    <div className="relative">
      {/* Header del gráfico */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{symbol}</span>
          <span className={`text-lg font-mono ${priceChange >= 0 ? "text-terminal-green" : "text-red-500"}`}>
            ${currentPrice.toFixed(decimals)}
          </span>
          <span className={`text-sm font-mono ${priceChange >= 0 ? "text-terminal-green" : "text-red-500"}`}>
            {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Indicadores OHLC */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-3 text-xs font-mono text-muted-foreground">
        <span>O: <span className="text-white">{ohlc.open.toFixed(decimals)}</span></span>
        <span>H: <span className="text-terminal-green">{ohlc.high.toFixed(decimals)}</span></span>
        <span>L: <span className="text-red-500">{ohlc.low.toFixed(decimals)}</span></span>
        <span>C: <span className="text-white">{ohlc.close.toFixed(decimals)}</span></span>
      </div>

      {/* Chart container */}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
