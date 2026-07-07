import { getApiFinancialOrders, useGetApiFinancialOrders } from '../api/generated/endpoints';
import { useLocation } from '@tanstack/react-router';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TenantResponseDto } from '@types';
import { useKiosk } from '../components/common/dashboard/KioskContext';
import { getTenantFaviconUrl } from '../utils/tenantHelper';
import { OrderToast } from '../components/common/ui/OrderToast';

export function useOrderNotifier() {
  const { pathname } = useLocation();
  const isSettings = pathname.startsWith('/settings');
  const queryClient = useQueryClient();
  const { notificationsEnabled } = useKiosk();

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-SE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
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

                  const tenantsRes = queryClient.getQueryData<{ data: TenantResponseDto[] }>(['tenants']);
                  const tenantsList = tenantsRes?.data || [];
                  const tenant = tenantsList.find((t) => t.id === order.adwaisTenantId);
                  const faviconUrl = tenant ? getTenantFaviconUrl(tenant.litiumBaseUrl) : null;

                  if (notificationsEnabled) {
                    toast.custom(
                      (t) => (
                        <OrderToast 
                          order={order} 
                          t={t} 
                          faviconUrl={faviconUrl} 
                          displayValue={displayValue} 
                          formatDate={formatDate} 
                        />
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
