/**
 * Centro de Notificaciones - MexiSwap
 * DESIGN: Dark Terminal Hacker
 * Panel de notificaciones con alertas de precio y actualizaciones
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Activity,
  Settings,
  Plus,
  X,
} from "lucide-react";
import { useNotifications, Notification, PriceAlert } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function NotificationCenter() {
  const {
    notifications,
    priceAlerts,
    unreadCount,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    createPriceAlert,
    removePriceAlert,
    togglePriceAlert,
  } = useNotifications();

  const [showAlertForm, setShowAlertForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    symbol: "ETH",
    targetPrice: "",
    condition: "above" as "above" | "below",
  });

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "price_alert":
        return <TrendingUp className="w-4 h-4 text-[#00D9FF]" />;
      case "liquidation_warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case "order_executed":
        return <Zap className="w-4 h-4 text-[#00D26A]" />;
      case "position_update":
        return <Activity className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  // Crear nueva alerta
  const handleCreateAlert = () => {
    const price = parseFloat(newAlert.targetPrice);
    if (isNaN(price) || price <= 0) return;

    createPriceAlert(newAlert.symbol, price, newAlert.condition);
    setNewAlert({ symbol: "ETH", targetPrice: "", condition: "above" });
    setShowAlertForm(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-[#FF4757] text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 bg-[#111] border-[#2a2a2a] max-h-[500px] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[#2a2a2a]">
          <h3 className="font-semibold">Notificaciones</h3>
          <div className="flex items-center gap-2">
            {permission !== "granted" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={requestPermission}
                className="text-xs text-[#00D9FF]"
              >
                <Bell className="w-3 h-3 mr-1" />
                Activar
              </Button>
            )}
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={markAllAsRead}
                  className="h-7 w-7"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearAll}
                  className="h-7 w-7 text-red-400 hover:text-red-300"
                  title="Limpiar todas"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a2a2a]">
          <button
            className={`flex-1 py-2 text-sm ${!showAlertForm ? "text-[#00D26A] border-b-2 border-[#00D26A]" : "text-gray-400"}`}
            onClick={() => setShowAlertForm(false)}
          >
            Notificaciones
          </button>
          <button
            className={`flex-1 py-2 text-sm ${showAlertForm ? "text-[#00D26A] border-b-2 border-[#00D26A]" : "text-gray-400"}`}
            onClick={() => setShowAlertForm(true)}
          >
            Alertas de Precio
          </button>
        </div>

        {/* Contenido */}
        <div className="max-h-[350px] overflow-y-auto">
          {!showAlertForm ? (
            // Lista de notificaciones
            notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellOff className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1a1a1a]">
                {notifications.slice(0, 20).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 hover:bg-[#1a1a1a] transition-colors ${
                      !notif.read ? "bg-[#0A0A0A]" : ""
                    }`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{notif.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notif.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Alertas de precio
            <div className="p-3">
              {/* Formulario para crear alerta */}
              <div className="bg-[#0A0A0A] rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#00D26A]" />
                  Nueva Alerta de Precio
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-gray-400">Token</Label>
                      <select
                        value={newAlert.symbol}
                        onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
                        className="w-full mt-1 p-2 bg-[#111] border border-[#2a2a2a] rounded text-sm"
                      >
                        <option value="ETH">ETH</option>
                        <option value="BTC">BTC</option>
                        <option value="SOL">SOL</option>
                        <option value="MATIC">MATIC</option>
                        <option value="BNB">BNB</option>
                        <option value="AVAX">AVAX</option>
                        <option value="LINK">LINK</option>
                        <option value="MEXI">MEXI</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Condición</Label>
                      <select
                        value={newAlert.condition}
                        onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as "above" | "below" })}
                        className="w-full mt-1 p-2 bg-[#111] border border-[#2a2a2a] rounded text-sm"
                      >
                        <option value="above">Por encima de</option>
                        <option value="below">Por debajo de</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Precio Objetivo (USD)</Label>
                    <Input
                      type="number"
                      value={newAlert.targetPrice}
                      onChange={(e) => setNewAlert({ ...newAlert, targetPrice: e.target.value })}
                      placeholder="0.00"
                      className="mt-1 bg-[#111] border-[#2a2a2a]"
                    />
                  </div>
                  <Button
                    onClick={handleCreateAlert}
                    className="w-full bg-[#00D26A] hover:bg-[#00D26A]/90 text-black"
                    disabled={!newAlert.targetPrice}
                  >
                    Crear Alerta
                  </Button>
                </div>
              </div>

              {/* Lista de alertas activas */}
              <h4 className="text-sm font-medium mb-2">Alertas Activas</h4>
              {priceAlerts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay alertas configuradas
                </p>
              ) : (
                <div className="space-y-2">
                  {priceAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        alert.active ? "bg-[#0A0A0A]" : "bg-[#0A0A0A]/50 opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {alert.condition === "above" ? (
                          <TrendingUp className="w-4 h-4 text-[#00D26A]" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-[#FF4757]" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{alert.symbol}</p>
                          <p className="text-xs text-gray-400">
                            {alert.condition === "above" ? ">" : "<"} ${alert.targetPrice}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => togglePriceAlert(alert.id)}
                        >
                          {alert.active ? (
                            <Bell className="w-4 h-4 text-[#00D26A]" />
                          ) : (
                            <BellOff className="w-4 h-4 text-gray-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400"
                          onClick={() => removePriceAlert(alert.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
