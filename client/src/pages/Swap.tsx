/*
 * DESIGN: Dark Terminal Hacker
 * - Página dedicada al swap con widget centrado
 * - Gráfico de precios con Recharts
 * - Panel lateral con información del mercado
 * - Historial de transacciones recientes
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SwapWidget from "@/components/SwapWidget";
import PriceChart from "@/components/PriceChart";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock,
  ExternalLink,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

const recentTrades = [
  { type: "buy", from: "MATIC", to: "MEXI", amount: "1,000", time: "2m ago", hash: "0x1234...5678" },
  { type: "sell", from: "MEXI", to: "USDC", amount: "5,000", time: "5m ago", hash: "0x2345...6789" },
  { type: "buy", from: "WETH", to: "MEXI", amount: "0.5", time: "8m ago", hash: "0x3456...7890" },
  { type: "buy", from: "MATIC", to: "MEXI", amount: "500", time: "12m ago", hash: "0x4567...8901" },
  { type: "sell", from: "MEXI", to: "MATIC", amount: "10,000", time: "15m ago", hash: "0x5678...9012" },
];

const topPairs = [
  { pair: "MEXI/MATIC", price: "$0.0847", change: "+12.4%", volume: "$2.1M", positive: true },
  { pair: "MEXI/USDC", price: "$0.0845", change: "+11.8%", volume: "$1.8M", positive: true },
  { pair: "WETH/MATIC", price: "$3,095", change: "-0.5%", volume: "$890K", positive: false },
  { pair: "USDC/MATIC", price: "$0.806", change: "+0.1%", volume: "$650K", positive: true },
];

export default function Swap() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="container">
          {/* Price Chart - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <PriceChart tokenSymbol="MEXI" basePrice={0.0847} />
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Panel izquierdo - Pares populares */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Top Pairs */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">Pares Populares</h3>
                  <Activity className="w-4 h-4 text-terminal-cyan" />
                </div>
                <div className="space-y-3">
                  {topPairs.map((pair) => (
                    <div 
                      key={pair.pair}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-mono font-medium text-sm">{pair.pair}</div>
                        <div className="text-xs text-muted-foreground">Vol: {pair.volume}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{pair.price}</div>
                        <div className={`text-xs font-mono flex items-center justify-end gap-1 ${
                          pair.positive ? "text-terminal-green" : "text-terminal-red"
                        }`}>
                          {pair.positive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {pair.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Info */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold mb-4">Información del Mercado</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">TVL Total</span>
                    <span className="font-mono text-sm text-terminal-green">$124.5M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Volumen 24h</span>
                    <span className="font-mono text-sm">$8.2M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Transacciones 24h</span>
                    <span className="font-mono text-sm">15,847</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Precio MEXI</span>
                    <span className="font-mono text-sm text-terminal-cyan">$0.0847</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Centro - Swap Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <SwapWidget />
              
              {/* Info adicional */}
              <div className="mt-4 p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-terminal-green pulse-green" />
                  <span>Conectado a Polygon Mainnet</span>
                </div>
              </div>
            </motion.div>

            {/* Panel derecho - Transacciones recientes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-1"
            >
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">Transacciones Recientes</h3>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {recentTrades.map((trade, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          trade.type === "buy" 
                            ? "bg-terminal-green/10 text-terminal-green" 
                            : "bg-terminal-red/10 text-terminal-red"
                        }`}>
                          {trade.type === "buy" ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-mono text-sm">
                            {trade.amount} {trade.from} → {trade.to}
                          </div>
                          <div className="text-xs text-muted-foreground">{trade.time}</div>
                        </div>
                      </div>
                      <a 
                        href="#" 
                        className="text-terminal-cyan hover:underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 py-2 text-sm text-terminal-cyan hover:text-terminal-cyan/80 transition-colors">
                  Ver todas las transacciones →
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
