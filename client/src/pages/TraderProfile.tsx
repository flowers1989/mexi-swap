/**
 * Panel de Trader - MexiSwap
 * DESIGN: Dark Terminal Hacker
 * - Métricas personales del trader
 * - Historial de operaciones
 * - Estadísticas de rendimiento
 * - Gráficos de P&L
 */

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Award,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  Zap,
  Shield,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
  Settings,
} from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";
import { getTokenLogo } from "@/config/tokens";

// Datos de P&L histórico
const PNL_HISTORY = [
  { date: "Ene 1", pnl: 0, cumulative: 0 },
  { date: "Ene 5", pnl: 250, cumulative: 250 },
  { date: "Ene 10", pnl: -80, cumulative: 170 },
  { date: "Ene 15", pnl: 420, cumulative: 590 },
  { date: "Ene 20", pnl: -150, cumulative: 440 },
  { date: "Ene 25", pnl: 380, cumulative: 820 },
  { date: "Ene 30", pnl: 520, cumulative: 1340 },
  { date: "Feb 1", pnl: -200, cumulative: 1140 },
  { date: "Feb 5", pnl: 680, cumulative: 1820 },
];

// Distribución por mercado
const MARKET_DISTRIBUTION = [
  { name: "ETH/USD", value: 45, color: "#627EEA" },
  { name: "BTC/USD", value: 30, color: "#F7931A" },
  { name: "SOL/USD", value: 15, color: "#00D9FF" },
  { name: "Otros", value: 10, color: "#888" },
];

// Historial de operaciones
const TRADE_HISTORY = [
  {
    id: 1,
    market: "ETH/USD",
    direction: "LONG",
    leverage: 10,
    size: 5000,
    entryPrice: 3450.25,
    exitPrice: 3520.80,
    pnl: 102.35,
    pnlPercent: 2.04,
    duration: "4h 23m",
    date: "2026-01-05 14:32",
    status: "closed",
  },
  {
    id: 2,
    market: "BTC/USD",
    direction: "SHORT",
    leverage: 15,
    size: 8000,
    entryPrice: 94500,
    exitPrice: 93200,
    pnl: 138.62,
    pnlPercent: 1.73,
    duration: "2h 15m",
    date: "2026-01-05 10:15",
    status: "closed",
  },
  {
    id: 3,
    market: "SOL/USD",
    direction: "LONG",
    leverage: 20,
    size: 3000,
    entryPrice: 185.50,
    exitPrice: 178.20,
    pnl: -118.32,
    pnlPercent: -3.94,
    duration: "1h 45m",
    date: "2026-01-04 18:45",
    status: "closed",
  },
  {
    id: 4,
    market: "BNB/USD",
    direction: "LONG",
    leverage: 10,
    size: 2500,
    entryPrice: 312.40,
    exitPrice: 325.80,
    pnl: 107.37,
    pnlPercent: 4.29,
    duration: "6h 12m",
    date: "2026-01-04 12:20",
    status: "closed",
  },
  {
    id: 5,
    market: "ETH/USD",
    direction: "SHORT",
    leverage: 5,
    size: 4000,
    entryPrice: 3580.00,
    exitPrice: 3610.50,
    pnl: -34.08,
    pnlPercent: -0.85,
    duration: "45m",
    date: "2026-01-03 22:10",
    status: "closed",
  },
];

// Estadísticas por día de la semana
const WEEKLY_STATS = [
  { day: "Lun", trades: 12, pnl: 450 },
  { day: "Mar", trades: 8, pnl: -120 },
  { day: "Mié", trades: 15, pnl: 680 },
  { day: "Jue", trades: 10, pnl: 320 },
  { day: "Vie", trades: 18, pnl: 890 },
  { day: "Sáb", trades: 6, pnl: -80 },
  { day: "Dom", trades: 4, pnl: 180 },
];

