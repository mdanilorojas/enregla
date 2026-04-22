import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type TabType = 'colors' | 'typography' | 'buttons' | 'forms' | 'cards' | 'spacing';

export function DesignSystemView() {
  const [activeTab, setActiveTab] = useState<TabType>('colors');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'colors', label: 'Colores' },
    { id: 'typography', label: 'Tipografía' },
    { id: 'buttons', label: 'Botones' },
    { id: 'forms', label: 'Formularios' },
    { id: 'cards', label: 'Cards' },
    { id: 'spacing', label: 'Espaciado' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Diseño</h1>
        <p className="text-gray-500 mt-2">
          Componentes, estilos y tokens de diseño de EnRegla
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-900 text-blue-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-100 p-8">
        {activeTab === 'colors' && <ColorsSection onCopy={handleCopyColor} copiedColor={copiedColor} />}
        {activeTab === 'typography' && <TypographySection />}
        {activeTab === 'buttons' && <ButtonsSection />}
        {activeTab === 'forms' && <FormsSection />}
        {activeTab === 'cards' && <CardsSection />}
        {activeTab === 'spacing' && <SpacingSection />}
      </div>
    </div>
  );
}

interface ColorsSectionProps {
  onCopy: (color: string) => void;
  copiedColor: string | null;
}

