/**
 * Página de Analytics - MexiSwap
 * DESIGN: Dark Terminal Hacker
 * - Fondo negro profundo (#0A0A0A)
 * - Verde terminal (#00D26A) para valores positivos
 * - Cyan (#00D9FF) para elementos interactivos
 * - Gráficos con Recharts
 */

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Globe,
  Layers,
  RefreshCw,
} from "lucide-react";
import { getTokenLogo } from "@/config/tokens";
import { CHAIN_LOGOS } from "@/config/chains";

// Datos de TVL histórico
const TVL_DATA = [
  { date: "Ene 1", tvl: 45000000, volume: 12000000 },
  { date: "Ene 5", tvl: 52000000, volume: 18000000 },
  { date: "Ene 10", tvl: 68000000, volume: 25000000 },
  { date: "Ene 15", tvl: 75000000, volume: 32000000 },
  { date: "Ene 20", tvl: 82000000, volume: 28000000 },
  { date: "Ene 25", tvl: 95000000, volume: 45000000 },
  { date: "Ene 30", tvl: 112000000, volume: 52000000 },
  { date: "Feb 1", tvl: 125000000, volume: 48000000 },
  { date: "Feb 5", tvl: 145000000, volume: 65000000 },
];

// Datos de volumen por cadena
const VOLUME_BY_CHAIN = [
  { name: "Polygon", value: 45, color: "#8247E5" },
  { name: "Ethereum", value: 25, color: "#627EEA" },
  { name: "BNB Chain", value: 18, color: "#F3BA2F" },
  { name: "Avalanche", value: 12, color: "#E84142" },
];

// Datos de volumen semanal
const WEEKLY_VOLUME = [
  { day: "Lun", spot: 8500000, perps: 15200000 },
  { day: "Mar", spot: 9200000, perps: 18500000 },
  { day: "Mié", spot: 7800000, perps: 14800000 },
  { day: "Jue", spot: 11200000, perps: 22100000 },
  { day: "Vie", spot: 12500000, perps: 25800000 },
  { day: "Sáb", spot: 6800000, perps: 12500000 },
  { day: "Dom", spot: 5500000, perps: 9800000 },
];

// Top pools
const TOP_POOLS = [
  { pair: "ETH/DAI", tvl: 28500000, apr: 12.5, volume24h: 8500000, fees24h: 25500, chain: "polygon" },
  { pair: "BTC/DAI", tvl: 22000000, apr: 10.2, volume24h: 6200000, fees24h: 18600, chain: "ethereum" },
  { pair: "MATIC/DAI", tvl: 15800000, apr: 18.5, volume24h: 4500000, fees24h: 13500, chain: "polygon" },
  { pair: "BNB/DAI", tvl: 12500000, apr: 15.8, volume24h: 3800000, fees24h: 11400, chain: "bsc" },
  { pair: "AVAX/DAI", tvl: 9200000, apr: 22.1, volume24h: 2900000, fees24h: 8700, chain: "avalanche" },
  { pair: "SOL/DAI", tvl: 8500000, apr: 25.5, volume24h: 2500000, fees24h: 7500, chain: "polygon" },
  { pair: "LINK/DAI", tvl: 6800000, apr: 14.2, volume24h: 1800000, fees24h: 5400, chain: "ethereum" },
  { pair: "UNI/DAI", tvl: 5200000, apr: 11.8, volume24h: 1500000, fees24h: 4500, chain: "ethereum" },
];

// Top traders
const TOP_TRADERS = [
  { address: "0x1a2b...3c4d", volume: 12500000, trades: 342, pnl: 125000, pnlPercent: 8.5 },
  { address: "0x5e6f...7g8h", volume: 9800000, trades: 256, pnl: 89000, pnlPercent: 6.2 },
  { address: "0x9i0j...1k2l", volume: 8200000, trades: 198, pnl: -45000, pnlPercent: -3.8 },
  { address: "0x3m4n...5o6p", volume: 7500000, trades: 412, pnl: 62000, pnlPercent: 4.5 },
  { address: "0x7q8r...9s0t", volume: 6800000, trades: 178, pnl: 78000, pnlPercent: 7.1 },
];

// Estadísticas de perpetuos
const PERPS_STATS = {
  openInterest: 245000000,
  longRatio: 58,
  shortRatio: 42,
  liquidations24h: 1250000,
  fundingRate: 0.0012,
};

