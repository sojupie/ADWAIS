import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { useMsal } from '@azure/msal-react';
import { getKioskToken } from '../utils/auth';
import { msalInstance } from '../utils/msalConfig';
import motilloLogo from '../assets/motillo-logo.svg';
import { AuthCard } from '../components/common/layout/AuthCard';

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (getKioskToken()) {
      throw redirect({ to: '/fleet-status' });
    }
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      throw redirect({ to: '/financial' });
    }
  },
  component: LoginComponent,
});

function LoginComponent() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect({
      scopes: [import.meta.env?.VITE_AZURE_API_SCOPE || 'api://d8d5f73a-79c5-4b95-81bd-87616daf6de4/.default'],
    }).catch((err) => {
      console.error('MSAL Login error:', err);
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center font-sans text-brand-text select-none overflow-hidden bg-brand-bg-tertiary z-50">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-accent/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <AuthCard>
        <div className="flex flex-col items-center">
          <div className="flex justify-center mb-6 relative z-10">
            <img className="h-10 w-auto object-contain" src={motilloLogo} alt="Motillo Logo" />
          </div>

          <h1 className="text-4xl font-extrabold mb-3 text-brand-text tracking-tight relative z-10">Staff Portal</h1>
          <p className="text-slate-400 text-sm mb-0 font-semibold tracking-wide uppercase relative z-10">
            Sign In to Access Dashboard
          </p>
        </div>

        <div className="max-w-md mx-auto w-full relative z-10 flex flex-col gap-6">
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-brand-btn-primary hover:bg-brand-btn-primary-hover text-white font-extrabold rounded-xl transition-all duration-300 shadow-md hover:shadow-brand-accent/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3.5 group text-sm tracking-widest uppercase border border-brand-accent/20"
          >
            <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
              <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
              <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
              <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
            </svg>
            Sign in with Microsoft
          </button>

          <div className="pt-4 border-t border-slate-900/5 flex justify-center">
            <Link
              to="/kiosk"
              className="text-sm font-black text-brand-link hover:text-brand-accent transition-colors flex items-center gap-2 cursor-pointer uppercase tracking-widest"
            >
              Kiosk Activation
            </Link>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-sm text-slate-500 font-extrabold tracking-widest uppercase relative z-10 w-full">
          <span>ADWAIS Platform</span>
          <span className="text-slate-600">v1.0.0</span>
        </div>
      </AuthCard>
    </div>
  );
}
