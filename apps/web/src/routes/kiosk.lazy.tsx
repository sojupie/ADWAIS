import { createLazyFileRoute, Navigate, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ServerCrash } from 'lucide-react';
import { setKioskToken } from '../utils/auth';
import { useKioskTokenQuery, type RegisterKioskResponse } from '../hooks/useKioskAuth';
import { customClient } from '../apiClient';
import { AuthCard } from '../components/common/layout/AuthCard';
import { AuthLayout } from '../components/common/layout/AuthLayout';

export const Route = createLazyFileRoute('/kiosk')({
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
    <AuthLayout>
      <AuthCard>
        {activationCode ? (
          <div className="relative z-10 animate-in fade-in zoom-in duration-500 flex-1 flex flex-col justify-between">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 sm:mb-6 text-brand-text">Device Activation</h1>
              <p className="text-slate-500 text-base sm:text-lg mb-6 sm:mb-8 px-2 sm:px-4 leading-relaxed font-medium">
                To activate this display, log in to your staff dashboard and enter the activation code below.
              </p>
            </div>
            <div className="bg-brand-bg-secondary backdrop-blur-sm text-5xl sm:text-[4rem] md:text-[5rem] leading-none font-mono tracking-widest sm:tracking-[0.2em] py-6 sm:py-8 px-4 sm:px-8 rounded-2xl text-brand-accent mb-8 shadow-inner font-bold border border-slate-900/10 select-all cursor-text overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
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
    </AuthLayout>
  );
}
