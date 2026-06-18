import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useMsal } from '@azure/msal-react';
import { AZURE_API_SCOPE } from '../utils/msalConfig';

export const Route = createLazyFileRoute('/login')({
  component: LoginComponent,
});

function LoginComponent() {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect({
      scopes: [AZURE_API_SCOPE],
    }).catch((err) => {
      console.error('MSAL Login error:', err);
    });
  };

  return (
    <>
        <div className="flex flex-col items-center animate-stagger delay-100">
          <h1 className="text-7xl font-extrabold mb-3 text-brand-text tracking-tight relative z-10"><i>ADWAIS</i></h1>
          <p className="text-brand-text text-xl mb-0 font-semibold tracking-wide uppercase relative z-10">
            A Dashboard Without AI Summaries
          </p>
        </div>

        <div className="max-w-md mx-auto w-full relative z-10 flex flex-col gap-6 animate-stagger delay-200">
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

        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-sm text-slate-500 font-extrabold tracking-widest uppercase relative z-10 w-full animate-stagger delay-300">
          <span>ADWAIS Platform</span>
          <span className="text-slate-600">v1.0.0</span>
        </div>
    </>
  );
}
