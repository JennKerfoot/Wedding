import { useState, useEffect } from 'react';

export function Countdown({ light = false }: { light?: boolean }) {
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    // 11:00 AM UTC on Feb 10 = Midnight Feb 11 NZDT
    const target = new Date('2028-02-10T11:00:00Z');
    const calc = () => {
      const diffTime = target.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDays(diffDays > 0 ? diffDays : 0);
    };
    calc();
    const interval = setInterval(calc, 1000 * 60 * 60 * 24);
    return () => clearInterval(interval);
  }, []);

  if (days === null || days <= 0) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`ui-label ${light ? 'text-espresso/60' : 'text-ivory/80'}`}>T-Minus</div>
      <div className={`font-label text-[14px] md:text-[16px] tracking-[0.1em] ${light ? 'text-espresso' : 'text-ivory'}`}>
        {days.toString().padStart(3, '0')} <span className="opacity-60">DAYS</span>
      </div>
    </div>
  );
}
