import { createFileRoute, redirect, Navigate, Link } from '@tanstack/react-router';
import { useQuery, type QueryClient } from '@tanstack/react-query';
import { Settings, ServerCrash } from 'lucide-react';
import { getOrCreateDeviceId, getKioskToken, setKioskToken } from '../utils/auth';
import { useKioskTokenQuery, type RegisterKioskResponse } from '../hooks/useKioskAuth';
import { customClient } from '../apiClient';
import { FactPanel } from '../components/common/dashboard/FactPanel';
import { DashboardTopRow } from '../components/common/layout/DashboardTopRow';
import { DashboardLayout } from '../components/common/layout/DashboardLayout';
import { DashboardFlexRow } from '../components/common/layout/DashboardFlexRow';
import { AccumulatedRevenueChart } from '../components/financial/AccumulatedRevenueChart';
import { MomentumMatrixChart } from '../components/financial/MomentumMatrixChart';
import { RevenueEfficiencyChart } from '../components/financial/RevenueEfficiencyChart';
import { VolumeAnomalyChart } from '../components/financial/VolumeAnomalyChart';
import { MOCK_ACCUMULATED_REVENUE, MOCK_ANOMALIES, MOCK_EFFICIENCY, MOCK_MOMENTUM } from '../utils/mockKioskData';
import motilloLogo from '../assets/motillo-logo.svg';
import { msalInstance } from '../utils/msalConfig';
import { AuthCard } from '../components/common/layout/AuthCard';

export const Route = createFileRoute('/kiosk')({
  beforeLoad: () => {
    if (getKioskToken()) {
      throw redirect({ to: '/fleet-status' });
    }
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      throw redirect({ to: '/financial' });
    }
  },
  loader: ({ context }) => {
    const queryClient = (context as unknown as { queryClient: QueryClient }).queryClient;
    const deviceId = getOrCreateDeviceId();
    
    queryClient.prefetchQuery({
      queryKey: ['kiosk', 'register', deviceId],
      queryFn: () => customClient<RegisterKioskResponse>({
        url: '/api/kiosk/register',
        method: 'POST',
        data: { deviceId },
      }),
      staleTime: Infinity,
    });
    return { deviceId };
  },
  component: KioskLanding,
});

