import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMsal } from '@azure/msal-react';
import { useActivateKioskMutation } from '../../hooks/useKioskAuth';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { SecureButton } from '../../components/common/ui/SecureButton';
import { Input } from '../../components/common/ui/Input';
import { removeKioskToken } from '../../utils/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/common/ui/Card';

export function AuthenticationSettings() {
  const [activationCode, setActivationCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const { role } = useCurrentUser();
  const isStaff = role === 'Admin' || role === 'Employee';

  const activateMutation = useActivateKioskMutation(() => {
    setSuccessMsg('Kiosk activated successfully!');
    setErrorMsg('');
    setActivationCode('');
    setTimeout(() => setSuccessMsg(''), 5000);
  });

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaff) return;
    setErrorMsg('');
    setSuccessMsg('');
    if (!activationCode || activationCode.length !== 6) {
      setErrorMsg('Code must be exactly 6 characters.');
      return;
    }

    activateMutation.mutate(
      { activationCode },
      {
        onError: (err: Error) => {
          setErrorMsg(err.message || 'Failed to activate kiosk. Code may be expired or invalid.');
        }
      }
    );
  };

  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  const handleSignOut = () => {
    removeKioskToken();
    if (accounts.length > 0) {
      instance.logoutRedirect();
    } else {
      navigate({ to: '/login' });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
      {/* Kiosk Activation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Kiosk Activation</CardTitle>
          <CardDescription>
            Enter the 6-character activation code displayed on the kiosk screen to authorize it for use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="flex flex-col gap-4">
            <Input
              label="Activation Code"
              type="text"
              className="font-mono text-lg uppercase tracking-widest"
              placeholder={isStaff ? "XXXXXX" : "LOCKED"}
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase().slice(0, 6))}
              disabled={activateMutation.isPending || !isStaff}
            />

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                {successMsg}
              </div>
            )}

            <SecureButton
              type="submit"
              locked={!isStaff}
              lockTitle="Requires Staff (Employee or Admin) role"
              loading={activateMutation.isPending}
              loadingText="Activating..."
              className="self-start px-6 py-2 bg-brand-btn-primary hover:bg-brand-btn-primary-hover text-white font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              disabled={activationCode.length !== 6}
            >
              Activate Kiosk
            </SecureButton>
          </form>
        </CardContent>
      </Card>

      {/* Current Session / Sign Out Card */}
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>
            Manage your current session and sign out of the application on this device.
          </CardDescription>
        </CardHeader>
        
        <CardFooter className="mt-auto border-t border-slate-100 pt-6 justify-between">
          <span className="text-sm font-medium text-slate-500">Log out of ADWAIS platform</span>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg transition-colors shadow-sm cursor-pointer active:scale-[0.98]"
          >
            Sign Out
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
