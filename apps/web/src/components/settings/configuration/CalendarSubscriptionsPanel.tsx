import React, { useState } from 'react';
import {Globe, RefreshCw, Trash2, Calendar} from 'lucide-react';
import { useCalendarSubscriptionsQuery, useCreateCalendarSubscriptionMutation, useDeleteCalendarSubscriptionMutation, useSyncCalendarSubscriptionMutation } from '../../../hooks/useCalendarQueries';
import {SettingsCard} from "../../common/layout/SettingsCard.tsx";

export function CalendarSubscriptionsPanel({ disabled }: { disabled?: boolean }) {
  const { data: subscriptions = [], isLoading } = useCalendarSubscriptionsQuery();
  
  const [subForm, setSubForm] = useState({
    name: '',
    url: '',
    isActive: true
  });

  const createSubMutation = useCreateCalendarSubscriptionMutation(() => {
    setSubForm({ name: '', url: '', isActive: true });
  });
  const deleteSubMutation = useDeleteCalendarSubscriptionMutation();
  const syncSubMutation = useSyncCalendarSubscriptionMutation();

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    createSubMutation.mutate(subForm);
  };

  return (
      <SettingsCard
          title="External Calendar Subscriptions"
          subtitle="Manage external .ics calendar integrations. These external calendars will be fetched, aggregated, and converted into intranet schedule blocks automatically."
          icon={<Calendar size={20} />}
      >
        {!disabled && (
          <form onSubmit={handleCreateSub} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant flex flex-col gap-1">
            <h4 className="text-sm font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
              <Globe size={14} className="text-on-surface-variant" /> Connect New Calendar Feed
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Calendar Name (e.g. Swedish Holidays)" 
                value={subForm.name} 
                onChange={e => setSubForm({ ...subForm, name: e.target.value })}
                className="w-full border border-outline-variant bg-surface rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                required
              />
              <input 
                type="url" 
                placeholder="iCal Feed URL (.ics)" 
                value={subForm.url} 
                onChange={e => setSubForm({ ...subForm, url: e.target.value })}
                className="w-full border border-outline-variant bg-surface rounded px-3 py-2 text-sm focus:outline-none focus:border-slate-500"
                required
              />
            </div>
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={createSubMutation.isPending}
                className="bg-brand-btn-primary text-white text-sm font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:brightness-110 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {createSubMutation.isPending ? 'Connecting...' : 'Add Integration'}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-2 mt-2">
          {isLoading ? (
            <div className="text-sm text-on-surface-variant italic text-center py-4">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-sm text-on-surface-variant italic text-center py-4">No external calendar integrations active.</div>
          ) : (
            subscriptions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:border-outline-variant transition bg-surface shadow-sm">
                <div className="flex flex-col gap-0.5 max-w-[70%]">
                  <span className="text-sm, font-bold text-on-surface">{sub.name}</span>
                  <span className="text-sm text-on-surface-variant truncate" title={sub.url || undefined}>{sub.url}</span>
                  {sub.lastSyncError && (
                    <span className="text-sm text-red-500 font-bold leading-tight mt-1">{sub.lastSyncError}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => sub.id && syncSubMutation.mutate(sub.id)}
                    disabled={disabled || syncSubMutation.isPending}
                    className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md border border-outline-variant transition cursor-pointer disabled:opacity-50"
                    title="Sync Now"
                  >
                    <RefreshCw size={14} className={syncSubMutation.isPending ? 'animate-spin' : ''} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => sub.id && deleteSubMutation.mutate(sub.id)}
                    disabled={disabled || deleteSubMutation.isPending}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md border border-red-100 transition cursor-pointer disabled:opacity-50"
                    title="Remove Integration"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SettingsCard>
  );
}
