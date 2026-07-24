import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMsal } from '@azure/msal-react';
import { KeyRound, LogOut, MonitorSmartphone } from 'lucide-react';
import { useActivateKioskMutation } from '../../hooks/useKioskAuth';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { SecureButton } from '../../components/common/ui/SecureButton';
import { Input } from '../../components/common/ui/Input';
import { removeKioskToken } from '../../utils/auth';
import { ErrorAlert } from '../../components/common/ui/ErrorAlert';
import { SettingsPanel } from '../../components/common/layout/SettingsPanel';
import { SettingsPanelHeader } from '../../components/common/layout/SettingsPanelHeader';
import { SettingsCard } from '../../components/common/layout/SettingsCard';

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
    <SettingsPanel className="!h-fit max-w-5xl">
      <SettingsPanelHeader
        title="Authentication"
        subtitle="Authorize kiosk displays and manage the session on this device."
        icon={<KeyRound size={24} />}
      />
      <div className="custom-scrollbar grid grid-cols-1 content-start items-start gap-4 overflow-y-auto p-3 sm:p-4 md:grid-cols-2">
        <SettingsCard
          title="Kiosk activation"
          subtitle="Enter the code shown on a kiosk to authorize that display."
          icon={<MonitorSmartphone size={20} />}
          className="h-fit"
        >
          <form onSubmit={handleActivate} className="flex flex-col gap-4">
            <Input
              label="Activation Code"
              type="text"
              className="text-center font-mono text-xl uppercase tracking-[0.35em]"
              placeholder={isStaff ? "XXXXXX" : "LOCKED"}
              value={activationCode}
              onChange={(e) => setActivationCode(e.target.value.toUpperCase().slice(0, 6))}
              disabled={activateMutation.isPending || !isStaff}
            />

            {errorMsg && (
              <ErrorAlert
                title="Unable to activate kiosk"
                message={errorMsg}
                onDismiss={() => setErrorMsg('')}
              />
            )}
            {successMsg && (
              <div className="rounded-xl bg-primary-container p-3 text-sm font-semibold text-on-primary-container">
                {successMsg}
              </div>
            )}

            <SecureButton
              type="submit"
              locked={!isStaff}
              lockTitle="Requires Staff (Employee or Admin) role"
              loading={activateMutation.isPending}
              loadingText="Activating…"
              className="inline-flex min-h-11 w-fit cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-on-primary-container px-5 text-base font-bold text-primary-container transition-colors hover:bg-brand-btn-quaternary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              disabled={activationCode.length !== 6}
            >
              Activate Kiosk
            </SecureButton>
          </form>
        </SettingsCard>

        <SettingsCard
          title="Current session"
          subtitle="Review the signed-in account or remove access from this device."
          icon={<KeyRound size={20} />}
          className="h-fit"
        >
          <div className="rounded-xl bg-surface-container-high p-4">
            <span className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Signed in as</span>
            <p className="mt-1 break-all text-base font-bold text-on-surface">
              {accounts[0]?.username || 'Kiosk session'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-on-surface-variant">This only signs out the current device.</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-error px-5 text-base font-bold text-on-error transition-colors hover:bg-error-container hover:text-on-error-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
          >
            <LogOut size={18} aria-hidden="true" />
            Sign Out
          </button>
          </div>
        </SettingsCard>
      </div>
    </SettingsPanel>
  );
}
