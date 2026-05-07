import { useEffect, useRef, memo } from 'react';

export type WeatherState = 'sunny' | 'warn' | 'err';

export interface ComplianceWeatherCardProps {
  state: WeatherState;
  chipLabel: string;
  headline: React.ReactNode;
  percentage: number;
  permitsDone: number;
  permitsTotal: number;
  locations: number;
}

function ComplianceWeatherCardImpl({
  state,
  chipLabel,
  headline,
  percentage,
  permitsDone,
  permitsTotal,
  locations,
}: ComplianceWeatherCardProps) {
  const dustCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const warnCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const bolt1Ref = useRef<HTMLDivElement | null>(null);
  const bolt2Ref = useRef<HTMLDivElement | null>(null);
  const bolt3Ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state !== 'sunny') return;
    const canvas = dustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; alpha: number; phase: number }> = [];
    const N = 40;
    let raf = 0;
    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * devicePixelRatio;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(devicePixelRatio, devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.3 + 0.1),
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
      });
    }
    function tick() {
      ctx!.clearRect(0, 0, canvas!.offsetWidth, canvas!.offsetHeight);
      particles.forEach(p => {
        p.phase += 0.02;
        p.x += p.vx + Math.sin(p.phase) * 0.2;
        p.y += p.vy;
        if (p.y < -10) { p.y = canvas!.offsetHeight + 10; p.x = Math.random() * canvas!.offsetWidth; }
        if (p.x < -10) p.x = canvas!.offsetWidth + 10;
        if (p.x > canvas!.offsetWidth + 10) p.x = -10;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 245, 200, ${p.alpha})`;
        ctx!.shadowColor = 'rgba(255, 235, 170, 0.6)';
        ctx!.shadowBlur = 4;
        ctx!.fill();
      });
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, [state]);

  useEffect(() => {
    if (state !== 'warn') return;
    const canvas = warnCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; alpha: number }> = [];
    const N = 25;
    let raf = 0;
    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * devicePixelRatio;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(devicePixelRatio, devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 28 + 18,
        vx: Math.random() * 0.3 + 0.1,
        vy: (Math.random() - 0.5) * 0.15,
        alpha: Math.random() * 0.08 + 0.02,
      });
    }
    function tick() {
      ctx!.clearRect(0, 0, canvas!.offsetWidth, canvas!.offsetHeight);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > canvas!.offsetWidth + p.r) { p.x = -p.r; p.y = Math.random() * canvas!.offsetHeight; }
        const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
        g.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx!.fillStyle = g;
        ctx!.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      });
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); };
  }, [state]);

  useEffect(() => {
    if (state !== 'err') return;
    const canvas = rainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const drops: Array<{ x: number; y: number; length: number; speed: number; alpha: number; thickness: number; drift: number }> = [];
    const N = 180;
    let raf = 0;
    function resize() {
      canvas!.width = canvas!.offsetWidth * devicePixelRatio;
      canvas!.height = canvas!.offsetHeight * devicePixelRatio;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(devicePixelRatio, devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < N; i++) {
      const depth = Math.random();
      drops.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        length: depth * 16 + 6,
        speed: depth * 11 + 5,
        alpha: depth * 0.5 + 0.1,
        thickness: depth * 1.2 + 0.4,
        drift: depth * 2 + 1,
      });
    }
    function tick() {
      ctx!.clearRect(0, 0, canvas!.offsetWidth, canvas!.offsetHeight);
      drops.forEach(d => {
        d.y += d.speed;
        d.x -= d.drift;
        if (d.y > canvas!.offsetHeight + 20) { d.y = -20; d.x = Math.random() * (canvas!.offsetWidth + 100); }
        if (d.x < -20) d.x = canvas!.offsetWidth + 20;
        ctx!.beginPath();
        ctx!.moveTo(d.x, d.y);
        ctx!.lineTo(d.x - d.drift * 1.5, d.y + d.length);
        ctx!.strokeStyle = `rgba(180, 200, 230, ${d.alpha})`;
        ctx!.lineWidth = d.thickness;
        ctx!.stroke();
      });
      raf = requestAnimationFrame(tick);
    }
    tick();

    let strikeTimeout: ReturnType<typeof setTimeout>;
    function strike() {
      const flash = flashRef.current;
      const bolts = [bolt1Ref.current, bolt2Ref.current, bolt3Ref.current].filter(Boolean) as HTMLDivElement[];
      if (!flash || bolts.length === 0) return;
      const bolt = bolts[Math.floor(Math.random() * bolts.length)];
      const nextDelay = 3000 + Math.random() * 6000;
      flash.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 0.4, offset: 0.18 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 }],
        { duration: 700, easing: 'ease-out' },
      );
      bolt.animate(
        [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 0.3, offset: 0.18 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }],
        { duration: 700, easing: 'ease-out' },
      );
      strikeTimeout = setTimeout(strike, nextDelay);
    }
    strikeTimeout = setTimeout(strike, 1500);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(raf); clearTimeout(strikeTimeout); };
  }, [state]);

  return (
    <div className={`hero-card hero-card--${state}`}>
      <style>{CSS}</style>

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="hc-cloud-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={2} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" />
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="hc-heavy-cloud-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={4} seed={5} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="hc-storm-cloud-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves={5} seed={8} result="noise">
              <animate attributeName="baseFrequency" values="0.015;0.02;0.015" dur="30s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="28" />
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="hc-sky-turb">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={4} seed={3}>
              <animate attributeName="baseFrequency" values="0.006;0.01;0.006" dur="20s" repeatCount="indefinite" />
            </feTurbulence>
            <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.4  0 0 0 0.4 0" />
          </filter>
          <filter id="hc-rough-edge">
            <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves={2} seed={5} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
          </filter>
          <pattern id="hc-hex-ok" x="0" y="0" width="16" height="18.475" patternUnits="userSpaceOnUse">
            <path d="M8 0 L16 4.619 L16 13.856 L8 18.475 L0 13.856 L0 4.619 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
          </pattern>
          <pattern id="hc-hex-warn" x="0" y="0" width="16" height="18.475" patternUnits="userSpaceOnUse">
            <path d="M8 0 L16 4.619 L16 13.856 L8 18.475 L0 13.856 L0 4.619 Z" fill="none" stroke="rgba(194, 65, 12, 0.5)" strokeWidth="0.7" />
          </pattern>
          <pattern id="hc-hex-err" x="0" y="0" width="16" height="18.475" patternUnits="userSpaceOnUse">
            <path d="M8 0 L16 4.619 L16 13.856 L8 18.475 L0 13.856 L0 4.619 Z" fill="none" stroke="rgba(252, 165, 165, 0.55)" strokeWidth="0.7" />
          </pattern>
        </defs>
      </svg>

      {state === 'sunny' && (
        <>
          <div className="bg-layer sun">
            <div className="sun-halo" />
            <div className="sun-core" />
          </div>
          <div className="bg-layer shield">
            <div className="shield-wm shield-ok">
              <svg viewBox="0 0 560 650">
                <path fill="rgba(255, 255, 255, 0.4)" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="1.5"
                      d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                <path fill="url(#hc-hex-ok)" opacity="0.3"
                      d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                <path fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1"
                      d="M280 70 L472 150 L472 328 Q472 464 280 584 Q88 464 88 328 L88 150 Z" />
                <path fill="rgba(22, 163, 74, 0.2)"
                      d="M88 174 L472 174 L472 328 Q472 464 280 584 Q88 464 88 328 Z" />
                <path fill="none" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" strokeLinejoin="round"
                      d="M280 48 L492 134 L492 250" />
                <g transform="translate(280, 320)">
                  <circle fill="rgba(22, 163, 74, 0.4)" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1.5" cx="0" cy="0" r="58" />
                  <path fill="none" stroke="rgba(255, 255, 255, 0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M-25 -2 L-8 18 L25 -20" />
                </g>
              </svg>
            </div>
          </div>
          <div className="bg-layer clouds">
            <div className="cloud cloud-1"><svg viewBox="0 0 260 80"><ellipse cx="60" cy="50" rx="60" ry="22" /><ellipse cx="120" cy="38" rx="52" ry="28" /><ellipse cx="180" cy="50" rx="56" ry="20" /><ellipse cx="210" cy="42" rx="36" ry="20" /></svg></div>
            <div className="cloud cloud-2"><svg viewBox="0 0 180 60"><ellipse cx="50" cy="36" rx="48" ry="18" /><ellipse cx="95" cy="28" rx="40" ry="20" /><ellipse cx="135" cy="36" rx="42" ry="16" /></svg></div>
            <div className="cloud cloud-3"><svg viewBox="0 0 220 70"><ellipse cx="50" cy="42" rx="52" ry="20" /><ellipse cx="110" cy="32" rx="46" ry="24" /><ellipse cx="170" cy="42" rx="50" ry="18" /></svg></div>
          </div>
          <div className="bg-layer particles">
            <canvas ref={dustCanvasRef} />
          </div>
        </>
      )}

      {state === 'warn' && (
        <>
          <div className="bg-layer shield">
            <div className="shield-wm shield-warn">
              <svg viewBox="0 0 560 650">
                <path fill="rgba(255, 200, 140, 0.38)" stroke="rgba(253, 186, 116, 0.7)" strokeWidth="1.5"
                      d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                <path fill="url(#hc-hex-warn)" opacity="0.4"
                      d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                <path fill="none" stroke="rgba(253, 186, 116, 0.45)" strokeWidth="1"
                      d="M280 70 L472 150 L472 328 Q472 464 280 584 Q88 464 88 328 L88 150 Z" />
                <path fill="rgba(234, 88, 12, 0.22)"
                      d="M88 268 L472 268 L472 328 Q472 464 280 584 Q88 464 88 328 Z" />
                <path fill="none" stroke="rgba(255, 230, 180, 0.6)" strokeWidth="2" strokeLinejoin="round"
                      d="M280 48 L492 134 L492 250" />
                <path className="crack" fill="none" stroke="rgba(194, 65, 12, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4"
                      d="M280 60 L260 180 L300 280 L240 400 L290 560" />
                <path className="crack" fill="none" stroke="rgba(194, 65, 12, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4"
                      d="M360 110 L336 210 L384 330" />
                <path className="crack" fill="none" stroke="rgba(194, 65, 12, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 4"
                      d="M180 200 L220 310" />
                <g transform="translate(280, 320)">
                  <circle fill="rgba(234, 88, 12, 0.35)" stroke="rgba(255, 220, 180, 0.55)" strokeWidth="1.5" cx="0" cy="0" r="58" />
                  <line stroke="rgba(255, 255, 255, 0.85)" strokeWidth="3.5" strokeLinecap="round" x1="0" y1="-30" x2="0" y2="10" />
                  <circle fill="rgba(255, 255, 255, 0.85)" cx="0" cy="28" r="5" />
                </g>
              </svg>
            </div>
          </div>
          <div className="bg-layer clouds">
            <div className="heavy-cloud hc-1"><svg viewBox="0 0 500 140"><ellipse cx="80" cy="80" rx="100" ry="40" /><ellipse cx="180" cy="60" rx="110" ry="50" /><ellipse cx="290" cy="70" rx="100" ry="46" /><ellipse cx="400" cy="82" rx="100" ry="42" /></svg></div>
            <div className="heavy-cloud hc-2"><svg viewBox="0 0 420 120"><ellipse cx="70" cy="70" rx="90" ry="34" /><ellipse cx="160" cy="56" rx="90" ry="42" /><ellipse cx="250" cy="66" rx="90" ry="38" /><ellipse cx="340" cy="76" rx="80" ry="34" /></svg></div>
            <div className="heavy-cloud hc-3"><svg viewBox="0 0 380 110"><ellipse cx="60" cy="60" rx="80" ry="30" /><ellipse cx="150" cy="48" rx="84" ry="38" /><ellipse cx="240" cy="58" rx="80" ry="32" /><ellipse cx="320" cy="66" rx="70" ry="30" /></svg></div>
            <div className="heavy-cloud hc-4"><svg viewBox="0 0 320 100"><ellipse cx="60" cy="60" rx="70" ry="28" /><ellipse cx="140" cy="48" rx="74" ry="32" /><ellipse cx="220" cy="58" rx="70" ry="30" /><ellipse cx="280" cy="64" rx="50" ry="24" /></svg></div>
            <div className="mist" />
          </div>
          <div className="bg-layer particles">
            <canvas ref={warnCanvasRef} />
          </div>
        </>
      )}

      {state === 'err' && (
        <>
          <div className="bg-layer sky">
            <svg className="sky-turb-svg" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" filter="url(#hc-sky-turb)" />
            </svg>
          </div>
          <div className="bg-layer shield">
            <div className="shield-wm shield-err">
              <svg viewBox="0 0 560 650">
                <defs>
                  <clipPath id="hc-left-clip">
                    <path d="M0 0 L290 0 L260 120 L300 220 L256 320 L290 420 L258 520 L304 650 L0 650 Z" />
                  </clipPath>
                  <clipPath id="hc-right-clip">
                    <path d="M290 0 L560 0 L560 650 L304 650 L258 520 L290 420 L256 320 L300 220 L260 120 Z" />
                  </clipPath>
                  <clipPath id="hc-shield-clip">
                    <path d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                  </clipPath>
                </defs>
                <g className="left-half" clipPath="url(#hc-left-clip)">
                  <path fill="rgba(60, 20, 25, 0.55)" stroke="rgba(252, 165, 165, 0.8)" strokeWidth="1.5"
                        d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                  <path fill="url(#hc-hex-err)" opacity="0.35" clipPath="url(#hc-shield-clip)"
                        d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                  <path fill="none" stroke="rgba(252, 165, 165, 0.5)" strokeWidth="1"
                        d="M280 70 L472 150 L472 328 Q472 464 280 584 Q88 464 88 328 L88 150 Z" />
                  <path fill="rgba(220, 38, 38, 0.4)"
                        d="M88 394 L472 394 L472 328 Q472 464 280 584 Q88 464 88 328 Z" />
                  <path fill="none" stroke="rgba(252, 165, 165, 0.7)" strokeWidth="1.4" strokeLinecap="round" d="M160 100 L210 200 L170 280" />
                  <path fill="none" stroke="rgba(252, 165, 165, 0.7)" strokeWidth="1.4" strokeLinecap="round" d="M140 360 L190 430" />
                </g>
                <g className="right-half" clipPath="url(#hc-right-clip)">
                  <path fill="rgba(60, 20, 25, 0.55)" stroke="rgba(252, 165, 165, 0.8)" strokeWidth="1.5"
                        d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                  <path fill="url(#hc-hex-err)" opacity="0.35" clipPath="url(#hc-shield-clip)"
                        d="M280 40 L500 130 L500 330 Q500 480 280 610 Q60 480 60 330 L60 130 Z" />
                  <path fill="none" stroke="rgba(252, 165, 165, 0.5)" strokeWidth="1"
                        d="M280 70 L472 150 L472 328 Q472 464 280 584 Q88 464 88 328 L88 150 Z" />
                  <path fill="rgba(220, 38, 38, 0.4)"
                        d="M88 394 L472 394 L472 328 Q472 464 280 584 Q88 464 88 328 Z" />
                  <path fill="none" stroke="rgba(252, 165, 165, 0.7)" strokeWidth="1.4" strokeLinecap="round" d="M400 100 L350 200 L394 280" />
                  <path fill="none" stroke="rgba(252, 165, 165, 0.7)" strokeWidth="1.4" strokeLinecap="round" d="M420 360 L370 430" />
                </g>
                <g filter="url(#hc-rough-edge)">
                  <path fill="none" stroke="rgba(255, 200, 200, 0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M290 0 L260 120 L300 220 L256 320 L290 420 L258 520 L304 650" />
                </g>
                <circle className="spark" fill="rgba(255, 220, 220, 0.95)" cx="272" cy="160" r="3" />
                <circle className="spark" fill="rgba(255, 220, 220, 0.95)" cx="295" cy="260" r="2.5" />
                <circle className="spark" fill="rgba(255, 220, 220, 0.95)" cx="268" cy="360" r="4" />
                <circle className="spark" fill="rgba(255, 220, 220, 0.95)" cx="285" cy="460" r="2.5" />
                <circle className="spark" fill="rgba(255, 220, 220, 0.95)" cx="275" cy="560" r="3" />
                <circle className="spark" fill="rgba(255, 220, 220, 0.95)" cx="302" cy="80" r="2" />
              </svg>
            </div>
          </div>
          <div className="bg-layer clouds">
            <div className="dark-cloud dk-1"><svg viewBox="0 0 620 170"><ellipse cx="100" cy="90" rx="120" ry="46" /><ellipse cx="220" cy="70" rx="130" ry="56" /><ellipse cx="350" cy="82" rx="130" ry="52" /><ellipse cx="490" cy="94" rx="120" ry="46" /></svg></div>
            <div className="dark-cloud dk-2"><svg viewBox="0 0 520 150"><ellipse cx="90" cy="80" rx="100" ry="40" /><ellipse cx="200" cy="60" rx="110" ry="50" /><ellipse cx="320" cy="74" rx="110" ry="44" /><ellipse cx="440" cy="86" rx="100" ry="40" /></svg></div>
            <div className="dark-cloud dk-3"><svg viewBox="0 0 460 130"><ellipse cx="80" cy="70" rx="90" ry="34" /><ellipse cx="180" cy="56" rx="100" ry="44" /><ellipse cx="290" cy="68" rx="96" ry="38" /><ellipse cx="400" cy="78" rx="80" ry="34" /></svg></div>
            <div className="dark-cloud dk-4"><svg viewBox="0 0 380 110"><ellipse cx="70" cy="60" rx="80" ry="30" /><ellipse cx="160" cy="48" rx="88" ry="36" /><ellipse cx="260" cy="58" rx="80" ry="32" /><ellipse cx="340" cy="64" rx="60" ry="28" /></svg></div>
            <div className="rain-overlay" />
          </div>
          <div className="bg-layer rain">
            <canvas ref={rainCanvasRef} />
          </div>
          <div className="bg-layer lightning">
            <div className="lightning-bolt" ref={bolt1Ref} style={{ top: '10%', left: '25%' }}>
              <svg width="50" height="150" viewBox="0 0 60 180"><path d="M35 0 L12 70 L28 70 L20 130 L45 70 L30 70 L42 0 Z" /></svg>
            </div>
            <div className="lightning-bolt" ref={bolt2Ref} style={{ top: '8%', right: '30%' }}>
              <svg width="44" height="130" viewBox="0 0 50 160"><path d="M28 0 L8 55 L22 55 L14 110 L38 52 L24 52 L35 0 Z" /></svg>
            </div>
            <div className="lightning-bolt" ref={bolt3Ref} style={{ top: '12%', left: '50%' }}>
              <svg width="40" height="120" viewBox="0 0 44 150"><path d="M25 0 L8 50 L20 50 L14 100 L34 48 L22 48 L32 0 Z" /></svg>
            </div>
            <div className="flash-overlay" ref={flashRef} />
          </div>
        </>
      )}

      <div className="content">
        <div className="top-row">
          <div className="state-chip">
            <span className="dot" />
            {chipLabel}
          </div>
          <h2 className="headline">{headline}</h2>
        </div>

        <div className="hero-stats">
          <div className="big-pct"><span>{percentage}</span><small>%</small></div>
        </div>

        <div className="data-pill">
          <div>
            <div className="k">Permisos</div>
            <div className="v">{permitsDone} de {permitsTotal}</div>
          </div>
          <div className="vdiv" />
          <div>
            <div className="k">Locales</div>
            <div className="v">{locations}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ComplianceWeatherCard = memo(ComplianceWeatherCardImpl);

const CSS = `
/* ============ base ============ */
.hero-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  min-height: 340px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  isolation: isolate;
  color: #0f265c;
}
.hero-card--sunny { background: linear-gradient(180deg, #6ab0ff 0%, #a6c8eb 35%, #d7e4f3 65%, #f4f1ea 100%); color: #0f265c; }
.hero-card--warn  { background: linear-gradient(180deg, #3d4a5c 0%, #55637a 30%, #6b7a91 60%, #7a849a 100%); color: #f1f5f9; }
.hero-card--err   { background: linear-gradient(180deg, #0a0d1a 0%, #1a1428 40%, #2a1820 70%, #3a1a1a 100%); color: #fecaca; }

.hero-card .bg-layer {
  position: absolute; inset: 0;
  pointer-events: none; overflow: hidden;
}
.hero-card .bg-layer.sun       { z-index: 1; }
.hero-card .bg-layer.sky       { z-index: 1; }
.hero-card .bg-layer.shield    { z-index: 2; }
.hero-card .bg-layer.clouds    { z-index: 3; }
.hero-card .bg-layer.particles { z-index: 4; }
.hero-card .bg-layer.rain      { z-index: 4; }
.hero-card .bg-layer.lightning { z-index: 7; }

/* canvas */
.hero-card canvas {
  position: absolute !important;
  inset: 0;
  width: 100%; height: 100%;
  pointer-events: none; display: block;
}
.hero-card .sky-turb-svg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  opacity: 0.4; mix-blend-mode: screen;
}

/* ============ sun (sunny) ============ */
.hero-card .sun-halo {
  position: absolute; top: -120px; right: 80px;
  width: 360px; height: 360px;
  background: radial-gradient(circle, rgba(255, 248, 220, 0.8) 0%, rgba(255, 230, 160, 0.5) 30%, transparent 70%);
  border-radius: 50%; animation: hcSunBreathe 5s ease-in-out infinite;
  filter: blur(2px);
}
.hero-card .sun-core {
  position: absolute; top: 40px; right: 170px;
  width: 100px; height: 100px;
  background: radial-gradient(circle, rgba(255, 252, 240, 1) 0%, rgba(255, 240, 180, 0.85) 40%, transparent 100%);
  border-radius: 50%; filter: blur(3px);
  animation: hcSunCorePulse 3s ease-in-out infinite;
}
@keyframes hcSunBreathe { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.95; } }
@keyframes hcSunCorePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }

/* ============ clouds (sunny) ============ */
.hero-card .cloud { position: absolute; filter: url(#hc-cloud-filter); }
.hero-card .cloud svg { display: block; overflow: visible; }
.hero-card .cloud ellipse { fill: white; }
.hero-card .cloud-1 { top: 40px; left: 0; width: 200px; opacity: 0.82; animation: hcCloudDrift 50s linear infinite; }
.hero-card .cloud-2 { top: 120px; left: 0; width: 160px; opacity: 0.62; animation: hcCloudDrift 70s linear infinite -20s; }
.hero-card .cloud-3 { top: 30px; left: 0; width: 180px; opacity: 0.78; animation: hcCloudDrift 40s linear infinite -35s; }
@keyframes hcCloudDrift {
  from { transform: translateX(-120%); }
  to   { transform: translateX(1000%); }
}

/* ============ heavy clouds (warn) ============ */
.hero-card .heavy-cloud { position: absolute; filter: url(#hc-heavy-cloud-filter); }
.hero-card .heavy-cloud svg { display: block; overflow: visible; }
.hero-card .heavy-cloud ellipse { fill: rgba(35, 42, 56, 0.72); }
.hero-card .hc-1 { top: -30px; left: 0; width: 360px; animation: hcCloudDrift 90s linear infinite; }
.hero-card .hc-2 { top: 30px; left: 0; width: 300px; animation: hcCloudDrift 110s linear infinite -40s; }
.hero-card .hc-3 { top: 80px; left: 0; width: 280px; opacity: 0.82; animation: hcCloudDrift 70s linear infinite -20s; }
.hero-card .hc-4 { top: 130px; left: 0; width: 240px; opacity: 0.7; animation: hcCloudDrift 80s linear infinite -50s; }
.hero-card .mist {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
  animation: hcMistMove 8s ease-in-out infinite;
  mix-blend-mode: overlay;
}
@keyframes hcMistMove { 0%,100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 0.55; transform: translateY(-5px); } }

/* ============ storm clouds + rain (err) ============ */
.hero-card .dark-cloud { position: absolute; filter: url(#hc-storm-cloud-filter); }
.hero-card .dark-cloud svg { display: block; overflow: visible; }
.hero-card .dark-cloud ellipse { fill: rgba(10, 10, 20, 0.9); }
.hero-card .dk-1 { top: -50px; left: 0; width: 440px; animation: hcStormRoll 40s ease-in-out infinite; }
.hero-card .dk-2 { top: 20px; left: 20%; width: 360px; animation: hcStormRoll 50s ease-in-out infinite -15s; }
.hero-card .dk-3 { top: 70px; left: 45%; width: 320px; opacity: 0.88; animation: hcStormRoll 45s ease-in-out infinite -25s; }
.hero-card .dk-4 { top: 100px; left: 0; width: 280px; opacity: 0.8; animation: hcStormRoll 55s ease-in-out infinite -35s; }
@keyframes hcStormRoll { 0% { transform: translateX(-40px); } 50% { transform: translateX(20px); } 100% { transform: translateX(-40px); } }

.hero-card .rain-overlay {
  position: absolute; inset: 0;
  background-image: linear-gradient(105deg,
    transparent 0%, transparent 49.5%,
    rgba(160, 180, 220, 0.16) 49.5%, rgba(160, 180, 220, 0.16) 50.5%,
    transparent 50.5%, transparent 100%);
  background-size: 3px 26px;
  animation: hcRainFall 0.5s linear infinite;
  opacity: 0.5;
}
@keyframes hcRainFall { from { background-position: 0 0; } to { background-position: -10px 26px; } }

/* ============ lightning (err) ============ */
.hero-card .lightning-bolt {
  position: absolute;
  opacity: 0; pointer-events: none;
  filter: drop-shadow(0 0 8px rgba(200, 220, 255, 0.8)) drop-shadow(0 0 24px rgba(180, 200, 255, 0.6));
}
.hero-card .lightning-bolt svg { overflow: visible; }
.hero-card .lightning-bolt path { fill: white; stroke: rgba(200, 220, 255, 0.9); stroke-width: 0.5; }
.hero-card .flash-overlay {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.95), rgba(200,220,255,0.3) 40%, transparent 70%);
  opacity: 0; pointer-events: none;
}

/* ============ shield watermark ============ */
.hero-card .shield-wm {
  position: absolute;
  top: 50%; right: -80px;
  transform: translateY(-50%);
  width: 380px; height: 450px;
  pointer-events: none;
  filter: blur(1.4px);
}
.hero-card .shield-wm svg { width: 100%; height: 100%; display: block; }

.hero-card .shield-ok {
  opacity: 0.22;
  animation: hcShieldBreathe 5s ease-in-out infinite;
}
@keyframes hcShieldBreathe {
  0%,100% { transform: translateY(-50%) scale(1); }
  50%     { transform: translateY(-50%) scale(1.012); }
}

.hero-card .shield-warn {
  opacity: 0.26;
  animation: hcShieldWobble 6s ease-in-out infinite;
}
@keyframes hcShieldWobble {
  0%,100% { transform: translateY(-50%) rotate(0deg); }
  33% { transform: translateY(-50%) rotate(-0.3deg); }
  66% { transform: translateY(-50%) rotate(0.3deg); }
}
.hero-card .shield-warn .crack {
  animation: hcCrackGlow 3s ease-in-out infinite;
}
@keyframes hcCrackGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 0.85; } }

.hero-card .shield-err {
  opacity: 0.28;
}
.hero-card .shield-err .left-half,
.hero-card .shield-err .right-half {
  transform-origin: center; transform-box: fill-box;
}
.hero-card .shield-err .left-half  { animation: hcBreakLeft 6s ease-in-out infinite; }
.hero-card .shield-err .right-half { animation: hcBreakRight 6s ease-in-out infinite; }
@keyframes hcBreakLeft {
  0%, 50% { transform: translateX(0) rotate(0deg); }
  70% { transform: translateX(-16px) rotate(-3.5deg); }
  100% { transform: translateX(-8px) rotate(-1.8deg); }
}
@keyframes hcBreakRight {
  0%, 50% { transform: translateX(0) rotate(0deg); }
  70% { transform: translateX(16px) rotate(3.5deg); }
  100% { transform: translateX(8px) rotate(1.8deg); }
}
.hero-card .shield-err .spark {
  animation: hcSparkFlicker 2s ease-in-out infinite;
}
.hero-card .shield-err .spark:nth-child(odd) { animation-delay: -0.7s; }
.hero-card .shield-err .spark:nth-child(3n) { animation-delay: -1.3s; }
@keyframes hcSparkFlicker { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }

/* ============ content ============ */
.hero-card .content {
  position: relative;
  z-index: 10;
  padding: 32px 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  min-height: 340px;
}

.hero-card .state-chip {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 5px 12px;
  border-radius: 100px;
  font-size: 10px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase;
  color: white;
  align-self: flex-start;
}
.hero-card--sunny .state-chip { background: #15803d; box-shadow: 0 2px 8px rgba(21, 128, 61, 0.25); }
.hero-card--warn  .state-chip { background: #c2410c; box-shadow: 0 2px 8px rgba(194, 65, 12, 0.3); }
.hero-card--err   .state-chip { background: #dc2626; box-shadow: 0 2px 12px rgba(220, 38, 38, 0.45); }

.hero-card .state-chip .dot {
  width: 7px; height: 7px; border-radius: 50%;
  animation: hcPulse 2s ease-in-out infinite;
}
.hero-card--sunny .state-chip .dot { background: #bbf7d0; box-shadow: 0 0 6px #bbf7d0; }
.hero-card--warn  .state-chip .dot { background: #fed7aa; box-shadow: 0 0 6px #fed7aa; }
.hero-card--err   .state-chip .dot { background: #fecaca; box-shadow: 0 0 6px #fecaca; }
@keyframes hcPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(1.15); } }

.hero-card .top-row {
  display: flex; flex-direction: column; gap: 12px;
  max-width: 520px;
}

.hero-card .headline {
  font-size: 24px; font-weight: 400; letter-spacing: -0.2px;
  line-height: 1.35; margin: 0;
}
.hero-card--sunny .headline { color: #0f265c; }
.hero-card--warn  .headline { color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.hero-card--err   .headline { color: #fef2f2; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
.hero-card .headline b { font-weight: 600; }
.hero-card .headline .brand { font-weight: 600; }

.hero-card .hero-stats {
  display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap;
}
.hero-card .big-pct {
  font-size: 120px; font-weight: 100; line-height: 0.9;
  letter-spacing: -5px;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 2px 14px rgba(255,255,255,0.5);
}
.hero-card--sunny .big-pct { color: #166534; }
.hero-card--warn  .big-pct { color: #fed7aa; text-shadow: 0 2px 16px rgba(0,0,0,0.3); }
.hero-card--err   .big-pct { color: #fca5a5; text-shadow: 0 0 24px rgba(252,165,165,0.6), 0 2px 8px rgba(0,0,0,0.8); }
.hero-card .big-pct small {
  font-size: 38px; font-weight: 200; opacity: 0.75;
  margin-left: 0; letter-spacing: -1.4px;
}

.hero-card .data-pill {
  display: inline-flex; align-items: center; gap: 20px;
  padding: 9px 16px;
  border-radius: 11px;
  backdrop-filter: blur(14px);
  align-self: flex-start;
}
.hero-card--sunny .data-pill {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(15, 38, 92, 0.12);
  color: #172b4d;
}
.hero-card--warn .data-pill {
  background: rgba(20, 25, 40, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
}
.hero-card--err .data-pill {
  background: rgba(60, 15, 20, 0.65);
  border: 1px solid rgba(252, 165, 165, 0.25);
  color: #fef2f2;
}
.hero-card .data-pill .k { font-size: 10px; font-weight: 500; opacity: 0.75; }
.hero-card .data-pill .v { font-size: 19px; font-weight: 300; margin-top: 3px; font-variant-numeric: tabular-nums; letter-spacing: -0.3px; }
.hero-card .data-pill .vdiv { width: 1px; height: 24px; background: currentColor; opacity: 0.22; }
`;
