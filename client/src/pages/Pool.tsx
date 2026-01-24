/*
 * DESIGN: Dark Terminal Hacker
 * - Lista de pools de liquidez disponibles
 * - APY y TVL de cada pool
 * - Formulario para agregar liquidez
 */

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  TrendingUp,
  Droplets,
  Coins,
  Info,
  Loader2,
  Search
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { toast } from "sonner";

const pools = [
  {
    id: 1,
    token0: { symbol: "MEXI", icon: "/images/token-mexi.png" },
    token1: { symbol: "MATIC", icon: "/images/polygon-network.png" },
    tvl: "$45.2M",
    apr: "124.5%",
    volume24h: "$2.1M",
    myLiquidity: "$0",
    featured: true,
  },
  {
    id: 2,
    token0: { symbol: "MEXI", icon: "/images/token-mexi.png" },
    token1: { symbol: "USDC", icon: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=40&h=40&fit=crop" },
    tvl: "$32.8M",
    apr: "98.2%",
    volume24h: "$1.8M",
    myLiquidity: "$0",
    featured: true,
  },
  {
    id: 3,
    token0: { symbol: "WETH", icon: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=40&h=40&fit=crop" },
    token1: { symbol: "MATIC", icon: "/images/polygon-network.png" },
    tvl: "$18.5M",
    apr: "45.8%",
    volume24h: "$890K",
    myLiquidity: "$0",
    featured: false,
  },
  {
    id: 4,
    token0: { symbol: "USDC", icon: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=40&h=40&fit=crop" },
    token1: { symbol: "MATIC", icon: "/images/polygon-network.png" },
    tvl: "$15.2M",
    apr: "32.4%",
    volume24h: "$650K",
    myLiquidity: "$0",
    featured: false,
  },
  {
    id: 5,
    token0: { symbol: "MEXI", icon: "/images/token-mexi.png" },
    token1: { symbol: "WETH", icon: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=40&h=40&fit=crop" },
    tvl: "$12.8M",
    apr: "156.2%",
    volume24h: "$1.2M",
    myLiquidity: "$0",
    featured: true,
  },
];

export default function Pool() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [selectedPool, setSelectedPool] = useState<typeof pools[0] | null>(null);
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");

  const filteredPools = pools.filter(pool => 
    pool.token0.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.token1.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddLiquidity = async () => {
    if (!amount0 || !amount1) {
      toast.error("Ingresa ambas cantidades");
      return;
    }

    setIsAddingLiquidity(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success("Liquidez agregada", {
      description: `Has agregado liquidez al pool ${selectedPool?.token0.symbol}/${selectedPool?.token1.symbol}`,
    });
    
    setAmount0("");
    setAmount1("");
    setIsAddingLiquidity(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-20">
        <div className="container max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="font-display font-bold text-3xl lg:text-4xl mb-4">
              Pools de <span className="text-terminal-green">Liquidez</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Provee liquidez a los pools y gana fees de trading más recompensas en MEXI.
              Los pools con el badge "Boost" tienen recompensas multiplicadas.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Droplets className="w-4 h-4" />
                <span className="text-sm">TVL Total</span>
              </div>
              <div className="text-2xl font-bold font-mono text-terminal-green">$124.5M</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Volumen 24h</span>
              </div>
              <div className="text-2xl font-bold font-mono">$8.2M</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Coins className="w-4 h-4" />
                <span className="text-sm">Pools Activos</span>
              </div>
              <div className="text-2xl font-bold font-mono text-terminal-cyan">156</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">APR Promedio</span>
              </div>
              <div className="text-2xl font-bold font-mono text-terminal-green">85.4%</div>
            </div>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold">
                  <Plus className="w-4 h-4" />
                  Crear Pool
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-display">Crear Nuevo Pool</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                  <p>Función próximamente disponible.</p>
                  <p className="text-sm mt-2">Podrás crear pools personalizados con cualquier par de tokens.</p>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Pools List */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-xs text-muted-foreground font-mono">
              <div className="col-span-3">Pool</div>
              <div className="col-span-2 text-right">TVL</div>
              <div className="col-span-2 text-right">APR</div>
              <div className="col-span-2 text-right">Vol 24h</div>
              <div className="col-span-2 text-right">Mi Liquidez</div>
              <div className="col-span-1"></div>
            </div>

            {/* Pool rows */}
            {filteredPools.map((pool, index) => (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 lg:p-6 hover:border-terminal-cyan/50 transition-all"
              >
                <div className="grid lg:grid-cols-12 gap-4 items-center">
                  {/* Pool info */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      <img 
                        src={pool.token0.icon} 
                        alt={pool.token0.symbol} 
                        className="w-10 h-10 rounded-full border-2 border-card"
                      />
                      <img 
                        src={pool.token1.icon} 
                        alt={pool.token1.symbol} 
                        className="w-10 h-10 rounded-full border-2 border-card"
                      />
                    </div>
                    <div>
                      <div className="font-mono font-semibold flex items-center gap-2">
                        {pool.token0.symbol}/{pool.token1.symbol}
                        {pool.featured && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-terminal-green/20 text-terminal-green border border-terminal-green/30">
                            BOOST
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">0.3% fee</div>
                    </div>
                  </div>

                  {/* TVL */}
                  <div className="lg:col-span-2 lg:text-right">
                    <div className="lg:hidden text-xs text-muted-foreground mb-1">TVL</div>
                    <div className="font-mono font-medium">{pool.tvl}</div>
                  </div>

                  {/* APR */}
                  <div className="lg:col-span-2 lg:text-right">
                    <div className="lg:hidden text-xs text-muted-foreground mb-1">APR</div>
                    <div className="font-mono font-medium text-terminal-green flex items-center lg:justify-end gap-1">
                      {pool.apr}
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Incluye fees + recompensas MEXI</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Volume */}
                  <div className="lg:col-span-2 lg:text-right">
                    <div className="lg:hidden text-xs text-muted-foreground mb-1">Vol 24h</div>
                    <div className="font-mono">{pool.volume24h}</div>
                  </div>

                  {/* My Liquidity */}
                  <div className="lg:col-span-2 lg:text-right">
                    <div className="lg:hidden text-xs text-muted-foreground mb-1">Mi Liquidez</div>
                    <div className="font-mono text-muted-foreground">{pool.myLiquidity}</div>
                  </div>

                  {/* Action */}
                  <div className="lg:col-span-1 lg:text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="w-full lg:w-auto border-terminal-cyan/50 text-terminal-cyan hover:bg-terminal-cyan/10"
                          onClick={() => setSelectedPool(pool)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="font-display flex items-center gap-3">
                            <div className="flex -space-x-2">
                              <img 
                                src={selectedPool?.token0.icon} 
                                alt="" 
                                className="w-8 h-8 rounded-full border-2 border-card"
                              />
                              <img 
                                src={selectedPool?.token1.icon} 
                                alt="" 
                                className="w-8 h-8 rounded-full border-2 border-card"
                              />
                            </div>
                            Agregar Liquidez
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm text-muted-foreground mb-2 block">
                              {selectedPool?.token0.symbol}
                            </label>
                            <Input
                              type="text"
                              placeholder="0.0"
                              value={amount0}
                              onChange={(e) => setAmount0(e.target.value)}
                              className="font-mono bg-background"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground mb-2 block">
                              {selectedPool?.token1.symbol}
                            </label>
                            <Input
                              type="text"
                              placeholder="0.0"
                              value={amount1}
                              onChange={(e) => setAmount1(e.target.value)}
                              className="font-mono bg-background"
                            />
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">APR Estimado</span>
                              <span className="text-terminal-green font-mono">{selectedPool?.apr}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Share del Pool</span>
                              <span className="font-mono">~0.01%</span>
                            </div>
                          </div>
                          <Button
                            onClick={handleAddLiquidity}
                            disabled={isAddingLiquidity}
                            className="w-full bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold"
                          >
                            {isAddingLiquidity ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Agregando...
                              </>
                            ) : (
                              "Agregar Liquidez"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
