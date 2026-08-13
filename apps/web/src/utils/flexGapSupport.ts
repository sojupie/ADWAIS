// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

/** Enables the margin-based flex-gap fallback only when the browser needs it. */
export function applyFlexGapFallbackClass() {
  const flex = document.createElement('div');
  flex.style.position = 'absolute';
  flex.style.visibility = 'hidden';
  flex.style.display = 'flex';
  flex.style.flexDirection = 'column';
  flex.style.rowGap = '1px';

  const firstChild = document.createElement('div');
  const secondChild = document.createElement('div');
  firstChild.style.height = '1px';
  secondChild.style.height = '1px';
  flex.append(firstChild, secondChild);
  document.body.appendChild(flex);

  const supportsFlexGap = flex.scrollHeight === 3;
  flex.remove();
  document.documentElement.classList.toggle('no-flexbox-gap', !supportsFlexGap);
}
