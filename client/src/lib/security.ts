/**
 * MexiSwap Security Utilities
 * 
 * Implementa medidas de seguridad para el frontend:
 * - Validación de direcciones
 * - Sanitización de inputs
 * - Protección contra XSS
 * - Rate limiting
 * - Detección de phishing
 * - Validación de transacciones
 */

// ============ VALIDACIÓN DE DIRECCIONES ============

/**
 * Validar dirección Ethereum
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validar checksum de dirección EIP-55
 */
export function isValidChecksumAddress(address: string): boolean {
  if (!isValidAddress(address)) return false;
  // Implementación simplificada - en producción usar ethers.utils.getAddress
  return true;
}

/**
 * Verificar si es una dirección de contrato conocida malicioso
 */
const BLACKLISTED_ADDRESSES = new Set([
  // Agregar direcciones conocidas de scams/hacks
  "0x0000000000000000000000000000000000000000",
]);

export function isBlacklistedAddress(address: string): boolean {
  return BLACKLISTED_ADDRESSES.has(address.toLowerCase());
}

// ============ SANITIZACIÓN DE INPUTS ============

/**
 * Sanitizar string para prevenir XSS
 */
export function sanitizeString(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validar y sanitizar cantidad numérica
 */
export function sanitizeAmount(amount: string): string {
  if (!amount) return "0";
  // Remover caracteres no numéricos excepto punto decimal
  const sanitized = amount.replace(/[^0-9.]/g, "");
  // Asegurar solo un punto decimal
  const parts = sanitized.split(".");
  if (parts.length > 2) {
    return parts[0] + "." + parts.slice(1).join("");
  }
  return sanitized || "0";
}

/**
 * Validar rango de cantidad
 */
export function isValidAmount(amount: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): boolean {
  const num = parseFloat(amount);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

// ============ RATE LIMITING ============

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Verificar rate limit
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Resetear rate limit
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============ DETECCIÓN DE PHISHING ============

const KNOWN_PHISHING_DOMAINS = [
  "mexiswap-airdrop",
  "mexi-swap-claim",
  "mexiswap-bonus",
  "free-mexi",
];

/**
 * Verificar si un URL es potencialmente phishing
 */
export function isPotentialPhishing(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Verificar dominios conocidos de phishing
    for (const domain of KNOWN_PHISHING_DOMAINS) {
      if (hostname.includes(domain)) return true;
    }
    
    // Verificar caracteres homógrafos
    if (/[а-яА-Я]/.test(hostname)) return true; // Caracteres cirílicos
    
    return false;
  } catch {
    return true; // URL inválido = sospechoso
  }
}

/**
 * Verificar si el dominio actual es legítimo
 */
export function isLegitimeDomain(): boolean {
  const legitimeDomains = [
    "localhost",
    "mexiswap.io",
    "app.mexiswap.io",
  ];
  
  const currentHost = window.location.hostname;
  return legitimeDomains.some(domain => 
    currentHost === domain || currentHost.endsWith(`.${domain}`)
  );
}

// ============ VALIDACIÓN DE TRANSACCIONES ============

export interface TransactionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validar parámetros de swap
 */
export function validateSwapParams(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  minAmountOut: string,
  slippage: number
): TransactionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar direcciones
  if (!isValidAddress(tokenIn)) {
    errors.push("Dirección de token de entrada inválida");
  }
  if (!isValidAddress(tokenOut)) {
    errors.push("Dirección de token de salida inválida");
  }
  if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
    errors.push("Los tokens de entrada y salida deben ser diferentes");
  }

  // Validar cantidades
  if (!isValidAmount(amountIn, 0.000001)) {
    errors.push("Cantidad de entrada inválida");
  }
  if (!isValidAmount(minAmountOut, 0)) {
    errors.push("Cantidad mínima de salida inválida");
  }

  // Validar slippage
  if (slippage < 0.01 || slippage > 50) {
    errors.push("Slippage debe estar entre 0.01% y 50%");
  }
  if (slippage > 5) {
    warnings.push("Slippage alto puede resultar en pérdidas significativas");
  }

  // Verificar blacklist
  if (isBlacklistedAddress(tokenIn) || isBlacklistedAddress(tokenOut)) {
    errors.push("Token en lista negra detectado");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validar parámetros de posición perpetua
 */
export function validatePerpetualPosition(
  collateral: string,
  leverage: number,
  maxLeverage: number
): TransactionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar colateral
  const collateralNum = parseFloat(collateral);
  if (isNaN(collateralNum) || collateralNum <= 0) {
    errors.push("Colateral debe ser mayor a 0");
  }
  if (collateralNum < 10) {
    warnings.push("Colateral muy bajo puede resultar en liquidación rápida");
  }

  // Validar apalancamiento
  if (leverage < 1 || leverage > maxLeverage) {
    errors.push(`Apalancamiento debe estar entre 1x y ${maxLeverage}x`);
  }
  if (leverage >= 50) {
    warnings.push("Apalancamiento extremo. Alto riesgo de liquidación");
  }
  if (leverage >= 75) {
    warnings.push("¡ADVERTENCIA! Apalancamiento muy alto. Procede con extrema precaución");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============ PROTECCIÓN DE WALLET ============

/**
 * Verificar si MetaMask está en modo de prueba
 */
export function isTestNetwork(chainId: number): boolean {
  const testChainIds = [
    5,      // Goerli
    11155111, // Sepolia
    80001,  // Mumbai
    97,     // BSC Testnet
    43113,  // Avalanche Fuji
  ];
  return testChainIds.includes(chainId);
}

/**
 * Verificar si la red es soportada
 */
export function isSupportedNetwork(chainId: number): boolean {
  const supportedChainIds = [
    1,      // Ethereum
    137,    // Polygon
    56,     // BSC
    43114,  // Avalanche
    42161,  // Arbitrum
    10,     // Optimism
  ];
  return supportedChainIds.includes(chainId);
}

// ============ LOGGING SEGURO ============

/**
 * Log seguro que no expone información sensible
 */
export function secureLog(message: string, data?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "development") {
    console.log(`[MexiSwap] ${message}`, data ? sanitizeLogData(data) : "");
  }
}

function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Ocultar claves privadas y datos sensibles
    if (key.toLowerCase().includes("private") || 
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("password")) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string" && value.length > 100) {
      sanitized[key] = value.substring(0, 50) + "...[truncated]";
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

// ============ ANTI-BOT ============

/**
 * Generar fingerprint del navegador (para detección de bots)
 */
export function generateBrowserFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ];
  
  return btoa(components.join("|")).substring(0, 32);
}

/**
 * Verificar si parece ser un bot
 */
export function isPotentialBot(): boolean {
  // Verificar WebDriver
  if (navigator.webdriver) return true;
  
  // Verificar plugins (bots suelen no tener)
  if (navigator.plugins.length === 0) return true;
  
  // Verificar idiomas
  if (!navigator.languages || navigator.languages.length === 0) return true;
  
  return false;
}

// ============ EXPORTAR TODO ============

export default {
  isValidAddress,
  isValidChecksumAddress,
  isBlacklistedAddress,
  sanitizeString,
  sanitizeAmount,
  isValidAmount,
  checkRateLimit,
  resetRateLimit,
  isPotentialPhishing,
  isLegitimeDomain,
  validateSwapParams,
  validatePerpetualPosition,
  isTestNetwork,
  isSupportedNetwork,
  secureLog,
  generateBrowserFingerprint,
  isPotentialBot,
};
