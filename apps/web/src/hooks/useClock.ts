// Part of the ADWAIS project, under the Business Source License 1.1.
// See /LICENSE for license information.
// SPDX-License-Identifier: BUSL-1.1

import { useState, useEffect } from 'react';

export function useClock(): Date {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    // Calculate delay until the next minute boundary (seconds === 00)
    const msToNextMinute = 60000 - (new Date().getTime() % 60000);

    const timeoutId = setTimeout(() => {
      setTime(new Date());
      // Set interval to tick exactly on minute boundaries going forward
      intervalId = setInterval(() => {
        setTime(new Date());
      }, 60000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return time;
}
