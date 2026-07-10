import { useState } from 'react';
import { toast } from 'sonner';
import { ShoppingBag, X } from 'lucide-react';
import type { OrderDto } from '@types';

type OrderToastProps = {
  order: OrderDto;
  t: string | number;
  faviconUrl: string | null;
  displayValue: string;
  formatDate: (date?: string | null) => string;
};

export function OrderToast({ order, t, faviconUrl, displayValue, formatDate }: OrderToastProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      className="w-[calc(100vw-2rem)] lg:w-[480px] bg-brand-bg-secondary text-white rounded-xl lg:rounded-2xl p-3.5 lg:p-6 shadow-2xl border border-brand-link/30 flex items-center gap-2.5 lg:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-11 h-11 lg:w-16 lg:h-16 rounded-lg lg:rounded-xl bg-surface border border-outline-variant flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
        {faviconUrl && !imgError ? (
          <img 
            src={faviconUrl} 
            alt="Tenant favicon" 
            className="w-6 h-6 lg:w-8 lg:h-8 object-contain" 
            onError={() => setImgError(true)}
          />
        ) : (
          <ShoppingBag className="w-6 h-6 lg:w-8 lg:h-8 text-on-surface-variant" />
        )}
      </div>
      {/* Order Info */}
      <div className="flex-grow min-w-0 text-left">
        <div className="text-xs lg:text-sm uppercase font-black tracking-widest text-brand-accent font-mono">
          New Order Placed
        </div>
        <div className="text-base lg:text-xl font-black truncate mt-0.5 lg:mt-1 text-white">
          {order.tenantName || 'Unknown Tenant'}
        </div>
        <div className="text-xs lg:text-sm text-white/60 mt-1 lg:mt-2 font-mono">
          {formatDate(order.createdDate)}
        </div>
        <div className="text-sm lg:text-base font-bold text-brand-accent">{displayValue}</div>
      </div>
      {/* Close Button */}
      <button 
        onClick={() => toast.dismiss(t)} 
        className="text-white/40 hover:text-white p-1.5 lg:p-2 hover:bg-surface/5 rounded-lg transition-colors cursor-pointer shrink-0"
      >
        <X className="w-5 h-5 lg:w-6 lg:h-6" />
      </button>
    </div>
  );
}
