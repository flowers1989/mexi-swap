/*
 * DESIGN: Dark Terminal Hacker
 * - Footer tipo terminal con status de conexión
 * - Links a documentación y redes sociales
 * - Indicadores de estado del sistema
 */

import { Link } from "wouter";
import { Github, Twitter, MessageCircle, FileText, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      {/* Status bar tipo terminal */}
      <div className="border-b border-border/30 bg-background/50">
        <div className="container py-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-terminal-green pulse-green" />
                <span className="text-muted-foreground">Sistema:</span>
                <span className="text-terminal-green">Operativo</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-muted-foreground">Red:</span>
                <span className="text-terminal-cyan">Polygon Mainnet</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-muted-foreground">Bloque:</span>
                <span className="text-white">#52,847,291</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Gas:</span>
              <span className="text-terminal-green">32 gwei</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal del footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src="/images/token-mexi.png" alt="MexiSwap" className="w-8 h-8" />
              <span className="font-display font-bold text-lg">
                Mexi<span className="text-terminal-green">Swap</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El DEX más agresivo en Polygon. Intercambia, provee liquidez y gana recompensas MEXI.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a 
                href="#" 
                className="p-2 rounded-lg bg-card hover:bg-white/5 text-muted-foreground hover:text-terminal-cyan transition-colors"
                onClick={(e) => { e.preventDefault(); }}
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-card hover:bg-white/5 text-muted-foreground hover:text-terminal-cyan transition-colors"
                onClick={(e) => { e.preventDefault(); }}
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-card hover:bg-white/5 text-muted-foreground hover:text-terminal-cyan transition-colors"
                onClick={(e) => { e.preventDefault(); }}
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Productos */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">Productos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/swap" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors">
                  Swap
                </Link>
              </li>
              <li>
                <Link href="/pool" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors">
                  Pools de Liquidez
                </Link>
              </li>
              <li>
                <Link href="/migrate" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors">
                  Migración de LP
                </Link>
              </li>
              <li>
                <Link href="/tokenomics" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors">
                  Token MEXI
                </Link>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors flex items-center gap-1">
                  Documentación
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors flex items-center gap-1">
                  Whitepaper
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors flex items-center gap-1">
                  Auditorías
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors flex items-center gap-1">
                  GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Comunidad */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-white">Comunidad</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors flex items-center gap-1">
                  Discord
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors flex items-center gap-1">
                  Twitter
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors flex items-center gap-1">
                  Telegram
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-terminal-cyan transition-colors flex items-center gap-1">
                  Gobernanza
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-border/30">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 MexiSwap. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-terminal-cyan transition-colors">
                Términos de Servicio
              </a>
              <a href="#" className="hover:text-terminal-cyan transition-colors">
                Política de Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
