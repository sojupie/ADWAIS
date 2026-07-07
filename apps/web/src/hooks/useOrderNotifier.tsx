import { getApiFinancialOrders, useGetApiFinancialOrders } from '../api/generated/endpoints';
import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingBag, X } from 'lucide-react';
import { useKiosk } from '../components/common/dashboard/KioskContext';

export function useOrderNotifier() {
  const { pathname } = useLocation();
  const isSettings = pathname.startsWith('/settings');
  const queryClient = useQueryClient();
  const { notificationsEnabled } = useKiosk();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-SE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const [lastCheckedTime, setLastCheckedTime] = useState<string>(() => new Date().toISOString());

  useGetApiFinancialOrders(
    { dateSince: lastCheckedTime },
    {
      query: {
        enabled: !isSettings,
        refetchInterval: 30000,
        staleTime: 0,
        queryFn: async ({ signal }) => {
          const res = await getApiFinancialOrders({ dateSince: lastCheckedTime }, { signal });
          
          if (res && res.data && res.data.length > 0) {
            const newOrders = res.data.filter(
              (order) => order.createdDate && order.createdDate > lastCheckedTime
            );

            if (newOrders.length > 0) {
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['financial'] });
                queryClient.invalidateQueries({ queryKey: ['system-health'] });

                newOrders.forEach((order) => {
                  const displayValue = order.totalValueIncVat 
                    ? `${order.totalValueIncVat.toLocaleString()} ${order.currency || 'SEK'}`
                    : 'N/A';

                  if (notificationsEnabled) {
                    toast.custom(
                      (t) => (
                        <div 
                          className="w-[480px] min-w-[480px] bg-brand-bg-secondary text-white rounded-2xl p-6 shadow-2xl border border-brand-link/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Animated Bouncing Shopping Bag Icon styled with brand accent yellow */}
                          <div className="w-16 h-16 rounded-xl bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent shrink-0">
                            <ShoppingBag className="w-8 h-8 animate-bounce" />
                          </div>
                          {/* Order Info */}
                          <div className="flex-grow min-w-0 text-left">
                            <div className="text-sm uppercase font-black tracking-widest text-brand-accent font-mono">
                              New Order Placed
                            </div>
                            <div className="text-xl font-black truncate mt-1 text-white">
                              {order.tenantName || 'Unknown Tenant'}
                            </div>
                            <div className="text-sm text-white/60 mt-2 font-mono">
                              {formatDate(order.createdDate)}
                            </div>
                            <div className="font-bold text-brand-accent">{displayValue}</div>
                          </div>
                          {/* Close Button */}
                          <button 
                            onClick={() => toast.dismiss(t)} 
                            className="text-white/40 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      ),
                      {
                        duration: 10000,
                        position: 'bottom-left',
                      }
                    );
                  }
                });

                const newestOrder = newOrders[0];
                if (newestOrder.createdDate) {
                  setLastCheckedTime(newestOrder.createdDate);
                }
              }, 0);
            }
          }
          
          return res;
        }
      },
    }
  );
}
