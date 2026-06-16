import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useActivateKioskMutation } from '../../hooks/useKioskAuth';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { SecureButton } from '../../components/common/ui/SecureButton';
import { Input } from '../../components/common/ui/Input';

export const Route = createFileRoute('/settings/kiosks')({
  component: KiosksSettings,
});

function KiosksSettings() {
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">Kiosk Activation</h2>
      <p className="text-sm text-slate-600 mb-2">
        Enter the 6-character activation code displayed on the kiosk screen to authorize it for use.
      </p>

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
    </div>
  );
}
