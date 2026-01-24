/*
 * DESIGN: Dark Terminal Hacker
 * - Navegación superior con logo a la izquierda
 * - Links de navegación con hover glow
 * - Botón de conectar wallet con glow verde
 * - Ticker de precios en tiempo real (simulado)
 * - Integración Web3 con MetaMask
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  Wallet,
  ChevronDown,
  ExternalLink,
  Copy,
  LogOut,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useWeb3 } from "@/contexts/Web3Context";
import NotificationCenter from "@/components/NotificationCenter";

const navLinks = [
  { href: "/swap", label: "Swap" },
  { href: "/perpetuals", label: "Perpetuos" },
  { href: "/pool", label: "Pool" },
  { href: "/farm", label: "Farm" },
  { href: "/launchpad", label: "Launchpad" },
  { href: "/migrate", label: "Migrar" },
  { href: "/governance", label: "Gobernanza" },
  { href: "/referrals", label: "Referidos" },
  { href: "/tokenomics", label: "MEXI" },
  { href: "/analytics", label: "Analytics" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Web3 context
  const { 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    shortAddress, 
    address,
    networkName,
    nativeBalance,
    switchToPolygon,
    isCorrectNetwork
  } = useWeb3();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast.success("Dirección copiada al portapapeles");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      {/* Ticker de precios */}
      <div className="border-b border-border/30 bg-card/50">
        <div className="container flex items-center gap-6 py-1.5 text-xs font-mono overflow-x-auto">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted-foreground">MEXI</span>
            <span className="text-terminal-green">$0.0847</span>
            <span className="text-terminal-green text-[10px]">+12.4%</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted-foreground">MATIC</span>
            <span className="text-white">$1.24</span>
            <span className="text-terminal-green text-[10px]">+2.1%</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted-foreground">ETH</span>
            <span className="text-white">$3,842</span>
            <span className="text-terminal-red text-[10px]">-0.8%</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted-foreground">TVL</span>
            <span className="text-terminal-cyan">$124.5M</span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted-foreground">24h Vol</span>
            <span className="text-terminal-cyan">$8.2M</span>
          </div>
        </div>
      </div>

      {/* Navegación principal */}
      <nav className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <img 
                src="/images/token-mexi.png" 
                alt="MexiSwap" 
                className="w-full h-full object-contain transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-terminal-green/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Mexi<span className="text-terminal-green">Swap</span>
            </span>
          </Link>

          {/* Links de navegación - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    location === link.href
                      ? "bg-primary/10 text-terminal-green glow-border-green border"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Acciones - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Centro de notificaciones */}
            <NotificationCenter />
            
            {/* Selector de red */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-border/50 bg-card/50">
                  <img src="/images/polygon-network.png" alt="Polygon" className="w-4 h-4" />
                  <span className="font-mono text-xs">{networkName}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem 
                  className="gap-2 font-mono text-xs"
                  onClick={switchToPolygon}
                >
                  <img src="/images/polygon-network.png" alt="Polygon" className="w-4 h-4" />
                  Polygon Mainnet
                  {isCorrectNetwork && <span className="ml-auto text-terminal-green">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 font-mono text-xs opacity-50" disabled>
                  <span className="w-4 h-4 rounded-full bg-blue-500" />
                  Ethereum (Próximamente)
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 font-mono text-xs opacity-50" disabled>
                  <span className="w-4 h-4 rounded-full bg-blue-400" />
                  Arbitrum (Próximamente)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botón de conectar wallet */}
            {isConnected ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-terminal-green/50 bg-terminal-green/10 text-terminal-green hover:bg-terminal-green/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-terminal-green pulse-green" />
                    <span className="font-mono text-xs">{shortAddress}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border w-56">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="text-xs text-muted-foreground mb-1">Balance</div>
                    <div className="font-mono font-semibold">{nativeBalance} MATIC</div>
                  </div>
                  <DropdownMenuItem onClick={copyAddress} className="gap-2 font-mono text-xs">
                    <Copy className="w-3 h-3" />
                    Copiar dirección
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="gap-2 font-mono text-xs"
                    onClick={() => window.open(`https://polygonscan.com/address/${address}`, "_blank")}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver en PolygonScan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="gap-2 font-mono text-xs text-terminal-red"
                    onClick={disconnect}
                  >
                    <LogOut className="w-3 h-3" />
                    Desconectar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={connect}
                disabled={isConnecting}
                className="gap-2 bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold glow-green"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Conectar
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Menú móvil */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menú móvil expandido */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`block px-4 py-3 rounded-lg font-medium transition-all ${
                      location === link.href
                        ? "bg-primary/10 text-terminal-green"
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              <div className="pt-4 mt-2 border-t border-border/50">
                {isConnected ? (
                  <div className="space-y-2">
                    <div className="px-4 py-2 rounded-lg bg-card/50">
                      <div className="text-xs text-muted-foreground mb-1">Conectado</div>
                      <div className="font-mono text-sm text-terminal-green">{shortAddress}</div>
                      <div className="font-mono text-xs text-muted-foreground mt-1">{nativeBalance} MATIC</div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-terminal-red/50 text-terminal-red"
                      onClick={() => {
                        disconnect();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Desconectar
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      connect();
                      setMobileMenuOpen(false);
                    }}
                    disabled={isConnecting}
                    className="w-full gap-2 bg-terminal-green hover:bg-terminal-green/90 text-black font-semibold"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Conectar Wallet
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
