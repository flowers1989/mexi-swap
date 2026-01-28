/**
 * Página de Launchpad - MexiSwap
 * DESIGN: Dark Terminal Hacker
 * - Fondo negro profundo (#0A0A0A)
 * - Verde terminal (#00D26A) para acentos positivos
 * - Cyan (#00D9FF) para elementos interactivos
 * - Sin mención de comisión 0% para MEXI
 * - Configuración de mínimo/máximo de compra por proyecto
 */

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, 
  Clock, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Percent,
  Lock,
  Unlock,
  Globe,
  Filter,
  Search,
  ChevronRight,
  Star,
  Award,
  Settings,
  X,
  Plus,
  ExternalLink
} from "lucide-react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useLaunchpad } from "@/hooks/useLaunchpad";
import { toast } from "sonner";
import { getTokenLogo } from "@/config/tokens";
import { CHAIN_LOGOS } from "@/config/chains";

// Tipos
interface ICOProject {
  id: number;
  name: string;
  symbol: string;
  logo: string;
  description: string;
  tokenPrice: number;
  softCap: number;
  hardCap: number;
  raised: number;
  participants: number;
  startTime: Date;
  endTime: Date;
  phase: "upcoming" | "private" | "presale" | "public" | "ended";
  status: "active" | "successful" | "failed";
  vestingDuration: number;
  vestingCliff: number;
  tgePercent: number;
  chain: string;
  chainKey: string;
  fee: number;
  minPurchase: number;
  maxPurchase: number;
  website: string;
  twitter: string;
  telegram: string;
  whitepaper: string;
  isWhitelisted: boolean;
  requiresKYC: boolean;
  totalSupply: number;
  saleAllocation: number;
}

