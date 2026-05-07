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

  // Sunny: dust particles (copiado 1:1 de 1h)
  useEffect(() => {
    if (state !== 'sunny') return;
    const canvas = dustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; alpha: number; phase: number }> = [];
    const N = 60;
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

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [state]);

  // Warn: mist particles (copiado 1:1 de 1h)
  useEffect(() => {
    if (state !== 'warn') return;
    const canvas = warnCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Array<{ x: number; y: number; r: number; vx: number; vy: number; alpha: number }> = [];
    const N = 35;
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
        r: Math.random() * 30 + 20,
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

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [state]);

  // Err: rain + lightning (copiado 1:1 de 1h)
  useEffect(() => {
    if (state !== 'err') return;
    const canvas = rainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drops: Array<{ x: number; y: number; length: number; speed: number; alpha: number; thickness: number; drift: number }> = [];
    const N = 220;
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
        length: depth * 18 + 8,
        speed: depth * 12 + 5,
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

    // Lightning (copiado 1:1)
    let strikeTimeout: ReturnType<typeof setTimeout>;
    function strike() {
      const flash = flashRef.current;
      const bolts = [bolt1Ref.current, bolt2Ref.current, bolt3Ref.current].filter(Boolean) as HTMLDivElement[];
      if (!flash || bolts.length === 0) return;
      const bolt = bolts[Math.floor(Math.random() * bolts.length)];
      const nextDelay = 3000 + Math.random() * 6000;
      flash.animate([
        { opacity: 0 }, { opacity: 1, offset: 0.08 },
        { opacity: 0.4, offset: 0.18 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0 },
      ], { duration: 700, easing: 'ease-out' });
      bolt.animate([
        { opacity: 0 }, { opacity: 1, offset: 0.08 },
        { opacity: 0.3, offset: 0.18 }, { opacity: 1, offset: 0.25 }, { opacity: 0 },
      ], { duration: 700, easing: 'ease-out' });
      strikeTimeout = setTimeout(strike, nextDelay);
    }
    strikeTimeout = setTimeout(strike, 1500);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      clearTimeout(strikeTimeout);
    };
  }, [state]);

  return (
    <div className={`cwc scene ${state}`}>
      <style>{CSS}</style>

      {/* Global SVG defs — identical to 1h */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="cloud-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={2} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" />
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id="heavy-cloud-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={4} seed={5} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" />
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="storm-cloud-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves={5} seed={8} result="noise">
              <animate attributeName="baseFrequency" values="0.015;0.02;0.015" dur="30s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="28" />
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="sky-turb">
            <feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves={4} seed={3}>
              <animate attributeName="baseFrequency" values="0.006;0.01;0.006" dur="20s" repeatCount="indefinite" />
            </feTurbulence>
            <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0 0.4  0 0 0 0.4 0" />
          </filter>
        </defs>
      </svg>

      {/* SUNNY */}
      {state === 'sunny' && (
        <>
          <div className="sun-halo" />
          <div className="sun-rays" />
          <div className="sun-core" />
          <div className="lens-flare lf-1" />
          <div className="lens-flare lf-2" />
          <div className="lens-flare lf-3" />

          <div className="cloud cloud-1">
            <svg viewBox="0 0 260 80"><ellipse cx="60" cy="50" rx="60" ry="22" /><ellipse cx="120" cy="38" rx="52" ry="28" /><ellipse cx="180" cy="50" rx="56" ry="20" /><ellipse cx="210" cy="42" rx="36" ry="20" /></svg>
          </div>
          <div className="cloud cloud-2">
            <svg viewBox="0 0 180 60"><ellipse cx="50" cy="36" rx="48" ry="18" /><ellipse cx="95" cy="28" rx="40" ry="20" /><ellipse cx="135" cy="36" rx="42" ry="16" /></svg>
          </div>
          <div className="cloud cloud-3">
            <svg viewBox="0 0 220 70"><ellipse cx="50" cy="42" rx="52" ry="20" /><ellipse cx="110" cy="32" rx="46" ry="24" /><ellipse cx="170" cy="42" rx="50" ry="18" /></svg>
          </div>

          <canvas className="particles" ref={dustCanvasRef} />
        </>
      )}

      {/* WARN */}
      {state === 'warn' && (
        <>
          <div className="sun-behind" />

          <div className="heavy-cloud hc-1">
            <svg viewBox="0 0 500 140"><ellipse cx="80" cy="80" rx="100" ry="40" /><ellipse cx="180" cy="60" rx="110" ry="50" /><ellipse cx="290" cy="70" rx="100" ry="46" /><ellipse cx="400" cy="82" rx="100" ry="42" /></svg>
          </div>
          <div className="heavy-cloud hc-2">
            <svg viewBox="0 0 420 120"><ellipse cx="70" cy="70" rx="90" ry="34" /><ellipse cx="160" cy="56" rx="90" ry="42" /><ellipse cx="250" cy="66" rx="90" ry="38" /><ellipse cx="340" cy="76" rx="80" ry="34" /></svg>
          </div>
          <div className="heavy-cloud hc-3">
            <svg viewBox="0 0 380 110"><ellipse cx="60" cy="60" rx="80" ry="30" /><ellipse cx="150" cy="48" rx="84" ry="38" /><ellipse cx="240" cy="58" rx="80" ry="32" /><ellipse cx="320" cy="66" rx="70" ry="30" /></svg>
          </div>
          <div className="heavy-cloud hc-4">
            <svg viewBox="0 0 320 100"><ellipse cx="60" cy="60" rx="70" ry="28" /><ellipse cx="140" cy="48" rx="74" ry="32" /><ellipse cx="220" cy="58" rx="70" ry="30" /><ellipse cx="280" cy="64" rx="50" ry="24" /></svg>
          </div>

          <div className="mist" />
          <canvas className="particles" ref={warnCanvasRef} />
        </>
      )}

      {/* ERR */}
      {state === 'err' && (
        <>
          <svg className="bg-svg sky-turbulence" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" filter="url(#sky-turb)" />
          </svg>

          <div className="dark-cloud dk-1">
            <svg viewBox="0 0 620 170"><ellipse cx="100" cy="90" rx="120" ry="46" /><ellipse cx="220" cy="70" rx="130" ry="56" /><ellipse cx="350" cy="82" rx="130" ry="52" /><ellipse cx="490" cy="94" rx="120" ry="46" /></svg>
          </div>
          <div className="dark-cloud dk-2">
            <svg viewBox="0 0 520 150"><ellipse cx="90" cy="80" rx="100" ry="40" /><ellipse cx="200" cy="60" rx="110" ry="50" /><ellipse cx="320" cy="74" rx="110" ry="44" /><ellipse cx="440" cy="86" rx="100" ry="40" /></svg>
          </div>
          <div className="dark-cloud dk-3">
            <svg viewBox="0 0 460 130"><ellipse cx="80" cy="70" rx="90" ry="34" /><ellipse cx="180" cy="56" rx="100" ry="44" /><ellipse cx="290" cy="68" rx="96" ry="38" /><ellipse cx="400" cy="78" rx="80" ry="34" /></svg>
          </div>
          <div className="dark-cloud dk-4">
            <svg viewBox="0 0 380 110"><ellipse cx="70" cy="60" rx="80" ry="30" /><ellipse cx="160" cy="48" rx="88" ry="36" /><ellipse cx="260" cy="58" rx="80" ry="32" /><ellipse cx="340" cy="64" rx="60" ry="28" /></svg>
          </div>

          <div className="rain-overlay" />
          <canvas className="rain" ref={rainCanvasRef} />

          <div className="flash-overlay" ref={flashRef} />
          <div className="lightning-bolt" ref={bolt1Ref} style={{ top: '10%', left: '25%' }}>
            <svg width="60" height="180" viewBox="0 0 60 180"><path d="M35 0 L12 70 L28 70 L20 130 L45 70 L30 70 L42 0 Z" /></svg>
          </div>
          <div className="lightning-bolt" ref={bolt2Ref} style={{ top: '8%', right: '18%' }}>
            <svg width="50" height="160" viewBox="0 0 50 160"><path d="M28 0 L8 55 L22 55 L14 110 L38 52 L24 52 L35 0 Z" /></svg>
          </div>
          <div className="lightning-bolt" ref={bolt3Ref} style={{ top: '12%', left: '55%' }}>
            <svg width="44" height="150" viewBox="0 0 44 150"><path d="M25 0 L8 50 L20 50 L14 100 L34 48 L22 48 L32 0 Z" /></svg>
          </div>
        </>
      )}

      <div className="content">
        <div className="top-row">
          <div className="top-left">
            <div className={`state-chip ${state === 'sunny' ? 'ok' : state}`}>
              <span className="dot" />
              {chipLabel}
            </div>
            <h2 className="headline">{headline}</h2>
          </div>
        </div>

        <div className="hero">
          <div className="big-pct"><span>{percentage}</span><small>%</small></div>
        </div>

        <div className="data-pill">
          <div className="item">
            <div className="k">Permisos</div>
            <div className="v">{permitsDone} / {permitsTotal}</div>
          </div>
          <div className="vdiv" />
          <div className="item">
            <div className="k">Locales</div>
            <div className="v">{locations}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ComplianceWeatherCard = memo(ComplianceWeatherCardImpl);

/* CSS copiado 1:1 de question-1h-pulido-final.html.
 * Solo cambia: .scene → .cwc.scene (scoping) para no colisionar con otros ".scene" globales. */
const CSS = `
.cwc.scene {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  min-height: 460px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.06);
  isolation: isolate;
}
.cwc.scene canvas, .cwc.scene svg.bg-svg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}
.cwc.scene .content {
  position: relative; z-index: 10;
  padding: 44px 48px 36px;
  display: flex; flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-height: 460px;
}
.cwc.scene .top-row {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px;
}
.cwc.scene .top-left { display: flex; flex-direction: column; gap: 12px; }
.cwc.scene .headline {
  font-size: 30px; font-weight: 400; letter-spacing: -0.5px;
  line-height: 1.25; margin: 0;
  max-width: 500px;
}
.cwc.scene .headline b { font-weight: 600; }
.cwc.scene .hero {
  display: flex; align-items: baseline; gap: 20px;
  flex-wrap: wrap;
  margin-top: auto;
}
.cwc.scene .big-pct {
  font-size: 180px; font-weight: 100; line-height: 0.9;
  letter-spacing: -8px;
  font-variant-numeric: tabular-nums;
}
.cwc.scene .big-pct small { font-size: 60px; font-weight: 200; opacity: 0.75; margin-left: 0; letter-spacing: -2px; }

/* state chip */
.cwc.scene .state-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 14px;
  border-radius: 100px;
  font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  backdrop-filter: blur(6px);
  border: 1px solid transparent;
}
.cwc.scene .state-chip .dot {
  width: 8px; height: 8px; border-radius: 50%;
  animation: cwcPulse 2s ease-in-out infinite;
}
@keyframes cwcPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(1.15); } }
.cwc.scene .state-chip.ok   { background: #15803d; color: white; border-color: #166534; box-shadow: 0 2px 8px rgba(21, 128, 61, 0.25); }
.cwc.scene .state-chip.ok .dot { background: #bbf7d0; box-shadow: 0 0 6px #bbf7d0; }
.cwc.scene .state-chip.warn { background: #c2410c; color: white; border-color: #9a3412; box-shadow: 0 2px 8px rgba(194, 65, 12, 0.3); }
.cwc.scene .state-chip.warn .dot { background: #fed7aa; box-shadow: 0 0 6px #fed7aa; }
.cwc.scene .state-chip.err  { background: #dc2626; color: white; border-color: #991b1b; box-shadow: 0 2px 12px rgba(220, 38, 38, 0.45); }
.cwc.scene .state-chip.err .dot { background: #fecaca; box-shadow: 0 0 8px #fecaca; }

/* data pill */
.cwc.scene .data-pill {
  display: inline-flex; align-items: center; gap: 28px;
  padding: 14px 24px;
  border-radius: 14px;
  backdrop-filter: blur(14px) saturate(180%);
  -webkit-backdrop-filter: blur(14px) saturate(180%);
  margin-top: 28px;
  align-self: flex-start;
}
.cwc.scene .data-pill .item .k {
  font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
  font-weight: 600; opacity: 0.75;
}
.cwc.scene .data-pill .item .v {
  font-size: 26px; font-weight: 200; letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums; line-height: 1;
  margin-top: 4px;
}
.cwc.scene .data-pill .vdiv { width: 1px; height: 34px; background: currentColor; opacity: 0.2; }

/* ============ SUNNY ============ */
.cwc.scene.sunny {
  background: linear-gradient(180deg,
    #6ab0ff 0%,
    #a6c8eb 35%,
    #d7e4f3 65%,
    #f4f1ea 100%);
  color: #172b4d;
}
.cwc.scene.sunny .big-pct { color: #1b5e20; text-shadow: 0 2px 16px rgba(255,255,255,0.5); }
.cwc.scene.sunny .data-pill {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(15, 38, 92, 0.12);
  box-shadow: 0 4px 16px rgba(15, 38, 92, 0.08);
  color: #172b4d;
}
.cwc.scene.sunny .sun-halo {
  position: absolute;
  top: -120px; right: -120px;
  width: 520px; height: 520px;
  background: radial-gradient(circle,
    rgba(255, 248, 220, 0.95) 0%,
    rgba(255, 230, 160, 0.85) 12%,
    rgba(255, 210, 120, 0.5) 28%,
    rgba(255, 190, 90, 0.25) 45%,
    rgba(255, 180, 80, 0.08) 65%,
    transparent 80%);
  border-radius: 50%;
  animation: cwcSunBreathe 5s ease-in-out infinite;
  filter: blur(2px);
}
@keyframes cwcSunBreathe { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.95; } }

.cwc.scene.sunny .sun-rays {
  position: absolute;
  top: -280px; right: -280px;
  width: 840px; height: 840px;
  background: conic-gradient(from 0deg,
    transparent 0deg 12deg, rgba(255, 230, 160, 0.12) 14deg 16deg, transparent 18deg 42deg,
    rgba(255, 230, 160, 0.08) 44deg 48deg, transparent 50deg 88deg,
    rgba(255, 230, 160, 0.15) 90deg 92deg, transparent 94deg 128deg,
    rgba(255, 230, 160, 0.1) 130deg 134deg, transparent 136deg 178deg,
    rgba(255, 230, 160, 0.08) 180deg 184deg, transparent 186deg 220deg,
    rgba(255, 230, 160, 0.12) 222deg 226deg, transparent 228deg 272deg,
    rgba(255, 230, 160, 0.08) 274deg 278deg, transparent 280deg 322deg,
    rgba(255, 230, 160, 0.1) 324deg 328deg, transparent 330deg 360deg);
  border-radius: 50%;
  animation: cwcRotateRays 60s linear infinite;
  mix-blend-mode: screen;
}
@keyframes cwcRotateRays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.cwc.scene.sunny .sun-core {
  position: absolute;
  top: 40px; right: 40px;
  width: 140px; height: 140px;
  background: radial-gradient(circle,
    rgba(255, 252, 240, 1) 0%,
    rgba(255, 240, 180, 0.9) 40%,
    rgba(255, 220, 140, 0.4) 70%,
    transparent 100%);
  border-radius: 50%;
  filter: blur(4px);
  animation: cwcSunCorePulse 3s ease-in-out infinite;
}
@keyframes cwcSunCorePulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }

.cwc.scene.sunny .lens-flare {
  position: absolute; border-radius: 50%;
  filter: blur(2px); mix-blend-mode: screen;
}
.cwc.scene.sunny .lf-1 { top: 180px; right: 220px; width: 30px; height: 30px; background: radial-gradient(circle, rgba(180, 220, 255, 0.6), transparent); }
.cwc.scene.sunny .lf-2 { top: 280px; right: 340px; width: 50px; height: 50px; background: radial-gradient(circle, rgba(255, 200, 120, 0.4), transparent); }
.cwc.scene.sunny .lf-3 { top: 320px; right: 480px; width: 24px; height: 24px; background: radial-gradient(circle, rgba(220, 200, 255, 0.5), transparent); }

.cwc.scene.sunny .cloud { position: absolute; filter: url(#cloud-filter); }
.cwc.scene.sunny .cloud svg { overflow: visible; }
.cwc.scene.sunny .cloud ellipse { fill: white; }
.cwc.scene.sunny .cloud-1 { top: 60px; left: -80px; width: 260px; animation: cwcCloudDriftSlow 50s linear infinite; opacity: 0.9; }
.cwc.scene.sunny .cloud-2 { top: 120px; left: 30%; width: 180px; animation: cwcCloudDriftMid 70s linear infinite; opacity: 0.7; }
.cwc.scene.sunny .cloud-3 { top: 40px; left: 55%; width: 220px; animation: cwcCloudDriftFast 40s linear infinite -20s; opacity: 0.85; }
@keyframes cwcCloudDriftSlow { from { transform: translateX(0); } to { transform: translateX(calc(100vw + 300px)); } }
@keyframes cwcCloudDriftMid  { from { transform: translateX(-200px); } to { transform: translateX(calc(100vw + 200px)); } }
@keyframes cwcCloudDriftFast { from { transform: translateX(-300px); } to { transform: translateX(calc(100vw + 300px)); } }

.cwc.scene.sunny canvas.particles { z-index: 2; }

/* ============ WARN ============ */
.cwc.scene.warn {
  background: linear-gradient(180deg,
    #3d4a5c 0%,
    #55637a 30%,
    #6b7a91 60%,
    #7a849a 100%);
  color: #f1f5f9;
}
.cwc.scene.warn .headline { color: white; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
.cwc.scene.warn .big-pct { color: #fed7aa; text-shadow: 0 2px 20px rgba(0,0,0,0.3); }
.cwc.scene.warn .data-pill {
  background: rgba(20, 25, 40, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  color: white;
}
.cwc.scene.warn .sun-behind {
  position: absolute;
  top: 60px; right: 100px;
  width: 140px; height: 140px;
  background: radial-gradient(circle,
    rgba(255, 220, 140, 0.5) 0%,
    rgba(255, 200, 120, 0.3) 30%,
    transparent 70%);
  border-radius: 50%;
  filter: blur(20px);
  animation: cwcSunBreathe 6s ease-in-out infinite;
}
.cwc.scene.warn .heavy-cloud { position: absolute; filter: url(#heavy-cloud-filter); }
.cwc.scene.warn .heavy-cloud svg { overflow: visible; }
.cwc.scene.warn .heavy-cloud ellipse { fill: rgba(35, 42, 56, 0.85); }
.cwc.scene.warn .hc-1 { top: -40px; left: -100px; width: 500px; animation: cwcCloudDriftSlow 90s linear infinite; }
.cwc.scene.warn .hc-2 { top: 20px; left: 20%; width: 420px; animation: cwcCloudDriftMid 110s linear infinite -40s; }
.cwc.scene.warn .hc-3 { top: 80px; left: 55%; width: 380px; animation: cwcCloudDriftFast 70s linear infinite -20s; }
.cwc.scene.warn .hc-4 { top: 140px; left: 0%; width: 320px; animation: cwcCloudDriftSlow 80s linear infinite -50s; opacity: 0.7; }

.cwc.scene.warn .mist {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
  animation: cwcMistMove 8s ease-in-out infinite;
  mix-blend-mode: overlay;
}
@keyframes cwcMistMove { 0%,100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 0.55; transform: translateY(-6px); } }

.cwc.scene.warn canvas.particles { z-index: 2; }

/* ============ ERR (STORM) ============ */
.cwc.scene.err {
  background: linear-gradient(180deg,
    #0a0d1a 0%,
    #1a1428 40%,
    #2a1820 70%,
    #3a1a1a 100%);
  color: #fecaca;
}
.cwc.scene.err .headline { color: #fef2f2; text-shadow: 0 1px 4px rgba(0,0,0,0.5); }
.cwc.scene.err .big-pct { color: #fca5a5; text-shadow: 0 0 30px rgba(252,165,165,0.6), 0 2px 10px rgba(0,0,0,0.8); }
.cwc.scene.err .data-pill {
  background: rgba(60, 15, 20, 0.65);
  border: 1px solid rgba(252, 165, 165, 0.25);
  box-shadow: 0 4px 28px rgba(220, 38, 38, 0.35);
  color: #fef2f2;
}

.cwc.scene.err .sky-turbulence {
  position: absolute; inset: 0;
  opacity: 0.4; mix-blend-mode: screen;
}
.cwc.scene.err .dark-cloud { position: absolute; filter: url(#storm-cloud-filter); }
.cwc.scene.err .dark-cloud svg { overflow: visible; }
.cwc.scene.err .dark-cloud ellipse { fill: rgba(10, 10, 20, 0.95); }
.cwc.scene.err .dk-1 { top: -60px; left: -120px; width: 620px; animation: cwcStormRoll 40s ease-in-out infinite; }
.cwc.scene.err .dk-2 { top: 10px; left: 25%; width: 520px; animation: cwcStormRoll 50s ease-in-out infinite -15s; }
.cwc.scene.err .dk-3 { top: 60px; left: 55%; width: 460px; animation: cwcStormRoll 45s ease-in-out infinite -25s; }
.cwc.scene.err .dk-4 { top: 100px; left: -40px; width: 380px; animation: cwcStormRoll 55s ease-in-out infinite -35s; opacity: 0.85; }
@keyframes cwcStormRoll { 0% { transform: translateX(-60px); } 50% { transform: translateX(30px); } 100% { transform: translateX(-60px); } }

.cwc.scene.err canvas.rain { z-index: 3; }

.cwc.scene.err .flash-overlay {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.95), rgba(200,220,255,0.3) 40%, transparent 70%);
  opacity: 0; z-index: 8; pointer-events: none;
}
.cwc.scene.err .lightning-bolt {
  position: absolute; z-index: 7; opacity: 0; pointer-events: none;
  filter: drop-shadow(0 0 10px rgba(200, 220, 255, 0.8)) drop-shadow(0 0 30px rgba(180, 200, 255, 0.6));
}
.cwc.scene.err .lightning-bolt svg { overflow: visible; }
.cwc.scene.err .lightning-bolt path { fill: white; stroke: rgba(200, 220, 255, 0.9); stroke-width: 0.5; }

.cwc.scene.err .rain-overlay {
  position: absolute; inset: 0;
  background-image: linear-gradient(105deg,
    transparent 0%, transparent 49.5%,
    rgba(160, 180, 220, 0.18) 49.5%, rgba(160, 180, 220, 0.18) 50.5%,
    transparent 50.5%, transparent 100%);
  background-size: 3px 30px;
  animation: cwcRainFall 0.5s linear infinite;
  opacity: 0.5;
}
@keyframes cwcRainFall { from { background-position: 0 0; } to { background-position: -12px 30px; } }
`;
