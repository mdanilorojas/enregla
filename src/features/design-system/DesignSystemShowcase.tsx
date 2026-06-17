import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import {
  Building2, MapPin, ChevronRight,
  CheckCircle2, Plus
} from '@/lib/lucide-icons';

export function DesignSystemShowcase() {
  const [buttonLoading, setButtonLoading] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 pb-8 border-b border-[var(--color-border)]">
          <h1 className="text-[var(--font-size-3xl)] font-bold text-[var(--color-text)]">
            Sistema de Diseño Enregla
          </h1>
          <p className="text-[var(--font-size-base)] text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Componentes rediseñados con principios de marca "Preciso, Confiable, Protector".
            Revisa cada componente antes de aprobar la implementación completa.
          </p>
        </div>

        {/* Table of Contents */}
        <Card>
          <CardHeader>
            <CardTitle>Índice de Componentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Tokens', 'Botones', 'Badges', 'Cards', 'Skeleton', 'Sede Card', 'Inputs', 'Navegación'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-[var(--color-primary)] hover:underline text-[var(--font-size-sm)]"
                >
                  {item}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 1. Design Tokens */}
        <section id="tokens" className="space-y-6">
          <div>
            <h2 className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)] mb-2">
              1. Design Tokens
            </h2>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              Variables CSS que definen colores, sombras, espaciado y tipografía del sistema.
            </p>
          </div>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Colores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand Colors */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-[var(--color-text-secondary)]">Brand</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-primary)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-secondary)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Secondary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-accent)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Accent</p>
                  </div>
                </div>
              </div>

              {/* Risk Colors */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-[var(--color-text-secondary)]">Niveles de Riesgo</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-risk-critico)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Crítico</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-risk-alto)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Alto</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-risk-medio)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Medio</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-risk-bajo)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Bajo</p>
                  </div>
                </div>
              </div>

              {/* Status Colors */}
              <div>
                <h4 className="text-sm font-semibold mb-3 text-[var(--color-text-secondary)]">Estados de Permisos</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-status-vigente)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Vigente</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-status-por-vencer)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Por Vencer</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-status-vencido)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">Vencido</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-status-en-tramite)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">En Trámite</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-16 rounded-lg bg-[var(--color-status-no-registrado)] shadow-sm"></div>
                    <p className="text-xs text-[var(--color-text-secondary)]">No Registrado</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shadows */}
          <Card>
            <CardHeader>
              <CardTitle>Sombras</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'hover', 'focus'].map((size) => (
                  <div key={size} className="space-y-3">
                    <div
                      className="h-20 rounded-lg bg-white flex items-center justify-center"
                      style={{ boxShadow: `var(--shadow-${size})` }}
                    >
                      <span className="text-xs font-mono text-[var(--color-text-secondary)]">{size}</span>
                    </div>
                    <code className="text-xs text-[var(--color-text-muted)]">--shadow-{size}</code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Tipografía</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  Heading 1 - 3XL Bold
                </p>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                  Heading 2 - 2XL Semibold
                </p>
                <p style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                  Heading 3 - XL Semibold
                </p>
                <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-medium)' }}>
                  Heading 4 - LG Medium
                </p>
                <p style={{ fontSize: 'var(--font-size-base)' }}>
                  Body - Base Regular
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)' }} className="text-[var(--color-text-secondary)]">
                  Small - SM Secondary
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)' }} className="text-[var(--color-text-muted)]">
                  Caption - XS Muted
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Spacing */}
          <Card>
            <CardHeader>
              <CardTitle>Espaciado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['xs', 'sm', 'md', 'lg', 'xl', '2xl'].map((size) => (
                  <div key={size} className="flex items-center gap-4">
                    <code className="text-xs w-24 text-[var(--color-text-secondary)]">--spacing-{size}</code>
                    <div
                      className="h-6 bg-[var(--color-primary)] rounded"
                      style={{ width: `var(--spacing-${size})` }}
                    ></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 2. Buttons */}
        <section id="botones" className="space-y-6">
          <div>
            <h2 className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)] mb-2">
              2. Botones
            </h2>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              Componente Button con variantes, tamaños y estados.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Variantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tamaños</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Plus className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button
                  loading={buttonLoading}
                  onClick={() => {
                    setButtonLoading(true);
                    setTimeout(() => setButtonLoading(false), 2000);
                  }}
                >
                  {buttonLoading ? 'Loading...' : 'Click to Load'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Con Iconos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button>
                  <Plus className="w-4 h-4" />
                  Crear Sede
                </Button>
                <Button variant="outline">
                  <Building2 className="w-4 h-4" />
                  Ver Sedes
                </Button>
                <Button variant="secondary">
                  Guardar
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 3. Badges */}
        <section id="badges" className="space-y-6">
          <div>
            <h2 className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)] mb-2">
              3. Badges
            </h2>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              Indicadores visuales para estados, categorías y niveles de riesgo.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Variantes Básicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success">Success</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="secondary">Secondary</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Niveles de Riesgo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="risk-critico">Crítico</Badge>
                <Badge variant="risk-alto">Alto</Badge>
                <Badge variant="risk-medio">Medio</Badge>
                <Badge variant="risk-bajo">Bajo</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estados de Permisos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="status-vigente">Vigente</Badge>
                <Badge variant="status-por-vencer">Por Vencer</Badge>
                <Badge variant="status-vencido">Vencido</Badge>
                <Badge variant="status-en-tramite">En Trámite</Badge>
                <Badge variant="status-no-registrado">No Registrado</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Con Dot Indicator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant="risk-critico" dot>Crítico</Badge>
                <Badge variant="risk-alto" dot>Alto</Badge>
                <Badge variant="risk-medio" dot>Medio</Badge>
                <Badge variant="risk-bajo" dot>Bajo</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tamaños</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="info" size="sm">Small</Badge>
                <Badge variant="info" size="default">Default</Badge>
                <Badge variant="info" size="lg">Large</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>10 Propuestas de UX para Badge de Sector (Restaurante)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <p className="text-[var(--ds-font-size-100)] text-[var(--ds-text-subtle)]">
                Alternativas de diseño e interactividad (micro-animaciones SVG, efectos hover y estados dinámicos) para sustituir el badge estático de sector comercial en el Dashboard.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Opción 1: Steaming Cloche */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 1: The Steaming Cloche</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">01</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">La Parrilla del Sol</span>
                    <div className="group inline-flex items-center gap-2 bg-[var(--ds-blue-50)] hover:bg-[#e1e7f5] hover:border-[var(--ds-blue-500)] text-[var(--ds-blue-600)] px-3 py-1.5 rounded-full text-xs font-bold border border-transparent transition-all duration-200 cursor-pointer">
                      <div className="relative w-[18px] h-[18px]">
                        <svg viewBox="0 0 24 24" className="w-full h-full fill-none stroke-current stroke-[2.2]">
                          {/* Steam Trails */}
                          <path className="hidden group-hover:block animate-steam-rise" d="M10 5 C10 3, 11 2, 10.5 1" />
                          <path className="hidden group-hover:block animate-steam-rise [animation-delay:0.2s]" d="M12 5 C12 3, 13 2, 12.5 1" />
                          <path className="hidden group-hover:block animate-steam-rise [animation-delay:0.4s]" d="M14 5 C14 3, 15 2, 14.5 1" />
                          {/* Cloche dome */}
                          <path className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-3 origin-bottom" d="M4 16 A8 8 0 0 1 20 16 Z M12 8 a 1 1 0 1 1 0-2" />
                          {/* Tray Base */}
                          <path d="M2 17h20v2H2z" />
                        </svg>
                      </div>
                      <span>Restaurante</span>
                    </div>
                  </div>
                </div>

                {/* Opción 2: Pulse Halo */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 2: Halo de Control Activo</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">02</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">Gourmet Andino</span>
                    <div className="inline-flex items-center gap-2 bg-white border border-[var(--ds-blue-100)] text-[var(--ds-blue-600)] px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      <div className="relative w-4 h-4 flex items-center justify-center">
                        <div className="absolute w-full h-full border-2 border-[var(--ds-blue-500)] rounded-full animate-pulse-out"></div>
                        <div className="absolute w-full h-full border-2 border-[var(--ds-blue-500)] rounded-full animate-pulse-out [animation-delay:0.6s]"></div>
                        <div className="w-2 h-2 bg-[var(--ds-blue-500)] rounded-full z-10"></div>
                      </div>
                      <span>Restaurante</span>
                    </div>
                  </div>
                </div>

                {/* Opción 3: Golden Shield of Trust */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 3: Escudo de Confianza</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">03</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">Corporación Gastronómica</span>
                    <div className="group relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-br from-[#091e42] to-[#1d2b4a] text-[#ffd700] px-4 py-1.5 rounded-md text-xs font-bold border border-[#ffd700] shadow-md cursor-pointer">
                      {/* Shimmer line */}
                      <div className="absolute top-[-50%] left-[-60%] w-[20%] h-[200%] bg-white/15 rotate-[30deg] transition-all duration-700 group-hover:left-[140%]"></div>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-[#ffd700] stroke-[2] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M9 11l2 2 4-4"/>
                      </svg>
                      <span>Restaurante Premium</span>
                    </div>
                  </div>
                </div>

                {/* Opción 4: Sector-Status Slider */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 4: Slider Expandible</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">04</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">Sushi Green</span>
                    <div className="group inline-flex items-center bg-[var(--ds-neutral-100)] border border-[var(--ds-neutral-200)] text-[var(--ds-neutral-800)] rounded-full text-xs font-bold overflow-hidden transition-all duration-300 hover:border-[var(--ds-blue-500)] cursor-pointer">
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1.5">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-[var(--ds-blue-500)] stroke-[2]">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5 M2 12l10 5 10-5"/>
                        </svg>
                        <span>Restaurante</span>
                      </div>
                      <div className="max-w-0 opacity-0 whitespace-nowrap transition-all duration-300 group-hover:max-w-[180px] group-hover:opacity-100 group-hover:px-3 group-hover:py-1.5 text-[10px] text-[var(--ds-neutral-600)]">
                        · Matriz ARCSA Activa
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opción 5: Radar Sweep */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 5: Radar de Cumplimiento</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">05</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">Café del Parque</span>
                    <div className="inline-flex items-center gap-2 bg-[#e6f7ed] border border-[var(--ds-green-500)] text-[var(--ds-green-600)] px-3 py-1.5 rounded-full text-xs font-bold">
                      <div className="w-[18px] h-[18px] relative">
                        <svg viewBox="0 0 18 18" className="w-full h-full fill-none stroke-current stroke-[1.5]">
                          <circle cx="9" cy="9" r="8" strokeDasharray="2 2" />
                          <circle cx="9" cy="9" r="4" />
                          <circle cx="9" cy="9" r="1" fill="currentColor" />
                          <line className="animate-radar-spin origin-[9px_9px]" x1="9" y1="9" x2="9" y2="1" />
                        </svg>
                      </div>
                      <span>Establecimiento Seguro</span>
                    </div>
                  </div>
                </div>

                {/* Opción 6: Glassmorphism Aura */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 6: Glassmorphic Aura (Dark Mode Mock)</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">06</span>
                  </div>
                  <div className="bg-[#091e42] border border-transparent rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">Taberna Celta</span>
                    <div className="group relative inline-block">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--ds-blue-300)] to-[var(--ds-orange-300)] rounded-full blur-sm opacity-50 group-hover:opacity-95 group-hover:scale-105 transition duration-300 animate-aura-shift"></div>
                      <div className="relative inline-flex items-center gap-2 bg-white/70 backdrop-blur-md text-[var(--ds-blue-500)] px-4 py-1.5 rounded-full text-xs font-bold border border-[var(--ds-blue-500)]/15">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2]">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        <span>Bar & Food</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opción 7: Crossing Utensils */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 7: Tenedor y Cuchillo Interactivos</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">07</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">Pizzería DaVinci</span>
                    <div className="group inline-flex items-center gap-2 bg-white hover:bg-[var(--ds-orange-50)] hover:border-[var(--ds-orange-500)] hover:text-[var(--ds-orange-600)] text-[var(--ds-neutral-800)] px-3 py-1.5 rounded-md text-xs font-bold border-2 border-[var(--ds-neutral-200)] transition-all duration-200 cursor-pointer">
                      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-[2.2]">
                        {/* Fork */}
                        <g className="transition-transform duration-300 group-hover:rotate-[20deg] group-hover:translate-x-[1px] origin-bottom">
                          <path d="M6 3v8a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V3M9 3v4M6 6h6M9 14v7" />
                        </g>
                        {/* Knife */}
                        <g className="transition-transform duration-300 group-hover:rotate-[-20deg] group-hover:translate-x-[-1px] origin-bottom">
                          <path d="M17 3v11 M14 21h6v-2h-3v-5c0-3.5-3-4-3-4V3" />
                        </g>
                      </svg>
                      <span>Restaurante</span>
                    </div>
                  </div>
                </div>

                {/* Opción 8: Circular Orbit Hat */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 8: Chef Hat con Órbita</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">08</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">La Espiga</span>
                    <div className="inline-flex items-center gap-2 bg-[var(--ds-blue-50)] border border-[var(--ds-blue-100)] text-[var(--ds-blue-600)] px-3 py-1.5 rounded-full text-xs font-bold">
                      <div className="w-5 h-5 relative flex items-center justify-center">
                        <div className="w-[18px] h-[18px] border border-[var(--ds-blue-500)]/40 rounded-full absolute"></div>
                        <div className="w-1 h-1 bg-[var(--ds-orange-500)] rounded-full absolute top-0 left-2 origin-[2px_10px] animate-orbit-spin"></div>
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current stroke-none">
                          <path d="M12 3c-3 0-5.5 2-5.9 4.8C5 8 4 9.5 4 11.2 4 13.3 5.7 15 7.8 15h8.4c2.1 0 3.8-1.7 3.8-3.8 0-1.7-1-3.2-2.1-3.4C17.5 5 15 3 12 3zm-5 13h10v2H7z"/>
                        </svg>
                      </div>
                      <span>Restaurante & Panadería</span>
                    </div>
                  </div>
                </div>

                {/* Opción 9: Interactive Tooltip */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 9: Badge con Tooltip Informativo</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">09</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">Resto-Bar El Faro</span>
                    <div className="group relative inline-block">
                      <div className="inline-flex items-center gap-1.5 bg-[var(--ds-neutral-50)] border-2 border-[var(--ds-neutral-200)] text-[var(--ds-neutral-800)] px-3 py-1.5 rounded-md text-xs font-bold cursor-help">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2]">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span>Restaurante</span>
                      </div>
                      
                      {/* Tooltip Card */}
                      <div className="absolute bottom-[130%] left-1/2 -translate-x-1/2 translate-y-2 w-[240px] bg-[var(--ds-neutral-800)] text-white text-[10px] rounded-lg p-3 shadow-lg opacity-0 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 z-50">
                        <div className="font-extrabold text-xs mb-1.5 pb-1 border-b border-white/15 text-[var(--ds-orange-500)]">Requisitos del Sector</div>
                        <div className="flex justify-between mb-1"><span>ARCSA Sanitario:</span> <span className="font-bold">Obligatorio</span></div>
                        <div className="flex justify-between mb-1"><span>Bomberos (Riesgo B):</span> <span className="font-bold">Obligatorio</span></div>
                        <div className="flex justify-between"><span>LUAE (Categoría II):</span> <span className="font-bold">Aplicable</span></div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[var(--ds-neutral-800)]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opción 10: Rotating Gear */}
                <div className="border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[var(--ds-text-accent)] uppercase">
                    <span>Opción 10: The Rotating Gear</span>
                    <span className="bg-[var(--ds-blue-50)] text-[var(--ds-text-brand)] px-2 py-0.5 rounded-full text-[10px]">10</span>
                  </div>
                  <div className="bg-white border border-[var(--ds-border)] rounded-[var(--ds-radius-200)] p-4 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--ds-text)]">Wok Express</span>
                    <div className="group inline-flex items-center gap-2 bg-[var(--ds-blue-500)] hover:bg-[var(--ds-blue-600)] text-white px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-colors duration-200">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[2.2] animate-gear-spin-slow group-hover:[animation-duration:2s]">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      <span>Restaurante & FastFood</span>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </section>

        {/* 4. Cards */}
        <section id="cards" className="space-y-6">
          <div>
            <h2 className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)] mb-2">
              4. Cards
            </h2>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              Contenedores para agrupar información relacionada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Básico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                  Card estándar sin interactividad. Sombra sutil, bordes redondeados, padding consistente.
                </p>
              </CardContent>
            </Card>

            <Card interactive>
              <CardHeader>
                <CardTitle>Card Interactivo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                  Con prop <code>interactive</code>. Hover eleva la card, cursor pointer, focus-visible para keyboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5. Skeleton */}
        <section id="skeleton" className="space-y-6">
          <div>
            <h2 className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)] mb-2">
              5. Skeleton Loading
            </h2>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              Estados de carga con animación shimmer.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Variantes de Skeleton</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-[var(--color-text-muted)]">Default (rectangular)</p>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[var(--color-text-muted)]">Circular</p>
                <Skeleton variant="circular" className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-[var(--color-text-muted)]">Text lines</p>
                <Skeleton variant="text" className="w-full" />
                <Skeleton variant="text" className="w-5/6" />
                <Skeleton variant="text" className="w-4/6" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SkeletonCard (Compuesto)</CardTitle>
            </CardHeader>
            <CardContent>
              <SkeletonCard lines={3} />
            </CardContent>
          </Card>
        </section>

        {/* 6. Sede Card (Rediseñado) */}
        <section id="sede-card" className="space-y-6">
          <div>
            <h2 className="text-[var(--font-size-2xl)] font-bold text-[var(--color-text)] mb-2">
              6. Sede Card (Rediseñado)
            </h2>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              Card compacto para sedes con layout optimizado.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Example 1: Good status */}
            <Card interactive className="group">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)] transition-colors duration-200">
                      <Building2 className="w-5 h-5 text-[var(--color-primary)] group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[var(--font-size-base)] font-semibold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors duration-200">
                        Sede Central
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
                        <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] truncate">
                          Calle 72 #10-34, Bogotá
                        </p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] shrink-0 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all duration-200 mt-0.5" />
                </div>

                {/* Status + Risk inline */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="success" size="sm">Operando</Badge>
                  <span className="text-[var(--color-text-muted)]">|</span>
                  <Badge variant="risk-bajo" size="sm" dot>Riesgo Bajo</Badge>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[var(--font-size-xs)]">
                    <span className="font-medium text-[var(--color-text-secondary)]">Permisos</span>
                    <span className="font-semibold text-[var(--color-text)] tabular-nums">8/8</span>
                  </div>
                  <div className="h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-success)] rounded-full transition-all duration-500 ease-[var(--ease-smooth)]"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Example 2: Warning status */}
            <Card interactive className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)] transition-colors duration-200">
                      <Building2 className="w-5 h-5 text-[var(--color-primary)] group-hover:text-white transition-colors duration-200" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[var(--font-size-base)] font-semibold text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors duration-200">
                        Sucursal Norte
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
                        <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] truncate">
                          Av. 19 #150-40, Bogotá
                        </p>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] shrink-0 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all duration-200 mt-0.5" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="success" size="sm">Operando</Badge>
                  <span className="text-[var(--color-text-muted)]">|</span>
                  <Badge variant="risk-medio" size="sm" dot>Riesgo Medio</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[var(--font-size-xs)]">
                    <span className="font-medium text-[var(--color-text-secondary)]">Permisos</span>
                    <span className="font-semibold text-[var(--color-text)] tabular-nums">5/8</span>
                  </div>
                  <div className="h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-warning)] rounded-full transition-all duration-500 ease-[var(--ease-smooth)]"
                      style={{ width: '62.5%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[var(--color-info-bg)] border-[var(--color-info-border)]">
            <CardContent className="p-4">
              <p className="text-[var(--font-size-sm)] text-[var(--color-info)]">
                <strong>Cambios del rediseño:</strong> Estado y Riesgo en la misma línea (separador vertical),
                dirección compacta, progress bar más delgado (h-2), hover effects consistentes.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-[var(--color-border)] text-center space-y-4">
          <p className="text-[var(--color-text-secondary)] text-[var(--font-size-sm)]">
            Revisa cada componente y verifica consistencia visual, accesibilidad y estados interactivos.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="outline">
              Necesita Cambios
            </Button>
            <Button size="lg">
              <CheckCircle2 className="w-4 h-4" />
              Aprobar Sistema
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