// Datos de ejemplo de proyectos
const MOCK_PROJECTS: ICOProject[] = [
  {
    id: 1,
    name: "MexiSwap Token",
    symbol: "MEXI",
    logo: "/images/token-mexi.png",
    description: "Token nativo del ecosistema MexiSwap. Gobernanza, staking y rewards para la comunidad.",
    tokenPrice: 0.05,
    softCap: 500000,
    hardCap: 2000000,
    raised: 1250000,
    participants: 3420,
    startTime: new Date("2026-01-01"),
    endTime: new Date("2026-01-31"),
    phase: "public",
    status: "active",
    vestingDuration: 180,
    vestingCliff: 30,
    tgePercent: 25,
    chain: "Polygon",
    chainKey: "polygon",
    fee: 1.5,
    minPurchase: 50,
    maxPurchase: 50000,
    website: "https://mexiswap.io",
    twitter: "https://twitter.com/mexiswap",
    telegram: "https://t.me/mexiswap",
    whitepaper: "/docs/whitepaper.pdf",
    isWhitelisted: false,
    requiresKYC: false,
    totalSupply: 1000000000,
    saleAllocation: 15,
  },
  {
    id: 2,
    name: "DeFi Protocol X",
    symbol: "DPX",
    logo: "https://assets.coingecko.com/coins/images/24383/small/apecoin.jpg",
    description: "Protocolo DeFi de próxima generación con yield farming optimizado y estrategias automatizadas.",
    tokenPrice: 0.12,
    softCap: 300000,
    hardCap: 1000000,
    raised: 450000,
    participants: 1890,
    startTime: new Date("2026-01-10"),
    endTime: new Date("2026-02-10"),
    phase: "presale",
    status: "active",
    vestingDuration: 365,
    vestingCliff: 60,
    tgePercent: 15,
    chain: "Ethereum",
    chainKey: "ethereum",
    fee: 1.5,
    minPurchase: 100,
    maxPurchase: 25000,
    website: "https://defiprotocolx.io",
    twitter: "https://twitter.com/defiprotocolx",
    telegram: "https://t.me/defiprotocolx",
    whitepaper: "/docs/dpx-whitepaper.pdf",
    isWhitelisted: true,
    requiresKYC: true,
    totalSupply: 500000000,
    saleAllocation: 20,
  },
  {
    id: 3,
    name: "GameFi World",
    symbol: "GFW",
    logo: "https://assets.coingecko.com/coins/images/17980/small/axie-infinity.png",
    description: "Plataforma GameFi con NFTs y economía play-to-earn revolucionaria.",
    tokenPrice: 0.025,
    softCap: 200000,
    hardCap: 750000,
    raised: 0,
    participants: 0,
    startTime: new Date("2026-02-01"),
    endTime: new Date("2026-02-28"),
    phase: "upcoming",
    status: "active",
    vestingDuration: 270,
    vestingCliff: 45,
    tgePercent: 20,
    chain: "BNB Chain",
    chainKey: "bsc",
    fee: 1.5,
    minPurchase: 25,
    maxPurchase: 10000,
    website: "https://gamefiworld.io",
    twitter: "https://twitter.com/gamefiworld",
    telegram: "https://t.me/gamefiworld",
    whitepaper: "/docs/gfw-whitepaper.pdf",
    isWhitelisted: true,
    requiresKYC: false,
    totalSupply: 2000000000,
    saleAllocation: 12,
  },
  {
    id: 4,
    name: "AI Trading Bot",
    symbol: "AITB",
    logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
    description: "Bot de trading impulsado por IA con estrategias automatizadas y machine learning.",
    tokenPrice: 0.08,
    softCap: 400000,
    hardCap: 1500000,
    raised: 1500000,
    participants: 5230,
    startTime: new Date("2025-12-01"),
    endTime: new Date("2025-12-31"),
    phase: "ended",
    status: "successful",
    vestingDuration: 180,
    vestingCliff: 30,
    tgePercent: 30,
    chain: "Avalanche",
    chainKey: "avalanche",
    fee: 1.5,
    minPurchase: 75,
    maxPurchase: 30000,
    website: "https://aitradingbot.io",
    twitter: "https://twitter.com/aitradingbot",
    telegram: "https://t.me/aitradingbot",
    whitepaper: "/docs/aitb-whitepaper.pdf",
    isWhitelisted: false,
    requiresKYC: true,
    totalSupply: 100000000,
    saleAllocation: 25,
  },
  {
    id: 5,
    name: "MetaVerse Land",
    symbol: "MVL",
    logo: "https://assets.coingecko.com/coins/images/18323/small/arbit.png",
    description: "Plataforma de terrenos virtuales en el metaverso con integración DeFi.",
    tokenPrice: 0.15,
    softCap: 600000,
    hardCap: 2500000,
    raised: 1800000,
    participants: 4120,
    startTime: new Date("2025-11-15"),
    endTime: new Date("2025-12-15"),
    phase: "ended",
    status: "successful",
    vestingDuration: 240,
    vestingCliff: 60,
    tgePercent: 10,
    chain: "Polygon",
    chainKey: "polygon",
    fee: 1.5,
    minPurchase: 200,
    maxPurchase: 100000,
    website: "https://metaverseland.io",
    twitter: "https://twitter.com/metaverseland",
    telegram: "https://t.me/metaverseland",
    whitepaper: "/docs/mvl-whitepaper.pdf",
    isWhitelisted: true,
    requiresKYC: true,
    totalSupply: 750000000,
    saleAllocation: 18,
  },
];

// Estadísticas del launchpad
const LAUNCHPAD_STATS = {
  totalRaised: 15420000,
  totalProjects: 24,
  successRate: 92,
  avgROI: 340,
  totalParticipants: 45000,
};

