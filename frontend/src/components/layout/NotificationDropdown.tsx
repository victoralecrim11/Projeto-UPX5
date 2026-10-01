import React, { useRef, useEffect } from 'react';
import { Bell, CheckCheck, AlertOctagon, Target, Info, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../lib/calculations';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead, navigateTo } =
    useApp();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    markNotificationRead(notif.id);
    if (notif.alertId) {
      navigateTo('alertas', notif.alertId);
    }
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-100">
            Notificações do Sistema
          </span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white font-mono">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Marcar lidas</span>
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nenhuma notificação registrada.
          </div>
        ) : (
          notifications.map((notif) => {
            const isAlert = notif.type === 'ALERTA';
            const isMeta = notif.type === 'META';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 text-xs cursor-pointer transition-colors hover:bg-slate-800/60 ${
                  !notif.read ? 'bg-slate-800/30' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {isAlert ? (
                      <AlertOctagon className="w-4 h-4 text-red-400" />
                    ) : isMeta ? (
                      <Target className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          !notif.read ? 'font-semibold text-slate-100' : 'text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-mono">
                      <span>{formatDateTime(notif.timestamp)}</span>
                      {notif.alertId && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-400 font-sans font-medium">
                          <span>Ver alerta</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/60 text-center">
        <button
          onClick={() => {
            navigateTo('alertas');
            onClose();
          }}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Visualizar central de alertas
        </button>
      </div>
    </div>
  );
};