function ColorsSection({ onCopy, copiedColor }: ColorsSectionProps) {
  const primaryColors = [
    { name: 'blue-50', hex: '#eff6ff', class: 'bg-blue-50' },
    { name: 'blue-100', hex: '#dbeafe', class: 'bg-blue-100' },
    { name: 'blue-200', hex: '#bfdbfe', class: 'bg-blue-200' },
    { name: 'blue-300', hex: '#93c5fd', class: 'bg-blue-300' },
    { name: 'blue-400', hex: '#60a5fa', class: 'bg-blue-400' },
    { name: 'blue-500', hex: '#3b82f6', class: 'bg-blue-500' },
    { name: 'blue-600', hex: '#2563eb', class: 'bg-blue-600' },
    { name: 'blue-700', hex: '#1d4ed8', class: 'bg-blue-700' },
    { name: 'blue-800', hex: '#1e40af', class: 'bg-blue-800' },
    { name: 'blue-900', hex: '#1e3a8a', class: 'bg-blue-900', primary: true },
    { name: 'blue-950', hex: '#172554', class: 'bg-blue-950' },
  ];

  const neutralColors = [
    { name: 'gray-50', hex: '#f9fafb', class: 'bg-gray-50' },
    { name: 'gray-100', hex: '#f3f4f6', class: 'bg-gray-100' },
    { name: 'gray-200', hex: '#e5e7eb', class: 'bg-gray-200' },
    { name: 'gray-300', hex: '#d1d5db', class: 'bg-gray-300' },
    { name: 'gray-400', hex: '#9ca3af', class: 'bg-gray-400' },
    { name: 'gray-500', hex: '#6b7280', class: 'bg-gray-500' },
    { name: 'gray-600', hex: '#4b5563', class: 'bg-gray-600' },
    { name: 'gray-700', hex: '#374151', class: 'bg-gray-700' },
    { name: 'gray-800', hex: '#1f2937', class: 'bg-gray-800' },
    { name: 'gray-900', hex: '#111827', class: 'bg-gray-900' },
  ];

  const semanticColors = [
    { name: 'Éxito', hex: '#10b981', class: 'bg-green-500' },
    { name: 'Advertencia', hex: '#f59e0b', class: 'bg-yellow-500' },
    { name: 'Error', hex: '#ef4444', class: 'bg-red-500' },
    { name: 'Info', hex: '#3b82f6', class: 'bg-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Primario</h3>
        <p className="text-sm text-gray-600 mb-6">
          Azul profundo (#1e3a8a / blue-900) - Color principal de marca
        </p>
        <div className="grid grid-cols-11 gap-3">
          {primaryColors.map((color) => (
            <div key={color.name} className="space-y-2">
              <button
                onClick={() => onCopy(color.hex)}
                className={`w-full h-20 rounded-lg ${color.class} transition-transform hover:scale-105 relative group ${
                  color.primary ? 'ring-2 ring-blue-900 ring-offset-2' : ''
                }`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedColor === color.hex ? (
                    <Check size={20} className="text-white drop-shadow" />
                  ) : (
                    <Copy size={20} className="text-white drop-shadow" />
                  )}
                </div>
              </button>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900">{color.name}</p>
                <p className="text-xs text-gray-500 font-mono">{color.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Colores Neutrales</h3>
        <div className="grid grid-cols-10 gap-3">
          {neutralColors.map((color) => (
            <div key={color.name} className="space-y-2">
              <button
                onClick={() => onCopy(color.hex)}
                className={`w-full h-20 rounded-lg ${color.class} border border-gray-100 transition-transform hover:scale-105 relative group`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedColor === color.hex ? (
                    <Check size={20} className="text-gray-600 drop-shadow" />
                  ) : (
                    <Copy size={20} className="text-gray-600 drop-shadow" />
                  )}
                </div>
              </button>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-900">{color.name}</p>
                <p className="text-xs text-gray-500 font-mono">{color.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Colores Semánticos</h3>
        <div className="grid grid-cols-4 gap-4">
          {semanticColors.map((color) => (
            <div key={color.name} className="space-y-2">
              <button
                onClick={() => onCopy(color.hex)}
                className={`w-full h-24 rounded-lg ${color.class} transition-transform hover:scale-105 relative group`}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {copiedColor === color.hex ? (
                    <Check size={24} className="text-white drop-shadow" />
                  ) : (
                    <Copy size={24} className="text-white drop-shadow" />
                  )}
                </div>
              </button>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{color.name}</p>
                <p className="text-xs text-gray-500 font-mono">{color.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TypographySection() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Escala Tipográfica</h3>
        <div className="space-y-6">
          <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
            <div className="w-32 text-sm text-gray-500 font-mono">text-xs</div>
            <p className="text-xs">El veloz murciélago hindú comía feliz cardillo y kiwi</p>
            <div className="ml-auto text-xs text-gray-400 font-mono">12px</div>
          </div>
          <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
            <div className="w-32 text-sm text-gray-500 font-mono">text-sm</div>
            <p className="text-sm">El veloz murciélago hindú comía feliz cardillo y kiwi</p>
            <div className="ml-auto text-xs text-gray-400 font-mono">14px</div>
          </div>
          <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
            <div className="w-32 text-sm text-gray-500 font-mono">text-base</div>
            <p className="text-base">El veloz murciélago hindú comía feliz cardillo y kiwi</p>
            <div className="ml-auto text-xs text-gray-400 font-mono">16px</div>
          </div>
          <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
            <div className="w-32 text-sm text-gray-500 font-mono">text-lg</div>
            <p className="text-lg">El veloz murciélago hindú comía feliz cardillo y kiwi</p>
            <div className="ml-auto text-xs text-gray-400 font-mono">18px</div>
          </div>
          <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
            <div className="w-32 text-sm text-gray-500 font-mono">text-xl</div>
            <p className="text-xl">El veloz murciélago hindú comía feliz cardillo y kiwi</p>
            <div className="ml-auto text-xs text-gray-400 font-mono">20px</div>
          </div>
          <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
            <div className="w-32 text-sm text-gray-500 font-mono">text-2xl</div>
            <p className="text-2xl">El veloz murciélago hindú comía feliz cardillo</p>
            <div className="ml-auto text-xs text-gray-400 font-mono">24px</div>
          </div>
          <div className="flex items-baseline gap-6 pb-4 border-b border-gray-100">
            <div className="w-32 text-sm text-gray-500 font-mono">text-3xl</div>
            <p className="text-3xl">El veloz murciélago hindú</p>
            <div className="ml-auto text-xs text-gray-400 font-mono">30px</div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pesos de Fuente</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="w-32 text-sm text-gray-500 font-mono">font-normal</div>
            <p className="font-normal text-lg">Texto regular (400)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-32 text-sm text-gray-500 font-mono">font-medium</div>
            <p className="font-medium text-lg">Texto medio (500)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-32 text-sm text-gray-500 font-mono">font-semibold</div>
            <p className="font-semibold text-lg">Texto semi-negrita (600)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-32 text-sm text-gray-500 font-mono">font-bold</div>
            <p className="font-bold text-lg">Texto negrita (700)</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Altura de Línea</h3>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">leading-tight (1.25)</p>
            <p className="leading-tight text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">leading-normal (1.5)</p>
            <p className="leading-normal text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">leading-relaxed (1.625)</p>
            <p className="leading-relaxed text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ButtonsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Variantes de Botones</h3>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Primario</p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
                Botón Primario
              </button>
              <button className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
                Botón Grande
              </button>
              <button className="px-3 py-1.5 text-sm bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
                Botón Pequeño
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Secundario</p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Botón Secundario
              </button>
              <button className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Botón Grande
              </button>
              <button className="px-3 py-1.5 text-sm bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                Botón Pequeño
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Outline</p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border-2 border-blue-900 text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Botón Outline
              </button>
              <button className="px-6 py-3 border-2 border-blue-900 text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Botón Grande
              </button>
              <button className="px-3 py-1.5 text-sm border-2 border-blue-900 text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Botón Pequeño
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Ghost</p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Botón Ghost
              </button>
              <button className="px-6 py-3 text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Botón Grande
              </button>
              <button className="px-3 py-1.5 text-sm text-blue-900 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                Botón Pequeño
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Destructivo</p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                Eliminar
              </button>
              <button className="px-4 py-2 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors font-medium">
                Eliminar Outline
              </button>
              <button className="px-4 py-2 text-red-500 rounded-lg hover:bg-red-50 transition-colors font-medium">
                Eliminar Ghost
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Estados</p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-blue-900 text-white rounded-lg font-medium">
                Normal
              </button>
              <button className="px-4 py-2 bg-blue-800 text-white rounded-lg font-medium">
                Hover
              </button>
              <button className="px-4 py-2 bg-blue-950 text-white rounded-lg font-medium">
                Active
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed" disabled>
                Deshabilitado
              </button>
              <button className="px-4 py-2 bg-blue-900 text-white rounded-lg font-medium flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Cargando
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormsSection() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inputs de Texto</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Label Normal
            </label>
            <input
              type="text"
              placeholder="Ingresa texto..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input con Ayuda
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Ingresa tu correo electrónico corporativo
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input con Error
            </label>
            <input
              type="text"
              placeholder="Campo requerido"
              className="w-full px-4 py-2 border-2 border-red-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="text-sm text-red-500 mt-1">
              Este campo es obligatorio
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input con Éxito
            </label>
            <input
              type="text"
              value="ejemplo@correo.com"
              readOnly
              className="w-full px-4 py-2 border-2 border-green-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-green-600 mt-1">
              ✓ Correo verificado correctamente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Deshabilitado
            </label>
            <input
              type="text"
              value="Campo deshabilitado"
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Textarea</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            rows={4}
            placeholder="Escribe una descripción..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona una opción
          </label>
          <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent">
            <option>Opción 1</option>
            <option>Opción 2</option>
            <option>Opción 3</option>
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Checkbox y Radio</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="check1"
              className="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-2 focus:ring-blue-900"
            />
            <label htmlFor="check1" className="text-sm text-gray-700">
              Acepto los términos y condiciones
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="radio1"
                name="radio-group"
                className="w-4 h-4 text-blue-900 border-gray-300 focus:ring-2 focus:ring-blue-900"
              />
              <label htmlFor="radio1" className="text-sm text-gray-700">
                Opción A
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="radio"
                id="radio2"
                name="radio-group"
                className="w-4 h-4 text-blue-900 border-gray-300 focus:ring-2 focus:ring-blue-900"
              />
              <label htmlFor="radio2" className="text-sm text-gray-700">
                Opción B
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardsSection() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Variantes de Cards</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Card Simple</h4>
            <p className="text-sm text-gray-600">
              Card básica con borde sutil y fondo blanco
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Card con Sombra</h4>
            <p className="text-sm text-gray-600">
              Card con sombra elevada para mayor énfasis
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 text-white">
            <h4 className="text-lg font-semibold mb-2">Card Destacada</h4>
            <p className="text-sm text-blue-50">
              Card con gradiente del color primario
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Card Neutral</h4>
            <p className="text-sm text-gray-600">
              Card con fondo gris claro para contenido secundario
            </p>
          </div>

          <div className="bg-white border-2 border-blue-900 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Card Seleccionada</h4>
            <p className="text-sm text-gray-600">
              Card con borde destacado para estado activo
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Card Interactiva</h4>
            <p className="text-sm text-gray-600">
              Card con hover effect para acciones
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cards con Contenido</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-blue-900 to-blue-700" />
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Card con Imagen</h4>
              <p className="text-sm text-gray-600 mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
              <button className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium">
                Ver más
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-900 flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">Card con Avatar</h4>
                <p className="text-sm text-gray-500">hace 2 horas</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpacingSection() {
  const spacingScale = [
    { name: '0', value: '0px', class: 'w-0' },
    { name: '0.5', value: '2px', class: 'w-0.5' },
    { name: '1', value: '4px', class: 'w-1' },
    { name: '1.5', value: '6px', class: 'w-1.5' },
    { name: '2', value: '8px', class: 'w-2' },
    { name: '3', value: '12px', class: 'w-3' },
    { name: '4', value: '16px', class: 'w-4' },
    { name: '5', value: '20px', class: 'w-5' },
    { name: '6', value: '24px', class: 'w-6' },
    { name: '8', value: '32px', class: 'w-8' },
    { name: '10', value: '40px', class: 'w-10' },
    { name: '12', value: '48px', class: 'w-12' },
    { name: '16', value: '64px', class: 'w-16' },
    { name: '20', value: '80px', class: 'w-20' },
    { name: '24', value: '96px', class: 'w-24' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Escala de Espaciado</h3>
        <p className="text-sm text-gray-600 mb-6">
          Sistema de espaciado basado en múltiplos de 4px
        </p>
        <div className="space-y-3">
          {spacingScale.map((space) => (
            <div key={space.name} className="flex items-center gap-6">
              <div className="w-16 text-sm text-gray-500 font-mono">{space.name}</div>
              <div className="flex-1 flex items-center gap-4">
                <div className={`${space.class} h-6 bg-blue-900 rounded`} />
                <div className="text-sm text-gray-600 font-mono">{space.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Border Radius</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">rounded-none</p>
            <div className="w-full h-20 bg-blue-900 rounded-none" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">rounded-sm</p>
            <div className="w-full h-20 bg-blue-900 rounded-sm" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">rounded</p>
            <div className="w-full h-20 bg-blue-900 rounded" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">rounded-lg</p>
            <div className="w-full h-20 bg-blue-900 rounded-lg" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">rounded-xl</p>
            <div className="w-full h-20 bg-blue-900 rounded-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">rounded-2xl</p>
            <div className="w-full h-20 bg-blue-900 rounded-2xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">rounded-3xl</p>
            <div className="w-full h-20 bg-blue-900 rounded-3xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">rounded-full</p>
            <div className="w-20 h-20 bg-blue-900 rounded-full" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sombras</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">shadow-sm</p>
            <div className="w-full h-20 bg-white rounded-lg shadow-sm border border-gray-100" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">shadow</p>
            <div className="w-full h-20 bg-white rounded-lg shadow" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">shadow-md</p>
            <div className="w-full h-20 bg-white rounded-lg shadow-md" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">shadow-lg</p>
            <div className="w-full h-20 bg-white rounded-lg shadow-lg" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">shadow-xl</p>
            <div className="w-full h-20 bg-white rounded-lg shadow-xl" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-mono mb-2">shadow-2xl</p>
            <div className="w-full h-20 bg-white rounded-lg shadow-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