export default function Launchpad() {
  const { isConnected, connect } = useWeb3();
  const { projects, loading, buyTokens } = useLaunchpad();
  const [selectedProject, setSelectedProject] = useState<ICOProject | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "ended">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Estado para crear nuevo launchpad
  const [newProject, setNewProject] = useState({
    name: "",
    symbol: "",
    description: "",
    tokenPrice: "",
    hardCap: "",
    minPurchase: "50",
    maxPurchase: "10000",
    vestingDuration: "180",
    tgePercent: "20",
    chain: "polygon",
  });

  // Filtrar proyectos (ahora desde el contrato)
  const filteredProjects = (projects.length > 0 ? projects : MOCK_PROJECTS).filter((project: any) => {
    const matchesFilter = filter === "all" || 
      (filter === "active" && (project.phase === "private" || project.phase === "presale" || project.phase === "public")) ||
      (filter === "upcoming" && project.phase === "upcoming") ||
      (filter === "ended" && project.phase === "ended");
    
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Calcular tiempo restante
  const getTimeRemaining = (endTime: Date) => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Finalizado";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Manejar compra
  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error("Conecta tu wallet primero");
      return;
    }

    if (!selectedProject) {
      toast.error("Selecciona un proyecto");
      return;
    }

    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount < selectedProject.minPurchase) {
      toast.error(`Mínimo de compra: $${selectedProject.minPurchase} DAI`);
      return;
    }

    if (amount > selectedProject.maxPurchase) {
      toast.error(`Máximo de compra: $${selectedProject.maxPurchase} DAI`);
      return;
    }

    // Convertir a BigInt para el contrato
    const amountBigInt = BigInt(Math.floor(amount * 1e18));
    const success = await buyTokens(selectedProject.id, amountBigInt);
    
    if (success) {
      setPurchaseAmount("");
      setSelectedProject(null);
    }
  };

  // Crear nuevo launchpad
  const handleCreateLaunchpad = () => {
    if (!isConnected) {
      toast.error("Conecta tu wallet primero");
      return;
    }

    if (!newProject.name || !newProject.symbol || !newProject.tokenPrice || !newProject.hardCap) {
      toast.error("Completa todos los campos requeridos");
      return;
    }

    const minPurchase = parseFloat(newProject.minPurchase);
    const maxPurchase = parseFloat(newProject.maxPurchase);

    if (minPurchase >= maxPurchase) {
      toast.error("El mínimo debe ser menor que el máximo de compra");
      return;
    }

    toast.success(`Launchpad de ${newProject.symbol} creado exitosamente`);
    setShowCreateModal(false);
    setNewProject({
      name: "",
      symbol: "",
      description: "",
      tokenPrice: "",
      hardCap: "",
      minPurchase: "50",
      maxPurchase: "10000",
      vestingDuration: "180",
      tgePercent: "20",
      chain: "polygon",
    });
  };

  // Obtener color de fase
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "private": return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "presale": return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "public": return "bg-[#00D26A]/20 text-[#00D26A] border-[#00D26A]/50";
      case "upcoming": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "ended": return "bg-gray-500/20 text-gray-400 border-gray-500/50";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  // Obtener texto de fase
  const getPhaseText = (phase: string) => {
    switch (phase) {
      case "private": return "Privada";
      case "presale": return "Preventa";
      case "public": return "Pública";
      case "upcoming": return "Próximo";
      case "ended": return "Finalizado";
      default: return phase;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-[#00D26A]/20 text-[#00D26A] border-[#00D26A]/50">
              <Rocket className="w-3 h-3 mr-1" />
              MexiSwap Launchpad
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Lanza tu <span className="text-[#00D26A]">Token</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Plataforma de lanzamiento de tokens multi-cadena con las comisiones más bajas del mercado.
              Las comisiones se distribuyen entre holders de MEXI y proveedores de liquidez.
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4 text-center">
                <DollarSign className="w-6 h-6 mx-auto mb-2 text-[#00D26A]" />
                <div className="text-2xl font-bold font-mono text-[#00D26A]">
                  ${(LAUNCHPAD_STATS.totalRaised / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-gray-500">Total Recaudado</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4 text-center">
                <Rocket className="w-6 h-6 mx-auto mb-2 text-[#00D9FF]" />
                <div className="text-2xl font-bold font-mono">
                  {LAUNCHPAD_STATS.totalProjects}
                </div>
                <div className="text-xs text-gray-500">Proyectos</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-[#00D26A]" />
                <div className="text-2xl font-bold font-mono">
                  {LAUNCHPAD_STATS.successRate}%
                </div>
                <div className="text-xs text-gray-500">Tasa de Éxito</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-[#00D26A]" />
                <div className="text-2xl font-bold font-mono">
                  {LAUNCHPAD_STATS.avgROI}%
                </div>
                <div className="text-xs text-gray-500">ROI Promedio</div>
              </CardContent>
            </Card>
            <Card className="bg-[#111] border-[#1a1a1a]">
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-[#00D9FF]" />
                <div className="text-2xl font-bold font-mono">
                  {(LAUNCHPAD_STATS.totalParticipants / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-gray-500">Participantes</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-[#00D26A] text-black" : "border-[#2a2a2a]"}
              >
                Todos
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
                className={filter === "active" ? "bg-[#00D26A] text-black" : "border-[#2a2a2a]"}
              >
                Activos
              </Button>
              <Button
                variant={filter === "upcoming" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("upcoming")}
                className={filter === "upcoming" ? "bg-[#00D26A] text-black" : "border-[#2a2a2a]"}
              >
                Próximos
              </Button>
              <Button
                variant={filter === "ended" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("ended")}
                className={filter === "ended" ? "bg-[#00D26A] text-black" : "border-[#2a2a2a]"}
              >
                Finalizados
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar proyecto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-[#111] border-[#2a2a2a]"
                />
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-[#00D26A] to-[#00D9FF] text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Launchpad
              </Button>
            </div>
          </div>

          {/* Grid de proyectos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className={`bg-[#111] border-[#1a1a1a] hover:border-[#00D26A]/50 transition-all cursor-pointer ${
                  selectedProject?.id === project.id ? "border-[#00D26A]" : ""
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-6">
                  {/* Header del proyecto */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={project.logo}
                        alt={project.name}
                        className="w-12 h-12 rounded-full bg-[#1a1a1a]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://assets.coingecko.com/coins/images/279/small/ethereum.png";
                        }}
                      />
                      <div>
                        <h3 className="font-bold text-lg">{project.name}</h3>
                        <p className="text-sm text-gray-400">${project.symbol}</p>
                      </div>
                    </div>
                    <Badge className={`${getPhaseColor(project.phase)} border`}>
                      {getPhaseText(project.phase)}
                    </Badge>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Recaudado</span>
                      <span className="font-mono text-[#00D26A]">
                        ${project.raised.toLocaleString()} / ${project.hardCap.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={(project.raised / project.hardCap) * 100}
                      className="h-2 bg-[#1a1a1a]"
                    />
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-[#0A0A0A] rounded-lg p-2">
                      <span className="text-gray-500 text-xs">Precio</span>
                      <p className="font-mono font-medium">${project.tokenPrice}</p>
                    </div>
                    <div className="bg-[#0A0A0A] rounded-lg p-2">
                      <span className="text-gray-500 text-xs">Participantes</span>
                      <p className="font-mono font-medium">{project.participants.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0A0A0A] rounded-lg p-2">
                      <span className="text-gray-500 text-xs">Min/Max Compra</span>
                      <p className="font-mono font-medium text-xs">
                        ${project.minPurchase} - ${project.maxPurchase.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#0A0A0A] rounded-lg p-2">
                      <span className="text-gray-500 text-xs">Tiempo</span>
                      <p className="font-mono font-medium text-[#00D9FF]">
                        {getTimeRemaining(project.endTime)}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <div className="flex items-center gap-1">
                      <img
                        src={CHAIN_LOGOS[project.chainKey] || CHAIN_LOGOS.polygon}
                        alt={project.chain}
                        className="w-4 h-4 rounded-full"
                      />
                      <span className="text-xs text-gray-400">{project.chain}</span>
                    </div>
                    {project.requiresKYC && (
                      <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                        <Shield className="w-3 h-3 mr-1" />
                        KYC
                      </Badge>
                    )}
                    {project.isWhitelisted && (
                      <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                        <Lock className="w-3 h-3 mr-1" />
                        Whitelist
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-[#00D9FF]/50 text-[#00D9FF]">
                      <Clock className="w-3 h-3 mr-1" />
                      Vesting {project.vestingDuration}d
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Panel de compra */}
          {selectedProject && (
            <Card className="bg-[#111] border-[#1a1a1a] mb-8">
              <CardHeader className="border-b border-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedProject.logo}
                      alt={selectedProject.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <CardTitle className="text-xl">{selectedProject.name}</CardTitle>
                      <p className="text-sm text-gray-400">${selectedProject.symbol}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProject(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Información del proyecto */}
                  <div>
                    <h4 className="font-semibold mb-4">Información del Proyecto</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                        <span className="text-gray-400">Precio del Token</span>
                        <span className="font-mono">${selectedProject.tokenPrice}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                        <span className="text-gray-400">Hard Cap</span>
                        <span className="font-mono">${selectedProject.hardCap.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                        <span className="text-gray-400">Recaudado</span>
                        <span className="font-mono text-[#00D26A]">${selectedProject.raised.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                        <span className="text-gray-400">Compra Mínima</span>
                        <span className="font-mono">${selectedProject.minPurchase} DAI</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                        <span className="text-gray-400">Compra Máxima</span>
                        <span className="font-mono">${selectedProject.maxPurchase.toLocaleString()} DAI</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                        <span className="text-gray-400">TGE</span>
                        <span className="font-mono">{selectedProject.tgePercent}%</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                        <span className="text-gray-400">Vesting</span>
                        <span className="font-mono">{selectedProject.vestingDuration} días</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#1a1a1a]">
                        <span className="text-gray-400">Comisión</span>
                        <span className="font-mono">{selectedProject.fee}%</span>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="flex gap-3 mt-4">
                      <a
                        href={selectedProject.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-[#00D9FF] hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                      <a
                        href={selectedProject.whitepaper}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-[#00D9FF] hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Whitepaper
                      </a>
                    </div>
                  </div>

                  {/* Formulario de compra */}
                  <div>
                    <h4 className="font-semibold mb-4">Comprar Tokens</h4>
                    
                    {selectedProject.phase === "ended" ? (
                      <div className="bg-[#0A0A0A] rounded-lg p-6 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[#00D26A]" />
                        <p className="text-lg font-medium">Venta Finalizada</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Este proyecto ha completado su venta exitosamente.
                        </p>
                      </div>
                    ) : selectedProject.phase === "upcoming" ? (
                      <div className="bg-[#0A0A0A] rounded-lg p-6 text-center">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                        <p className="text-lg font-medium">Próximamente</p>
                        <p className="text-sm text-gray-400 mt-2">
                          La venta comenzará el {selectedProject.startTime.toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-400">Cantidad (DAI)</Label>
                          <div className="relative mt-1">
                            <Input
                              type="number"
                              value={purchaseAmount}
                              onChange={(e) => setPurchaseAmount(e.target.value)}
                              placeholder={`Min: $${selectedProject.minPurchase}`}
                              className="pr-16 bg-[#0A0A0A] border-[#2a2a2a] text-lg font-mono"
                            />
                            <button
                              onClick={() => setPurchaseAmount(selectedProject.maxPurchase.toString())}
                              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[#2a2a2a] rounded text-xs text-[#00D26A] hover:bg-[#3a3a3a]"
                            >
                              MAX
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Mín: ${selectedProject.minPurchase} | Máx: ${selectedProject.maxPurchase.toLocaleString()}
                          </p>
                        </div>

                        {purchaseAmount && parseFloat(purchaseAmount) > 0 && (
                          <div className="bg-[#0A0A0A] rounded-lg p-4">
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-400">Tokens a recibir</span>
                              <span className="font-mono text-[#00D26A]">
                                {(parseFloat(purchaseAmount) / selectedProject.tokenPrice).toLocaleString()} {selectedProject.symbol}
                              </span>
                            </div>
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-400">En TGE ({selectedProject.tgePercent}%)</span>
                              <span className="font-mono">
                                {((parseFloat(purchaseAmount) / selectedProject.tokenPrice) * (selectedProject.tgePercent / 100)).toLocaleString()} {selectedProject.symbol}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Comisión</span>
                              <span className="font-mono">
                                ${(parseFloat(purchaseAmount) * (selectedProject.fee / 100)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {!isConnected ? (
                          <Button
                            onClick={connect}
                            className="w-full py-6 bg-gradient-to-r from-[#00D26A] to-[#00D9FF] text-black font-bold"
                          >
                            Conectar Wallet
                          </Button>
                        ) : (
                          <Button
                            onClick={handlePurchase}
                            className="w-full py-6 bg-[#00D26A] hover:bg-[#00D26A]/90 text-black font-bold"
                            disabled={!purchaseAmount || parseFloat(purchaseAmount) < selectedProject.minPurchase}
                          >
                            <Zap className="w-5 h-5 mr-2" />
                            Comprar {selectedProject.symbol}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información de comisiones */}
          <Card className="bg-[#111] border-[#1a1a1a]">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#00D26A]" />
                Estructura de Comisiones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0A0A0A] rounded-lg p-4">
                  <h4 className="font-medium mb-2">Comisión del Launchpad</h4>
                  <p className="text-3xl font-bold text-[#00D26A] font-mono">1.5%</p>
                  <p className="text-sm text-gray-400 mt-2">
                    La más baja del mercado para todos los proyectos
                  </p>
                </div>
                <div className="bg-[#0A0A0A] rounded-lg p-4">
                  <h4 className="font-medium mb-2">Distribución</h4>
                  <div className="space-y-2 mt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Holders de MEXI</span>
                      <span className="font-mono text-[#00D26A]">50%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Proveedores de Liquidez</span>
                      <span className="font-mono text-[#00D9FF]">50%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#0A0A0A] rounded-lg p-4">
                  <h4 className="font-medium mb-2">Beneficios</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00D26A]" />
                      Multi-cadena soportado
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00D26A]" />
                      Vesting configurable
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#00D26A]" />
                      KYC opcional
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modal de crear launchpad */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#111] border-[#1a1a1a] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-[#1a1a1a]">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-[#00D26A]" />
                  Crear Nuevo Launchpad
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre del Proyecto *</Label>
                    <Input
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="Mi Token"
                      className="mt-1 bg-[#0A0A0A] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <Label>Símbolo *</Label>
                    <Input
                      value={newProject.symbol}
                      onChange={(e) => setNewProject({ ...newProject, symbol: e.target.value.toUpperCase() })}
                      placeholder="MTK"
                      className="mt-1 bg-[#0A0A0A] border-[#2a2a2a]"
                    />
                  </div>
                </div>

                <div>
                  <Label>Descripción</Label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Describe tu proyecto..."
                    className="w-full mt-1 p-3 bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg text-white resize-none h-24"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio del Token (USD) *</Label>
                    <Input
                      type="number"
                      value={newProject.tokenPrice}
                      onChange={(e) => setNewProject({ ...newProject, tokenPrice: e.target.value })}
                      placeholder="0.05"
                      className="mt-1 bg-[#0A0A0A] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <Label>Hard Cap (USD) *</Label>
                    <Input
                      type="number"
                      value={newProject.hardCap}
                      onChange={(e) => setNewProject({ ...newProject, hardCap: e.target.value })}
                      placeholder="1000000"
                      className="mt-1 bg-[#0A0A0A] border-[#2a2a2a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Compra Mínima (DAI) *</Label>
                    <Input
                      type="number"
                      value={newProject.minPurchase}
                      onChange={(e) => setNewProject({ ...newProject, minPurchase: e.target.value })}
                      placeholder="50"
                      className="mt-1 bg-[#0A0A0A] border-[#2a2a2a]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Mínimo que puede comprar cada usuario</p>
                  </div>
                  <div>
                    <Label>Compra Máxima (DAI) *</Label>
                    <Input
                      type="number"
                      value={newProject.maxPurchase}
                      onChange={(e) => setNewProject({ ...newProject, maxPurchase: e.target.value })}
                      placeholder="10000"
                      className="mt-1 bg-[#0A0A0A] border-[#2a2a2a]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo que puede comprar cada usuario</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vesting (días)</Label>
                    <Input
                      type="number"
                      value={newProject.vestingDuration}
                      onChange={(e) => setNewProject({ ...newProject, vestingDuration: e.target.value })}
                      placeholder="180"
                      className="mt-1 bg-[#0A0A0A] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <Label>TGE (%)</Label>
                    <Input
                      type="number"
                      value={newProject.tgePercent}
                      onChange={(e) => setNewProject({ ...newProject, tgePercent: e.target.value })}
                      placeholder="20"
                      className="mt-1 bg-[#0A0A0A] border-[#2a2a2a]"
                    />
                  </div>
                </div>

                <div>
                  <Label>Blockchain</Label>
                  <select
                    value={newProject.chain}
                    onChange={(e) => setNewProject({ ...newProject, chain: e.target.value })}
                    className="w-full mt-1 p-3 bg-[#0A0A0A] border border-[#2a2a2a] rounded-lg text-white"
                  >
                    <option value="polygon">Polygon</option>
                    <option value="ethereum">Ethereum</option>
                    <option value="bsc">BNB Chain</option>
                    <option value="avalanche">Avalanche</option>
                  </select>
                </div>

                <div className="bg-[#0A0A0A] rounded-lg p-4">
                  <h4 className="font-medium mb-2">Resumen de Comisiones</h4>
                  <p className="text-sm text-gray-400">
                    Comisión del launchpad: <span className="text-[#00D26A] font-mono">1.5%</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Las comisiones se distribuyen 50% a holders de MEXI y 50% a proveedores de liquidez.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 border-[#2a2a2a]"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateLaunchpad}
                    className="flex-1 bg-[#00D26A] hover:bg-[#00D26A]/90 text-black font-bold"
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Crear Launchpad
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
}
