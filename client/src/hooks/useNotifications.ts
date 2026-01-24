/**
 * Hook de Notificaciones - MexiSwap
 * Sistema de notificaciones push para alertas de precio, liquidaciones y órdenes
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "price_alert" | "liquidation_warning" | "order_executed" | "position_update" | "system";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: "above" | "below";
  active: boolean;
  createdAt: Date;
}

export interface LiquidationAlert {
  positionId: string;
  symbol: string;
  healthFactor: number;
  liquidationPrice: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  // Verificar soporte de notificaciones
  useEffect(() => {
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Actualizar contador de no leídas
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  // Solicitar permiso de notificaciones
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Tu navegador no soporta notificaciones push");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("Notificaciones activadas");
        return true;
      } else {
        toast.error("Permiso de notificaciones denegado");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  // Enviar notificación push
  const sendPushNotification = useCallback((title: string, body: string, icon?: string) => {
    if (permission !== "granted") return;

    try {
      new Notification(title, {
        body,
        icon: icon || "/images/token-mexi.png",
        badge: "/images/token-mexi.png",
        tag: `mexiswap-${Date.now()}`,
        requireInteraction: false,
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }, [permission]);

  // Agregar notificación
  const addNotification = useCallback((
    type: Notification["type"],
    title: string,
    message: string,
    data?: Record<string, unknown>
  ) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false,
      data,
    };

    setNotifications((prev) => [notification, ...prev].slice(0, 100)); // Mantener últimas 100

    // Mostrar toast
    switch (type) {
      case "price_alert":
        toast.info(title, { description: message });
        break;
      case "liquidation_warning":
        toast.warning(title, { description: message });
        break;
      case "order_executed":
        toast.success(title, { description: message });
        break;
      case "position_update":
        toast.info(title, { description: message });
        break;
      default:
        toast(title, { description: message });
    }

    // Enviar push si está habilitado
    if (permission === "granted") {
      sendPushNotification(title, message);
    }

    return notification.id;
  }, [permission, sendPushNotification]);

  // Marcar como leída
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Eliminar notificación
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Limpiar todas las notificaciones
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Crear alerta de precio
  const createPriceAlert = useCallback((
    symbol: string,
    targetPrice: number,
    condition: "above" | "below"
  ) => {
    const alert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      targetPrice,
      condition,
      active: true,
      createdAt: new Date(),
    };

    setPriceAlerts((prev) => [...prev, alert]);
    toast.success(`Alerta creada: ${symbol} ${condition === "above" ? ">" : "<"} $${targetPrice}`);
    
    return alert.id;
  }, []);

  // Eliminar alerta de precio
  const removePriceAlert = useCallback((id: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.info("Alerta eliminada");
  }, []);

  // Toggle alerta de precio
  const togglePriceAlert = useCallback((id: string) => {
    setPriceAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a))
    );
  }, []);

  // Verificar alertas de precio (llamar con precios actuales)
  const checkPriceAlerts = useCallback((prices: Record<string, number>) => {
    priceAlerts.forEach((alert) => {
      if (!alert.active) return;

      const currentPrice = prices[alert.symbol];
      if (!currentPrice) return;

      const triggered =
        (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
        (alert.condition === "below" && currentPrice <= alert.targetPrice);

      if (triggered) {
        addNotification(
          "price_alert",
          `Alerta de Precio: ${alert.symbol}`,
          `${alert.symbol} ha ${alert.condition === "above" ? "superado" : "caído por debajo de"} $${alert.targetPrice}. Precio actual: $${currentPrice.toFixed(2)}`,
          { symbol: alert.symbol, price: currentPrice, targetPrice: alert.targetPrice }
        );

        // Desactivar alerta después de dispararse
        togglePriceAlert(alert.id);
      }
    });
  }, [priceAlerts, addNotification, togglePriceAlert]);

  // Alerta de liquidación
  const sendLiquidationWarning = useCallback((alert: LiquidationAlert) => {
    addNotification(
      "liquidation_warning",
      `⚠️ Riesgo de Liquidación: ${alert.symbol}`,
      `Tu posición de ${alert.symbol} está cerca del precio de liquidación ($${alert.liquidationPrice.toFixed(2)}). Health Factor: ${alert.healthFactor.toFixed(2)}`,
      { ...alert }
    );
  }, [addNotification]);

  // Notificación de orden ejecutada
  const sendOrderExecuted = useCallback((
    symbol: string,
    side: "long" | "short",
    size: number,
    price: number,
    orderType: "market" | "limit" | "stop"
  ) => {
    addNotification(
      "order_executed",
      `Orden Ejecutada: ${symbol}`,
      `${side.toUpperCase()} ${size} ${symbol} @ $${price.toFixed(2)} (${orderType})`,
      { symbol, side, size, price, orderType }
    );
  }, [addNotification]);

  // Notificación de actualización de posición
  const sendPositionUpdate = useCallback((
    symbol: string,
    action: "opened" | "closed" | "liquidated" | "tp_hit" | "sl_hit",
    pnl?: number
  ) => {
    const messages: Record<string, string> = {
      opened: `Posición abierta en ${symbol}`,
      closed: `Posición cerrada en ${symbol}${pnl !== undefined ? `. PnL: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}` : ""}`,
      liquidated: `⚠️ Posición liquidada en ${symbol}`,
      tp_hit: `🎯 Take Profit alcanzado en ${symbol}${pnl !== undefined ? `. PnL: +$${pnl.toFixed(2)}` : ""}`,
      sl_hit: `🛑 Stop Loss alcanzado en ${symbol}${pnl !== undefined ? `. PnL: $${pnl.toFixed(2)}` : ""}`,
    };

    addNotification(
      "position_update",
      action === "liquidated" ? "Posición Liquidada" : "Actualización de Posición",
      messages[action],
      { symbol, action, pnl }
    );
  }, [addNotification]);

  return {
    // Estado
    notifications,
    priceAlerts,
    unreadCount,
    isSupported,
    permission,
    
    // Acciones de notificaciones
    requestPermission,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    
    // Acciones de alertas de precio
    createPriceAlert,
    removePriceAlert,
    togglePriceAlert,
    checkPriceAlerts,
    
    // Notificaciones específicas
    sendLiquidationWarning,
    sendOrderExecuted,
    sendPositionUpdate,
  };
}
