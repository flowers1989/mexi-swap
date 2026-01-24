/*
 * DESIGN: Dark Terminal Hacker
 * - Gráfico de precios con Recharts
 * - Selector de período de tiempo
 * - Estilo terminal con colores verde/cyan
 */

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceChartProps {
  tokenSymbol?: string;
  basePrice?: number;
}

// Generar datos de precio simulados
const generatePriceData = (basePrice: number, days: number, volatility: number = 0.05) => {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  const interval = (days * 24 * 60 * 60 * 1000) / 100;

  for (let i = 0; i < 100; i++) {
    const change = (Math.random() - 0.48) * volatility * price;
    price = Math.max(price + change, basePrice * 0.5);
    
    const timestamp = now - (100 - i) * interval;
    const date = new Date(timestamp);
    
    data.push({
      time: date.toLocaleDateString("es-MX", { 
        month: "short", 
        day: "numeric",
        hour: days <= 1 ? "2-digit" : undefined,
        minute: days <= 1 ? "2-digit" : undefined,
      }),
      price: parseFloat(price.toFixed(6)),
      volume: Math.random() * 1000000 + 500000,
    });
  }
  
  return data;
};

const timeframes = [
  { label: "1H", days: 1/24 },
  { label: "24H", days: 1 },
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "1A", days: 365 },
];

export default function PriceChart({ tokenSymbol = "MEXI", basePrice = 0.0847 }: PriceChartProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframes[2]); // 7D default

  const data = useMemo(() => {
    return generatePriceData(basePrice, selectedTimeframe.days, 0.03);
  }, [basePrice, selectedTimeframe]);

  const currentPrice = data[data.length - 1]?.price || basePrice;
  const startPrice = data[0]?.price || basePrice;
  const priceChange = ((currentPrice - startPrice) / startPrice) * 100;
  const isPositive = priceChange >= 0;

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="font-mono font-bold text-terminal-green">
            ${payload[0].value.toFixed(6)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-display font-semibold text-lg">{tokenSymbol}/USD</h3>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-terminal-green" : "text-terminal-red"}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-mono">{isPositive ? "+" : ""}{priceChange.toFixed(2)}%</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-bold">${currentPrice.toFixed(6)}</span>
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-1 bg-background rounded-lg p-1">
          {timeframes.map((tf) => (
            <Button
              key={tf.label}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 h-8 ${
                selectedTimeframe.label === tf.label
                  ? "bg-terminal-green/20 text-terminal-green"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {tf.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="0%" 
                  stopColor={isPositive ? "#00D26A" : "#FF4444"} 
                  stopOpacity={0.3} 
                />
                <stop 
                  offset="100%" 
                  stopColor={isPositive ? "#00D26A" : "#FF4444"} 
                  stopOpacity={0} 
                />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(255,255,255,0.05)" 
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[minPrice * 0.98, maxPrice * 1.02]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#666', fontSize: 10 }}
              tickFormatter={(value) => `$${value.toFixed(4)}`}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#00D26A" : "#FF4444"}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Máximo {selectedTimeframe.label}</div>
          <div className="font-mono text-sm">${maxPrice.toFixed(6)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Mínimo {selectedTimeframe.label}</div>
          <div className="font-mono text-sm">${minPrice.toFixed(6)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Volumen 24h</div>
          <div className="font-mono text-sm text-terminal-cyan">$8.2M</div>
        </div>
      </div>
    </div>
  );
}