function KioskLanding() {
  const { deviceId } = Route.useLoaderData();
  
  const { data: registerData, isError } = useQuery({
    queryKey: ['kiosk', 'register', deviceId],
    queryFn: () => customClient<RegisterKioskResponse>({
      url: '/api/kiosk/register',
      method: 'POST',
      data: { deviceId },
    }),
    staleTime: Infinity,
    retry: true,
    retryDelay: 5000,
  });

  const activationCode = registerData?.activationCode;
  const { data: tokenData } = useKioskTokenQuery(deviceId, !!activationCode);

  if (tokenData?.token) {
    setKioskToken(tokenData.token);
    return <Navigate to="/fleet-status" />;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center font-sans text-brand-text select-none overflow-hidden bg-brand-bg-tertiary z-50">
      {/* Blurred Dashboard Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex flex-col">
        {/* Mock Header */}
        <header className="relative flex flex-col xl:flex-row justify-between items-center px-6 py-3 shrink-0 bg-brand-bg-secondary border-b border-brand-bg-secondary/20 shadow-sm z-10 gap-4 xl:gap-0">
          <div className="w-full xl:w-1/4 flex justify-center xl:justify-start">
            <img className="h-8 w-auto object-contain object-left brightness-0 invert" src={motilloLogo} alt="Motillo" height="32" />
          </div>
          <nav className="flex-1 flex flex-wrap justify-center items-center gap-4 md:gap-8 w-full xl:w-auto font-black uppercase tracking-widest text-sm">
            <span className="text-brand-accent border-b-2 border-brand-accent pb-1">Financial</span>
            <span className="text-brand-text-muted">Fleet status</span>
            <span className="text-brand-text-muted">Intranet</span>
            <span className="text-brand-text-muted"><Settings size={20} /></span>
          </nav>
          <div className="w-full xl:w-1/4 flex justify-center xl:justify-end items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg border bg-amber-400 text-slate-900 border-amber-500 shadow-sm cursor-not-allowed opacity-80">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-900"></span>
              </span>
              <span className="text-sm font-black uppercase tracking-widest">Interactive</span>
            </div>
          </div>
        </header>

        <div className="w-full h-full p-6 flex flex-col min-h-0">
          <DashboardLayout>
            {/* Mock Fact Panels */}
            <DashboardTopRow>
              <FactPanel label="Global Revenue (T30)" value="201 634 127 kr" extra={{ type: 'PoP', value: -2.74 }} />
              <FactPanel label="Transaction Volume" value="236 800" extra={{ type: 'PoP', value: -2.58 }} />
              <FactPanel label="Portfolio AOV" value="851.5 SEK" extra={{ type: 'PoP', value: -0.17 }} />
              <FactPanel label="Active Tenants" value="40" extra={{ type: 'PoP', value: 0.00 }} />
              <FactPanel label="Avg Revenue Per Tenant" value="5 mn" extra={{ type: 'PoP', value: -2.74 }} />
            </DashboardTopRow>
            {/* Mock Charts Grid */}
            <DashboardFlexRow weight="flex-1" gridCols="2">
              <AccumulatedRevenueChart points={MOCK_ACCUMULATED_REVENUE} className="h-full min-h-87.5" />
              <VolumeAnomalyChart entries={MOCK_ANOMALIES} onTenantSelect={() => { }} className="h-full min-h-87.5" />
              <RevenueEfficiencyChart response={MOCK_EFFICIENCY} onTenantSelect={() => { }} className="h-full min-h-87.5" />
              <MomentumMatrixChart momentum={MOCK_MOMENTUM} onTenantSelect={() => { }} className="h-full min-h-87.5" />
            </DashboardFlexRow>
          </DashboardLayout>
        </div>
        {/* Moderate Blur Overlay to preserve vibrant colors */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/45 z-10" />
      </div>

      <AuthCard>
        {activationCode ? (
          <div className="relative z-10 animate-in fade-in zoom-in duration-500 flex-1 flex flex-col justify-between">
            <div>
              <h1 className="text-5xl font-extrabold mb-6 text-brand-text">Device Activation</h1>
              <p className="text-slate-500 text-lg mb-8 px-4 leading-relaxed font-medium">
                To activate this display, log in to your staff dashboard and enter the activation code below.
              </p>
            </div>
            <div className="bg-brand-bg-secondary backdrop-blur-sm text-[5rem] leading-none font-mono tracking-[0.2em] py-8 px-8 rounded-2xl text-brand-accent mb-8 shadow-inner font-bold border border-slate-900/10 select-all cursor-text">
              {activationCode}
            </div>
            <div>
              <div className="flex items-center justify-center gap-4 text-slate-500 text-base font-medium tracking-wide">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-accent"></span>
                </span>
                Waiting for authorization...
              </div>
              <div className="mt-8 pt-4 border-t border-slate-900/5 flex justify-center">
                <Link
                  to="/login"
                  className="text-sm font-black text-brand-link hover:text-brand-accent transition-colors flex items-center gap-2 cursor-pointer uppercase tracking-widest"
                >
                  Staff Login
                </Link>
              </div>
            </div>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 py-16 relative z-10 animate-in fade-in duration-300 text-center">
            <ServerCrash className="w-16 h-16 text-rose-400 mx-auto opacity-80" />
            <div>
              <p className="text-brand-text text-lg font-bold">Server Unreachable</p>
              <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">The backend could not be reached. Retrying automatically when connectivity is restored.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 py-16 relative z-10 animate-in fade-in duration-300">
            <div className="w-14 h-14 border-[5px] border-slate-200 border-t-brand-accent rounded-full animate-spin shadow-sm"></div>
            <p className="text-slate-500 text-lg font-medium animate-pulse">Generating secure token...</p>
          </div>
        )}
      </AuthCard>
    </div>
  );
}
