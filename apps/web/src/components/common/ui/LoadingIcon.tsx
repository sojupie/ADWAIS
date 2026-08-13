// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

interface LoadingIconProps {
  label?: string;
}

export function LoadingIcon({ label = 'Loading' }: LoadingIconProps) {
  return (
    <div className="loading-icon" role="status" aria-live="polite" aria-label={label}>
      <span className="loading-icon__spinner" />
    </div>
  );
}
