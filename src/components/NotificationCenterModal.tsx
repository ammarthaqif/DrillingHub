import React, { useState, useMemo } from 'react';
import { useDrilling } from '../context/DrillingContext';
import { SystemNotification, NotificationCategory } from '../types/drilling';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ShieldCheck, 
  Truck, 
  Clock, 
  DollarSign, 
  HardHat, 
  Layers, 
  ArrowRight,
  Filter
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    clearNotification,
    unreadNotificationCount 
  } = useDrilling();

  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'ALL'>('ALL');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
      if (filterUnreadOnly && n.isRead) return false;
      return true;
    });
  }, [notifications, selectedCategory, filterUnreadOnly]);

  const getIconForCategory = (cat: NotificationCategory, severity: SystemNotification['severity']) => {
    switch (cat) {
      case 'INSPECTION':
        return <HardHat className="w-4 h-4 text-amber-400" />;
      case 'TRANSFER':
        return <Truck className="w-4 h-4 text-emerald-400" />;
      case 'BACKLOAD':
        return <Clock className="w-4 h-4 text-cyan-400" />;
      case 'FINANCE_COST':
        return <DollarSign className="w-4 h-4 text-purple-400" />;
      case 'SECURITY_RBAC':
        return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      default:
        return severity === 'error' ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleActionClick = (notif: SystemNotification) => {
    markNotificationRead(notif.id);
    if (notif.linkNav && onNavigateTab) {
      onNavigateTab(notif.linkNav);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0e0e12] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">System Notification Center</h3>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                    {unreadNotificationCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">Operational alerts, QA/QC certification notices, and approvals</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition text-sm"
          >
            ✕
          </button>
        </div>

        {/* Controls & Filter Bar */}
        <div className="px-6 py-3 border-b border-white/5 bg-black/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'ALL'
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('INSPECTION')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'INSPECTION'
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Inspection
            </button>
            <button
              onClick={() => setSelectedCategory('TRANSFER')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'TRANSFER'
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Transfers
            </button>
            <button
              onClick={() => setSelectedCategory('FINANCE_COST')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedCategory === 'FINANCE_COST'
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              Cost & AFE
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterUnreadOnly(!filterUnreadOnly)}
              className={`px-2.5 py-1 rounded-lg text-xs border transition ${
                filterUnreadOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-gray-400 border-white/10'
              }`}
            >
              Unread only
            </button>

            {unreadNotificationCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 flex items-center space-x-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-6 overflow-y-auto divide-y divide-white/5 space-y-2 flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-gray-600 opacity-50" />
              <p className="text-xs">No active notifications matching filter criteria.</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl transition border flex items-start justify-between gap-3 ${
                  notif.isRead 
                    ? 'bg-white/[0.02] border-white/5 opacity-75' 
                    : 'bg-amber-500/[0.04] border-amber-500/20'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 shrink-0 mt-0.5">
                    {getIconForCategory(notif.category, notif.severity)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{notif.title}</span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.linkNav && (
                      <button
                        onClick={() => handleActionClick(notif)}
                        className="inline-flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold mt-1"
                      >
                        <span>View in Module</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => markNotificationRead(notif.id)}
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => clearNotification(notif.id)}
                    className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 transition"
                    title="Dismiss"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-gray-400">
          <span>DrillCore Live Telemetry & Event Listener</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
