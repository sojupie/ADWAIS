import type { ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';
import { DashboardTopRow } from './DashboardTopRow';
import { DashboardFlexRow } from './DashboardFlexRow';
import { FactPanel } from '../dashboard/FactPanel';
import { AccumulatedRevenueChart } from '../../financial/AccumulatedRevenueChart';
import { TransactionDensityChart } from '../../financial/TransactionDensityChart';
import { RevenueEfficiencyChart } from '../../financial/RevenueEfficiencyChart';
import { MomentumMatrixChart } from '../../financial/MomentumMatrixChart';
import motilloLogo from '../../../assets/motillo-logo.svg';
import { MOCK_ACCUMULATED_REVENUE, MOCK_TRANSACTION_DENSITY, MOCK_EFFICIENCY, MOCK_MOMENTUM } from '../../../utils/mockKioskData';

interface AuthLayoutProps {
  children: ReactNode;
}

// Using shared mock data from mockKioskData

export function AuthLayout({ children }: AuthLayoutProps) {
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
              <AccumulatedRevenueChart points={MOCK_ACCUMULATED_REVENUE} className="h-full min-h-[350px]" />
              <TransactionDensityChart points={MOCK_TRANSACTION_DENSITY} className="h-full min-h-[350px]" />
              <RevenueEfficiencyChart response={MOCK_EFFICIENCY} onTenantSelect={() => { }} className="h-full min-h-[350px]" />
              <MomentumMatrixChart momentum={MOCK_MOMENTUM} onTenantSelect={() => { }} className="h-full min-h-[350px]" />
            </DashboardFlexRow>
          </DashboardLayout>
        </div>

        {/* Moderate Blur Overlay to preserve vibrant colors */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/45 z-10" />
      </div>

      {/* Auth Content */}
      <div className="relative z-30 w-full flex justify-center px-4">
        {children}
      </div>
    </div>
  );
}
