import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import {
  Building2, MapPin, ChevronRight, AlertTriangle,
  CheckCircle2, Clock, XCircle, Plus, Loader2
} from 'lucide-react';

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
