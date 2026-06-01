import { useMemo } from 'react';

/**
 * useEarningsData – mock hook that returns earnings data for the selected interval.
 * In a real implementation this would fetch from the backend.
 */
export default function useEarningsData(interval) {
  return useMemo(() => {
    const points = [];
    const now = new Date();
    const days = interval === '7d' ? 7 : interval === '30d' ? 30 : 365; // YTD approximated as 365 days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const wave = ((days - i) * 37) % 100;
      const earnings = 500 + wave * 15;
      const gas = 50 + (wave % 20) * 10;
      const royalties = 200 + (wave % 40) * 20;
      points.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        earnings,
        gas,
        royalties,
        net: earnings - gas - royalties,
      });
    }
    return points;
  }, [interval]);
}