// Métricas principales
const MAIN_METRICS = {
  tvl: 145000000,
  tvlChange: 12.5,
  volume24h: 65000000,
  volumeChange: 8.2,
  fees24h: 195000,
  feesChange: 15.3,
  users24h: 4520,
  usersChange: 22.1,
  trades24h: 12850,
  tradesChange: 18.5,
  avgTradeSize: 5058,
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("7d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  // Formatear números grandes
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Formatear dirección
  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics</h1>
              <p className="text-gray-400">
                Métricas y estadísticas del protocolo MexiSwap en tiempo real
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-[#111] border border-[#1a1a1a] rounded-lg p-1">
                {(["24h", "7d", "30d", "all"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 text-sm rounded-md transition-colors ${
                      timeRange === range
                        ? "bg-[#00D26A] text-black font-medium"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {range === "all" ? "Todo" : range.toUpperCase()}
                  </button>
                ))}
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 bg-[#111] border border-[#1a1a1a] rounded-lg hover:border-[#00D26A]/50 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-5 h-5 text-[#00D26A]" />
                  <Badge className={`text-xs ${MAIN_METRICS.tvlChange >= 0 ? "bg-[#00D26A]/20 text-[#00D26A]" : "bg-red-500/20 text-red-400"}`}>
                    {MAIN_METRICS.tvlChange >= 0 ? "+" : ""}{MAIN_METRICS.tvlChange}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold font-mono">{formatNumber(MAIN_METRICS.tvl)}</p>
                <p className="text-xs text-gray-500">TVL Total</p>
              </CardContent>
            </Card>

            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-5 h-5 text-[#00D9FF]" />
                  <Badge className={`text-xs ${MAIN_METRICS.volumeChange >= 0 ? "bg-[#00D26A]/20 text-[#00D26A]" : "bg-red-500/20 text-red-400"}`}>
                    {MAIN_METRICS.volumeChange >= 0 ? "+" : ""}{MAIN_METRICS.volumeChange}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold font-mono">{formatNumber(MAIN_METRICS.volume24h)}</p>
                <p className="text-xs text-gray-500">Volumen 24h</p>
              </CardContent>
            </Card>

            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <Badge className={`text-xs ${MAIN_METRICS.feesChange >= 0 ? "bg-[#00D26A]/20 text-[#00D26A]" : "bg-red-500/20 text-red-400"}`}>
                    {MAIN_METRICS.feesChange >= 0 ? "+" : ""}{MAIN_METRICS.feesChange}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold font-mono">{formatNumber(MAIN_METRICS.fees24h)}</p>
                <p className="text-xs text-gray-500">Fees 24h</p>
              </CardContent>
            </Card>

            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <Badge className={`text-xs ${MAIN_METRICS.usersChange >= 0 ? "bg-[#00D26A]/20 text-[#00D26A]" : "bg-red-500/20 text-red-400"}`}>
                    {MAIN_METRICS.usersChange >= 0 ? "+" : ""}{MAIN_METRICS.usersChange}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold font-mono">{MAIN_METRICS.users24h.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Usuarios 24h</p>
              </CardContent>
            </Card>

            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-5 h-5 text-orange-400" />
                  <Badge className={`text-xs ${MAIN_METRICS.tradesChange >= 0 ? "bg-[#00D26A]/20 text-[#00D26A]" : "bg-red-500/20 text-red-400"}`}>
                    {MAIN_METRICS.tradesChange >= 0 ? "+" : ""}{MAIN_METRICS.tradesChange}%
                  </Badge>
                </div>
                <p className="text-2xl font-bold font-mono">{MAIN_METRICS.trades24h.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Trades 24h</p>
              </CardContent>
            </Card>

            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Layers className="w-5 h-5 text-[#00D9FF]" />
                </div>
                <p className="text-2xl font-bold font-mono">{formatNumber(MAIN_METRICS.avgTradeSize)}</p>
                <p className="text-xs text-gray-500">Trade Promedio</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* TVL Chart */}
            <Card className="bg-[#111] border-[#1a1a1a] lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00D26A]" />
                  TVL & Volumen Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={TVL_DATA}>
                    <defs>
                      <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D26A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D26A" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00D9FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00D9FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, ""]}
                    />
                    <Area type="monotone" dataKey="tvl" stroke="#00D26A" fill="url(#tvlGradient)" name="TVL" />
                    <Area type="monotone" dataKey="volume" stroke="#00D9FF" fill="url(#volumeGradient)" name="Volumen" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Volumen por cadena */}
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-[#00D9FF]" />
                  Volumen por Cadena
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={VOLUME_BY_CHAIN}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {VOLUME_BY_CHAIN.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {VOLUME_BY_CHAIN.map((chain) => (
                    <div key={chain.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chain.color }} />
                      <span className="text-xs text-gray-400">{chain.name}</span>
                      <span className="text-xs font-mono ml-auto">{chain.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volumen semanal y estadísticas de perpetuos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Volumen semanal */}
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#00D26A]" />
                  Volumen Semanal (Spot vs Perpetuos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={WEEKLY_VOLUME}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="day" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                      formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, ""]}
                    />
                    <Bar dataKey="spot" fill="#00D26A" name="Spot" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="perps" fill="#00D9FF" name="Perpetuos" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Estadísticas de perpetuos */}
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#00D9FF]" />
                  Estadísticas de Perpetuos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                    <span className="text-gray-400">Open Interest</span>
                    <span className="font-mono text-lg">{formatNumber(PERPS_STATS.openInterest)}</span>
                  </div>
                  
                  <div className="py-3 border-b border-[#1a1a1a]">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Long/Short Ratio</span>
                      <span className="font-mono">{PERPS_STATS.longRatio}% / {PERPS_STATS.shortRatio}%</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-[#00D26A]"
                        style={{ width: `${PERPS_STATS.longRatio}%` }}
                      />
                      <div
                        className="bg-[#FF4757]"
                        style={{ width: `${PERPS_STATS.shortRatio}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-[#00D26A]">Long {PERPS_STATS.longRatio}%</span>
                      <span className="text-[#FF4757]">Short {PERPS_STATS.shortRatio}%</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-[#1a1a1a]">
                    <span className="text-gray-400">Liquidaciones 24h</span>
                    <span className="font-mono text-[#FF4757]">{formatNumber(PERPS_STATS.liquidations24h)}</span>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">Funding Rate</span>
                    <span className={`font-mono ${PERPS_STATS.fundingRate >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}`}>
                      {PERPS_STATS.fundingRate >= 0 ? "+" : ""}{(PERPS_STATS.fundingRate * 100).toFixed(4)}%/h
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Pools y Top Traders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pools */}
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#00D26A]" />
                  Top Pools por TVL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs">
                        <th className="text-left pb-3">Pool</th>
                        <th className="text-right pb-3">TVL</th>
                        <th className="text-right pb-3">APR</th>
                        <th className="text-right pb-3">Vol 24h</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOP_POOLS.map((pool, index) => (
                        <tr key={index} className="border-t border-[#1a1a1a]">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={CHAIN_LOGOS[pool.chain]}
                                alt={pool.chain}
                                className="w-4 h-4 rounded-full"
                              />
                              <span className="font-medium">{pool.pair}</span>
                            </div>
                          </td>
                          <td className="text-right font-mono">
                            ${(pool.tvl / 1000000).toFixed(2)}M
                          </td>
                          <td className="text-right font-mono text-[#00D26A]">
                            {pool.apr}%
                          </td>
                          <td className="text-right font-mono text-gray-400">
                            ${(pool.volume24h / 1000000).toFixed(2)}M
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Top Traders */}
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#00D9FF]" />
                  Top Traders (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs">
                        <th className="text-left pb-3">Dirección</th>
                        <th className="text-right pb-3">Volumen</th>
                        <th className="text-right pb-3">Trades</th>
                        <th className="text-right pb-3">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TOP_TRADERS.map((trader, index) => (
                        <tr key={index} className="border-t border-[#1a1a1a]">
                          <td className="py-3">
                            <span className="font-mono text-[#00D9FF]">{trader.address}</span>
                          </td>
                          <td className="text-right font-mono">
                            ${(trader.volume / 1000000).toFixed(2)}M
                          </td>
                          <td className="text-right font-mono text-gray-400">
                            {trader.trades}
                          </td>
                          <td className={`text-right font-mono ${trader.pnl >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}`}>
                            <div className="flex items-center justify-end gap-1">
                              {trader.pnl >= 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              ${Math.abs(trader.pnl / 1000).toFixed(1)}K
                              <span className="text-xs">({trader.pnlPercent}%)</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