export default function TraderProfile() {
  const { isConnected, address } = useWeb3();
  const [timeRange, setTimeRange] = useState("30d");

  // Estadísticas del trader (simuladas)
  const traderStats = useMemo(() => ({
    totalPnl: 1820.45,
    totalPnlPercent: 18.2,
    winRate: 68.5,
    totalTrades: 156,
    winningTrades: 107,
    losingTrades: 49,
    avgWin: 125.80,
    avgLoss: -72.35,
    profitFactor: 2.45,
    maxDrawdown: -8.5,
    avgLeverage: 12.5,
    avgHoldTime: "3h 45m",
    bestTrade: 892.50,
    worstTrade: -345.20,
    totalVolume: 2450000,
    feePaid: 2450,
    liquidations: 2,
    currentStreak: 5, // Racha ganadora
  }), []);

  // Formatear número
  const formatNumber = (num: number, decimals = 2) => {
    if (Math.abs(num) >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (Math.abs(num) >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <Navbar />
        <div className="container py-20 text-center">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Panel de Trader</h1>
          <p className="text-gray-400 mb-6">Conecta tu wallet para ver tus estadísticas de trading</p>
          <Button className="bg-[#00D26A] hover:bg-[#00D26A]/90 text-black">
            Conectar Wallet
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      <div className="container py-8">
        {/* Header del perfil */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D26A] to-[#00D9FF] flex items-center justify-center text-2xl font-bold text-black">
              {address?.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</h1>
                <button className="text-gray-500 hover:text-white">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={`https://polygonscan.com/address/${address}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-1 bg-[#00D26A]/20 text-[#00D26A] text-xs rounded-full">
                  Trader Activo
                </span>
                <span className="text-sm text-gray-400">
                  Miembro desde Dic 2025
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="all">Todo el tiempo</option>
            </select>
            <Button variant="outline" size="icon" className="border-[#2a2a2a]">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <DollarSign className="w-4 h-4" />
              P&L Total
            </div>
            <p className={`text-2xl font-bold ${traderStats.totalPnl >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}`}>
              {traderStats.totalPnl >= 0 ? "+" : ""}{formatNumber(traderStats.totalPnl)}
            </p>
            <p className={`text-sm ${traderStats.totalPnlPercent >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}`}>
              {traderStats.totalPnlPercent >= 0 ? "+" : ""}{traderStats.totalPnlPercent}%
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Target className="w-4 h-4" />
              Win Rate
            </div>
            <p className="text-2xl font-bold text-[#00D9FF]">{traderStats.winRate}%</p>
            <p className="text-sm text-gray-400">
              {traderStats.winningTrades}W / {traderStats.losingTrades}L
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Activity className="w-4 h-4" />
              Total Trades
            </div>
            <p className="text-2xl font-bold">{traderStats.totalTrades}</p>
            <p className="text-sm text-gray-400">
              Racha: <span className="text-[#00D26A]">+{traderStats.currentStreak}</span>
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Zap className="w-4 h-4" />
              Profit Factor
            </div>
            <p className="text-2xl font-bold text-[#00D26A]">{traderStats.profitFactor}x</p>
            <p className="text-sm text-gray-400">
              Avg Win: {formatNumber(traderStats.avgWin)}
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <TrendingDown className="w-4 h-4" />
              Max Drawdown
            </div>
            <p className="text-2xl font-bold text-[#FF4757]">{traderStats.maxDrawdown}%</p>
            <p className="text-sm text-gray-400">
              Liquidaciones: {traderStats.liquidations}
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Clock className="w-4 h-4" />
              Avg Hold Time
            </div>
            <p className="text-2xl font-bold">{traderStats.avgHoldTime}</p>
            <p className="text-sm text-gray-400">
              Avg Leverage: {traderStats.avgLeverage}x
            </p>
          </div>
        </div>

        {/* Gráficos y análisis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de P&L */}
          <div className="lg:col-span-2 bg-[#111] rounded-xl border border-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#00D26A]" />
              P&L Acumulado
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={PNL_HISTORY}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D26A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D26A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
                />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#00D26A"
                  strokeWidth={2}
                  fill="url(#pnlGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por mercado */}
          <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-[#00D9FF]" />
              Distribución por Mercado
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={MARKET_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {MARKET_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {MARKET_DISTRIBUTION.map((market) => (
                <div key={market.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: market.color }} />
                    <span>{market.name}</span>
                  </div>
                  <span className="font-mono">{market.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rendimiento por día */}
        <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FFD700]" />
            Rendimiento por Día de la Semana
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WEEKLY_STATS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="day" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#111", border: "1px solid #2a2a2a", borderRadius: "8px" }}
                formatter={(value: number, name: string) => [
                  name === "pnl" ? `$${value}` : value,
                  name === "pnl" ? "P&L" : "Trades"
                ]}
              />
              <Bar dataKey="pnl" fill="#00D26A" radius={[4, 4, 0, 0]}>
                {WEEKLY_STATS.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#00D26A" : "#FF4757"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Historial de operaciones */}
        <div className="bg-[#111] rounded-xl border border-[#1a1a1a]">
          <div className="p-6 border-b border-[#1a1a1a]">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00D26A]" />
              Historial de Operaciones
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-500 text-sm border-b border-[#1a1a1a]">
                  <th className="text-left py-3 px-6">Fecha</th>
                  <th className="text-left py-3">Mercado</th>
                  <th className="text-left py-3">Dirección</th>
                  <th className="text-right py-3">Tamaño</th>
                  <th className="text-right py-3">Entrada</th>
                  <th className="text-right py-3">Salida</th>
                  <th className="text-right py-3">Duración</th>
                  <th className="text-right py-3 px-6">P&L</th>
                </tr>
              </thead>
              <tbody>
                {TRADE_HISTORY.map((trade) => (
                  <tr key={trade.id} className="border-b border-[#1a1a1a]/50 hover:bg-[#1a1a1a]/30">
                    <td className="py-4 px-6 text-sm text-gray-400">{trade.date}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={getTokenLogo(trade.market.split("/")[0])}
                          alt={trade.market}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${trade.market.split("/")[0]}&background=1a1a1a&color=fff&size=24`;
                          }}
                        />
                        <span className="font-medium">{trade.market}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          trade.direction === "LONG"
                            ? "bg-[#00D26A]/20 text-[#00D26A]"
                            : "bg-[#FF4757]/20 text-[#FF4757]"
                        }`}
                      >
                        {trade.direction === "LONG" ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {trade.direction} {trade.leverage}x
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono">${trade.size.toLocaleString()}</td>
                    <td className="py-4 text-right font-mono">${trade.entryPrice.toLocaleString()}</td>
                    <td className="py-4 text-right font-mono">${trade.exitPrice.toLocaleString()}</td>
                    <td className="py-4 text-right text-sm text-gray-400">{trade.duration}</td>
                    <td className="py-4 px-6 text-right">
                      <span className={trade.pnl >= 0 ? "text-[#00D26A]" : "text-[#FF4757]"}>
                        <span className="font-mono">
                          {trade.pnl >= 0 ? "+" : ""}{formatNumber(trade.pnl)}
                        </span>
                        <br />
                        <span className="text-xs">
                          ({trade.pnlPercent >= 0 ? "+" : ""}{trade.pnlPercent.toFixed(2)}%)
                        </span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#1a1a1a] text-center">
            <Button variant="ghost" className="text-[#00D9FF]">
              Ver todas las operaciones
            </Button>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6">
            <h4 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Mejores Operaciones
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Mejor trade</span>
                <span className="text-[#00D26A] font-mono">+{formatNumber(traderStats.bestTrade)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Peor trade</span>
                <span className="text-[#FF4757] font-mono">{formatNumber(traderStats.worstTrade)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Promedio ganador</span>
                <span className="text-[#00D26A] font-mono">+{formatNumber(traderStats.avgWin)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Promedio perdedor</span>
                <span className="text-[#FF4757] font-mono">{formatNumber(traderStats.avgLoss)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6">
            <h4 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Volumen y Fees
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Volumen total</span>
                <span className="font-mono">{formatNumber(traderStats.totalVolume)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fees pagados</span>
                <span className="font-mono">{formatNumber(traderStats.feePaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fee promedio</span>
                <span className="font-mono">0.1%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Rebate ganado</span>
                <span className="text-[#00D26A] font-mono">+$245</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111] rounded-xl border border-[#1a1a1a] p-6">
            <h4 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Gestión de Riesgo
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Apalancamiento prom.</span>
                <span className="font-mono">{traderStats.avgLeverage}x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Max drawdown</span>
                <span className="text-[#FF4757] font-mono">{traderStats.maxDrawdown}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Liquidaciones</span>
                <span className="font-mono">{traderStats.liquidations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Ratio Sharpe</span>
                <span className="text-[#00D26A] font-mono">1.85</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
