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
        <h1 className="text-7xl font-extrabold text-brand-text tracking-tight relative z-10"><i>ADWAIS</i></h1>
        <h2 className="text-4xl font-bold mb-3 text-on-tertiary-container tracking-tight relative z-10"><i>/ədˈvaɪs/</i></h2>
        <p className="text-brand-text text-xl mb-0 font-semibold tracking-wide uppercase relative z-10">
          A Dashboard Without AI Summaries
        </p>
      </div>

      <div className="w-full relative z-10 flex divide-y divide-outline flex-col items-center gap-6 animate-stagger delay-200">
        <button
          onClick={handleLogin}
          className="self-center py-4 px-6 bg-surface-container-highest hover:bg-brand-btn-primary-hover font-extrabold rounded-full transition-all duration-300 m3-elevation-1 hover:m3-elevation-2 cursor-pointer inline-flex items-center justify-center gap-3 group text-md tracking-widest uppercase whitespace-nowrap"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
            className="w-5 h-5 shrink-0"
            alt=""
            aria-hidden="true"
          />
          <span>Sign in with Microsoft</span>
        </button>

        <div className="flex w-full justify-center pt-6">
          <Link
            to="/kiosk"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-on-surface-variant px-6 py-3 text-md font-bold uppercase tracking-widest transition-colors hover:bg-white/50"
          >
            Activate kiosk
          </Link>
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center text-sm text-on-surface-variant tracking-widest uppercase relative z-10 w-full animate-stagger delay-300">
        <span><a href={"https://marmenlind.com?utm_source=adwais"} target="_blank" rel="noopener noreferrer">© Marmenlind</a></span>
        <span className="text-on-surface-variant">v1.1.0</span>
      </div>
    </>
  );
}
