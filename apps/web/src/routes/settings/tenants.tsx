import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Activity, Play, Pause, Trash2, Plus, Link2, Unlink2, X, Search, Filter } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../apiClient';

export const Route = createFileRoute('/settings/tenants')({
  component: TenantsMonitorsView,
});

function TenantsMonitorsView() {
  const queryClient = useQueryClient();

  const [assigningMonitorId, setAssigningMonitorId] = useState<number | null>(null);
  const [assignTenantId, setAssignTenantId] = useState('');
  
  const [isCreatingTenant, setIsCreatingTenant] = useState(false);
  const [newTenantDraft, setNewTenantDraft] = useState({ name: '', litiumBaseUrl: '', serviceAccountToken: '' });
  
  const [isCreatingMonitor, setIsCreatingMonitor] = useState(false);
  const [newMonitorDraft, setNewMonitorDraft] = useState({ name: '', url: '', uptimeSla: 99.9 });
  
  const [tenantSort, setTenantSort] = useState<'asc' | 'desc'>('asc');
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantFilters, setTenantFilters] = useState({ token: 'all', fetch: 'all' });

  const [monitorSort, setMonitorSort] = useState<'asc' | 'desc'>('asc');
  const [monitorFilter, setMonitorFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [monitorSearch, setMonitorSearch] = useState('');

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => apiFetch<any[]>('/api/tenants')
  });

  const { data: monitors } = useQuery({
    queryKey: ['monitors'],
    queryFn: () => apiFetch<any[]>('/api/monitors')
  });

  const { data: unassignedMonitors } = useQuery({
    queryKey: ['unassigned-monitors'],
    queryFn: () => apiFetch<any[]>('/api/monitors/unassigned')
  });

  const createTenant = useMutation({
    mutationFn: (payload: any) => apiFetch('/api/tenants', { 
      method: 'POST', 
      body: JSON.stringify({ ...payload, type: 1, orderFetchingEnabled: false }) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsCreatingTenant(false);
      setNewTenantDraft({ name: '', litiumBaseUrl: '', serviceAccountToken: '' });
    }
  });

  const deleteTenant = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/tenants/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
    }
  });

  const createMonitor = useMutation({
    mutationFn: (payload: any) => apiFetch('/api/monitors?tenantId=00000000-0000-0000-0000-000000000001', { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
      setIsCreatingMonitor(false);
      setNewMonitorDraft({ name: '', url: '', uptimeSla: 99.9 });
    }
  });

  const toggleMonitor = useMutation({
    mutationFn: ({ id, action }: { id: number, action: 'start' | 'pause' }) => apiFetch(`/api/monitors/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitors'] })
  });

  const updateTenant = useMutation({
    mutationFn: ({ id, payload }: { id: string, payload: any }) => apiFetch(`/api/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });

  const updateMonitor = useMutation({
    mutationFn: ({ id, payload }: { id: number, payload: any }) => apiFetch(`/api/monitors/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
    }
  });

  const assignMonitor = useMutation({
    mutationFn: ({ id, tenantId }: { id: number, tenantId: string }) => apiFetch(`/api/monitors/${id}/assign/${tenantId}`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setAssigningMonitorId(null);
      setAssignTenantId('');
    }
  });

  const unassignMonitor = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/monitors/${id}/unassign`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-monitors'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    }
  });

  const allMonitors = [...(monitors || []), ...(unassignedMonitors || [])].reduce((acc, curr) => {
    if (!acc.find((m: any) => m.id === curr.id)) {
      acc.push(curr);
    }
    return acc;
  }, [] as any[]);

  const sortedTenants = [...(tenants || [])].filter((t: any) => {
    if (tenantSearch) {
      const q = tenantSearch.toLowerCase();
      const matchName = t.name?.toLowerCase().includes(q);
      const matchUrl = t.litiumBaseUrl?.toLowerCase().includes(q);
      if (!matchName && !matchUrl) return false;
    }
    if (tenantFilters.token === 'set') if (t.hasServiceAccountToken !== true) return false;
    if (tenantFilters.token === 'missing') if (t.hasServiceAccountToken !== false) return false;
    if (tenantFilters.fetch === 'on') if (t.orderFetchingEnabled !== true) return false;
    if (tenantFilters.fetch === 'off') if (t.orderFetchingEnabled !== false) return false;
    return true;
  }).sort((a, b) => {
    return tenantSort === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
  });

  const filteredAndSortedMonitors = allMonitors.filter((m: any) => {
    if (monitorSearch) {
      const q = monitorSearch.toLowerCase();
      const matchName = (m.friendlyName || m.name || '').toLowerCase().includes(q);
      const matchUrl = m.url?.toLowerCase().includes(q);
      const matchTenant = m.tenantName?.toLowerCase().includes(q);
      if (!matchName && !matchUrl && !matchTenant) return false;
    }
    if (monitorFilter === 'assigned') return m.tenantId != null;
    if (monitorFilter === 'unassigned') return m.tenantId == null;
    return true;
  }).sort((a: any, b: any) => {
    const nameA = a.friendlyName || '';
    const nameB = b.friendlyName || '';
    return monitorSort === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0">
      {/* Tenants Column */}
      <section className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between shrink-0 p-4 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-accent/10 text-brand-accent rounded-lg shadow-sm">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Tenants</h2>
              <p className="text-xs font-semibold text-slate-500">Manage your environments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search tenants..." 
                value={tenantSearch}
                onChange={e => setTenantSearch(e.target.value)}
                className="text-sm font-semibold border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/20 w-40"
              />
            </div>
            <TenantFilterMenu filters={tenantFilters} setFilters={setTenantFilters} />
            <select 
              value={tenantSort} 
              onChange={e => setTenantSort(e.target.value as 'asc' | 'desc')}
              className="text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent/20 cursor-pointer text-slate-700"
            >
              <option value="asc">A-Z</option>
              <option value="desc">Z-A</option>
            </select>
            <button 
              onClick={() => setIsCreatingTenant(true)}
              className="flex items-center gap-2 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Plus size={16} /> New
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50">
          {isCreatingTenant && (
            <div className="border-2 border-brand-accent/50 rounded-xl overflow-hidden bg-brand-accent/5 shadow-sm shrink-0 flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-brand-accent/20">
                <span className="font-extrabold text-brand-accent text-sm">Create New Tenant</span>
                <button onClick={() => setIsCreatingTenant(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                  <input className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" placeholder="Tenant Name" value={newTenantDraft.name} onChange={e => setNewTenantDraft({...newTenantDraft, name: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Litium Base URL</label>
                  <input className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" placeholder="https://example.com" value={newTenantDraft.litiumBaseUrl} onChange={e => setNewTenantDraft({...newTenantDraft, litiumBaseUrl: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Account Token</label>
                  <input type="password" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm font-mono" placeholder="Secret Token" value={newTenantDraft.serviceAccountToken} onChange={e => setNewTenantDraft({...newTenantDraft, serviceAccountToken: e.target.value})} />
                </div>
                <button 
                  className="mt-2 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                  disabled={!newTenantDraft.name || !newTenantDraft.litiumBaseUrl || createTenant.isPending}
                  onClick={() => createTenant.mutate(newTenantDraft)}
                >
                  {createTenant.isPending ? 'Saving...' : 'Save Tenant'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            {sortedTenants.map((t: any) => (
              <TenantTile 
                key={t.id} 
                t={t} 
                updateTenant={updateTenant} 
                deleteTenant={deleteTenant} 
              />
            ))}
          </div>
          {(!tenants || tenants.length === 0) && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl bg-white">No tenants found</div>
          )}
        </div>
      </section>

      {/* Monitors Column */}
      <section className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between shrink-0 p-4 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
              <Activity size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Fleet Monitors</h2>
              <p className="text-xs font-semibold text-slate-500">Manage external health checks</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Search monitors..." 
                value={monitorSearch}
                onChange={e => setMonitorSearch(e.target.value)}
                className="text-sm font-semibold border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-40"
              />
            </div>
            <select 
              value={monitorFilter} 
              onChange={e => setMonitorFilter(e.target.value as 'all' | 'assigned' | 'unassigned')}
              className="text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-slate-700"
            >
              <option value="all">All Status</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
            </select>
            <select 
              value={monitorSort} 
              onChange={e => setMonitorSort(e.target.value as 'asc' | 'desc')}
              className="text-sm font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer text-slate-700"
            >
              <option value="asc">A-Z</option>
              <option value="desc">Z-A</option>
            </select>
            <button 
              onClick={() => setIsCreatingMonitor(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Plus size={16} /> New
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar bg-slate-50/50">
          {isCreatingMonitor && (
            <div className="border-2 border-blue-500/50 rounded-xl overflow-hidden bg-blue-50/50 shadow-sm shrink-0 flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-blue-200">
                <span className="font-extrabold text-blue-600 text-sm">Create New Monitor</span>
                <button onClick={() => setIsCreatingMonitor(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</label>
                  <input className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" placeholder="Monitor Name" value={newMonitorDraft.name} onChange={e => setNewMonitorDraft({...newMonitorDraft, name: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">URL</label>
                  <input className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" placeholder="https://example.com" value={newMonitorDraft.url} onChange={e => setNewMonitorDraft({...newMonitorDraft, url: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uptime SLA (%)</label>
                  <input type="number" step="0.1" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" value={newMonitorDraft.uptimeSla} onChange={e => setNewMonitorDraft({...newMonitorDraft, uptimeSla: parseFloat(e.target.value)})} />
                </div>
                <button 
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                  disabled={!newMonitorDraft.name || !newMonitorDraft.url || createMonitor.isPending}
                  onClick={() => createMonitor.mutate(newMonitorDraft)}
                >
                  {createMonitor.isPending ? 'Saving...' : 'Save Monitor'}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
            {filteredAndSortedMonitors.map((m: any) => (
              <MonitorTile
                key={m.id}
                m={m}
                updateMonitor={updateMonitor}
                toggleMonitor={toggleMonitor}
                assignMonitor={assignMonitor}
                unassignMonitor={unassignMonitor}
                tenants={tenants}
                isAssigning={assigningMonitorId === m.id}
                setAssigningMonitorId={setAssigningMonitorId}
                assignTenantId={assignTenantId}
                setAssignTenantId={setAssignTenantId}
              />
            ))}
          </div>
          {allMonitors.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-xl bg-white">No monitors found</div>
          )}
        </div>
      </section>
    </div>
  );
}

function TenantTile({ t, updateTenant, deleteTenant }: { t: any, updateTenant: any, deleteTenant: any }) {
  const [draft, setDraft] = useState({
    name: t.name,
    type: t.type,
    litiumBaseUrl: t.litiumBaseUrl || '',
    serviceAccountToken: '',
    orderFetchingEnabled: t.orderFetchingEnabled ?? false
  });
  
  useEffect(() => {
    setDraft({
      name: t.name,
      type: t.type,
      litiumBaseUrl: t.litiumBaseUrl || '',
      serviceAccountToken: '',
      orderFetchingEnabled: t.orderFetchingEnabled ?? false
    });
  }, [t.name, t.type, t.litiumBaseUrl, t.orderFetchingEnabled]);

  const isDirty = 
    draft.name !== t.name ||
    draft.type !== t.type ||
    draft.litiumBaseUrl !== (t.litiumBaseUrl || '') ||
    draft.serviceAccountToken !== '' ||
    draft.orderFetchingEnabled !== (t.orderFetchingEnabled ?? false);

  const handleSave = () => {
    const payload: any = {};
    if (draft.name !== t.name) payload.name = draft.name;
    if (draft.type !== t.type) payload.type = draft.type;
    if (draft.litiumBaseUrl !== (t.litiumBaseUrl || '')) payload.litiumBaseUrl = draft.litiumBaseUrl;
    if (draft.serviceAccountToken !== '') payload.serviceAccountToken = draft.serviceAccountToken;
    if (draft.orderFetchingEnabled !== (t.orderFetchingEnabled ?? false)) payload.orderFetchingEnabled = draft.orderFetchingEnabled;
    
    updateTenant.mutate({ id: t.id, payload });
  };

  const handleCancel = () => {
    setDraft({
      name: t.name,
      type: t.type,
      litiumBaseUrl: t.litiumBaseUrl || '',
      serviceAccountToken: '',
      orderFetchingEnabled: t.orderFetchingEnabled ?? false
    });
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all bg-white shadow-sm shrink-0 flex flex-col">
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-brand-accent/10 to-transparent border-b border-brand-accent/10">
        <div className="flex flex-col gap-0.5">
          <span className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <input 
              value={draft.name}
              onChange={e => setDraft({...draft, name: e.target.value})}
              className="bg-transparent hover:bg-white/50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 border border-transparent hover:border-slate-300 focus:border-brand-accent/30 rounded px-1 -ml-1 transition-all outline-none"
            />
            <select
              value={draft.type}
              onChange={e => setDraft({...draft, type: Number(e.target.value)})}
              className={`px-1 py-0.5 rounded-[4px] text-[9px] uppercase font-bold tracking-widest shadow-sm text-white cursor-pointer hover:opacity-90 outline-none ${
                draft.type === 1 ? 'bg-[var(--color-brand-btn-primary)]' : 
                draft.type === 2 ? 'bg-[#0ea5e9]' : 
                'bg-[#8b5cf6]'
              }`}
            >
              <option value={0} className="text-slate-800 bg-white">MIXED</option>
              <option value={1} className="text-slate-800 bg-white">B2B</option>
              <option value={2} className="text-slate-800 bg-white">B2C</option>
            </select>
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-medium select-text cursor-text">{t.id}</span>
        </div>
        <button onClick={() => { if(confirm('Delete tenant?')) deleteTenant.mutate(t.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg cursor-pointer transition-colors shadow-sm" title="Delete Tenant"><Trash2 size={14} /></button>
      </div>
      
      <div className="p-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1 group">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Litium Base URL</label>
          <input 
            value={draft.litiumBaseUrl}
            onChange={e => setDraft({...draft, litiumBaseUrl: e.target.value})}
            className="text-sm font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 border border-transparent hover:border-slate-200 focus:border-brand-accent/30 rounded px-2 py-1 -ml-2 transition-all outline-none"
            placeholder="https://..."
          />
        </div>
        
        <div className="flex flex-col gap-1 group">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Service Account Token</label>
            <span className="text-[9px] text-slate-400 italic">{t.hasServiceAccountToken ? 'Token is set' : 'Not set'}</span>
          </div>
          <input 
            type="password"
            value={draft.serviceAccountToken}
            onChange={e => setDraft({...draft, serviceAccountToken: e.target.value})}
            className="text-sm font-mono font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-accent/20 border border-transparent hover:border-slate-200 focus:border-brand-accent/30 rounded px-2 py-1 -ml-2 transition-all outline-none"
            placeholder={t.hasServiceAccountToken ? '•••••••••••• (Type to change)' : 'Type to set new token'}
          />
        </div>

        <div className="flex items-center gap-2 group relative py-1">
          <input
            type="checkbox"
            checked={draft.orderFetchingEnabled}
            onChange={(e) => setDraft({...draft, orderFetchingEnabled: e.target.checked})}
            className="w-4 h-4 text-brand-link cursor-pointer rounded border-slate-300"
            id={`chk-${t.id}`}
          />
          <label htmlFor={`chk-${t.id}`} className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
            Enable Order Fetching
          </label>
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 mt-2 pt-3 border-t border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={handleSave} disabled={updateTenant.isPending} className="flex-1 bg-brand-accent text-white font-bold text-xs py-1.5 rounded-lg hover:bg-brand-accent/90 transition-colors shadow-sm cursor-pointer">Save Changes</button>
            <button onClick={handleCancel} disabled={updateTenant.isPending} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-sm cursor-pointer">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

function MonitorTile({ 
  m, 
  updateMonitor, 
  toggleMonitor, 
  assignMonitor, 
  unassignMonitor, 
  tenants, 
  isAssigning, 
  setAssigningMonitorId, 
  assignTenantId, 
  setAssignTenantId 
}: any) {
  const isUnassigned = !m.tenantId;

  const [draft, setDraft] = useState({
    friendlyName: m.friendlyName || '',
    url: m.url || ''
  });

  useEffect(() => {
    setDraft({
      friendlyName: m.friendlyName || '',
      url: m.url || ''
    });
  }, [m.friendlyName, m.url]);

  const isDirty = draft.friendlyName !== (m.friendlyName || '') || draft.url !== (m.url || '');

  const handleSave = () => {
    const payload: any = {};
    if (draft.friendlyName !== (m.friendlyName || '')) payload.friendlyName = draft.friendlyName;
    if (draft.url !== (m.url || '')) payload.url = draft.url;
    
    updateMonitor.mutate({ id: m.id, payload });
  };

  const handleCancel = () => {
    setDraft({
      friendlyName: m.friendlyName || '',
      url: m.url || ''
    });
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all bg-white shadow-sm shrink-0 flex flex-col">
      <div className={`flex items-center justify-between p-3 border-b ${isUnassigned ? 'bg-gradient-to-r from-orange-50 to-transparent border-orange-100' : 'bg-gradient-to-r from-blue-50 to-transparent border-blue-100'}`}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className={`relative flex h-2 w-2 shrink-0`}>
              {m.status === 2 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${m.status === 2 ? 'bg-green-500' : 'bg-orange-500'}`}></span>
            </span>
            <input 
              value={draft.friendlyName}
              onChange={e => setDraft({...draft, friendlyName: e.target.value})}
              className="font-extrabold text-slate-800 text-sm bg-transparent hover:bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 border border-transparent hover:border-slate-300 focus:border-blue-500/30 rounded px-1 -ml-1 transition-all w-full outline-none"
              placeholder="Monitor Name"
            />
          </div>
          {isUnassigned ? (
            <span className="text-[9px] uppercase font-bold text-orange-500 flex items-center gap-1"><Unlink2 size={10} /> Unassigned Target</span>
          ) : (
            <span className="text-[9px] uppercase font-bold text-blue-600 flex items-center gap-1"><Link2 size={10} /> Assigned</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {m.status !== 2 ? (
            <button onClick={() => toggleMonitor.mutate({ id: m.id, action: 'start' })} className="p-1.5 text-green-600 hover:bg-green-100 bg-white rounded-lg transition-colors cursor-pointer shadow-sm" title="Resume Monitor"><Play size={14} /></button>
          ) : (
            <button onClick={() => toggleMonitor.mutate({ id: m.id, action: 'pause' })} className="p-1.5 text-slate-500 hover:bg-slate-200 bg-white rounded-lg transition-colors cursor-pointer shadow-sm" title="Pause Monitor"><Pause size={14} /></button>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3 bg-white">
        <div className="flex flex-col gap-1 group">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target URL</label>
          <input 
            value={draft.url}
            onChange={e => setDraft({...draft, url: e.target.value})}
            className="text-sm font-semibold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 border border-transparent hover:border-slate-200 focus:border-blue-500/30 rounded px-2 py-1 -ml-2 transition-all outline-none"
            placeholder="https://..."
          />
        </div>

        {isDirty && (
          <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={handleSave} disabled={updateMonitor.isPending} className="flex-1 bg-blue-600 text-white font-bold text-xs py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">Save Changes</button>
            <button onClick={handleCancel} disabled={updateMonitor.isPending} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-sm cursor-pointer">Cancel</button>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          {isUnassigned || isAssigning ? (
            <div className="flex items-center gap-2 w-full animate-in fade-in">
              <input 
                 list={`tenants-${m.id}`}
                 value={assignTenantId} 
                 onChange={e => setAssignTenantId(e.target.value)} 
                 placeholder="Search for tenant name..."
                 className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <datalist id={`tenants-${m.id}`}>
                {(tenants || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </datalist>
              <button onClick={() => { if(assignTenantId) assignMonitor.mutate({ id: m.id, tenantId: assignTenantId }); }} disabled={!assignTenantId} className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm">Link</button>
              <button onClick={() => { setAssigningMonitorId(null); setAssignTenantId(''); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={14}/></button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex flex-col gap-0.5">
                  Linked to
                  <span className="text-xs text-slate-700 font-mono font-semibold truncate max-w-[150px] select-text cursor-text">{(tenants || []).find((t: any) => t.id === m.tenantId)?.name || m.tenantId}</span>
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setAssigningMonitorId(m.id)} className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-blue-100 shadow-sm">
                    Reassign
                  </button>
                  <button onClick={() => { if(confirm('Unassign monitor?')) unassignMonitor.mutate(m.id); }} className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-red-100 shadow-sm">
                    Unassign
                  </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TenantFilterMenu({ filters, setFilters }: { filters: any, setFilters: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  const activeCount = (filters.token !== 'all' ? 1 : 0) + (filters.fetch !== 'all' ? 1 : 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const reset = () => setFilters({ token: 'all', fetch: 'all' });

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`text-sm font-semibold border rounded-lg px-3 py-1.5 transition-colors focus:outline-none flex items-center gap-2 cursor-pointer ${activeCount > 0 ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent hover:bg-brand-accent/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
      >
        <Filter size={14} />
        Filters 
        {activeCount > 0 && <span className="bg-brand-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full ml-1">{activeCount}</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-[280px] bg-white border border-slate-200 shadow-xl rounded-xl p-4 flex flex-col gap-5 z-50 animate-in fade-in slide-in-from-top-2">
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Token</span>
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                <input type="checkbox" checked={filters.token === 'all'} onChange={e => setFilters({...filters, token: e.target.checked ? 'all' : 'set'})} className="rounded border-slate-300 w-3.5 h-3.5" />
                All
              </label>
            </div>
            <div className={`flex items-center bg-slate-100 rounded-lg p-1 transition-opacity ${filters.token === 'all' ? 'opacity-70' : ''}`}>
              <button 
                onClick={() => setFilters({...filters, token: 'set'})} 
                className={`flex-1 py-1 text-xs font-bold uppercase rounded-md transition-all cursor-pointer ${filters.token === 'set' ? 'bg-white shadow-sm text-brand-accent' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Set
              </button>
              <button 
                onClick={() => setFilters({...filters, token: 'missing'})} 
                className={`flex-1 py-1 text-xs font-bold uppercase rounded-md transition-all cursor-pointer ${filters.token === 'missing' ? 'bg-white shadow-sm text-brand-accent' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Missing
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Order Fetching</span>
              <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none">
                <input type="checkbox" checked={filters.fetch === 'all'} onChange={e => setFilters({...filters, fetch: e.target.checked ? 'all' : 'on'})} className="rounded border-slate-300 w-3.5 h-3.5" />
                All
              </label>
            </div>
            <div className={`flex items-center bg-slate-100 rounded-lg p-1 transition-opacity ${filters.fetch === 'all' ? 'opacity-70' : ''}`}>
              <button 
                onClick={() => setFilters({...filters, fetch: 'on'})} 
                className={`flex-1 py-1 text-xs font-bold uppercase rounded-md transition-all cursor-pointer ${filters.fetch === 'on' ? 'bg-white shadow-sm text-brand-accent' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Enabled
              </button>
              <button 
                onClick={() => setFilters({...filters, fetch: 'off'})} 
                className={`flex-1 py-1 text-xs font-bold uppercase rounded-md transition-all cursor-pointer ${filters.fetch === 'off' ? 'bg-white shadow-sm text-brand-accent' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Disabled
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button 
              onClick={reset} 
              disabled={activeCount === 0} 
              className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
