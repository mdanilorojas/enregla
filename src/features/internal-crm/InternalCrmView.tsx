import { useState } from 'react'
import { LeadsTable } from './LeadsTable'
import { PartnersTable } from './PartnersTable'

type Tab = 'leads' | 'partners'

export function InternalCrmView() {
  const [activeTab, setActiveTab] = useState<Tab>('leads')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ds-blue-500 mb-2">CRM Interno</h1>
        <p className="text-ds-neutral-600">
          Leads capturados desde la landing + partners (enablers) en pipeline.
        </p>
      </div>

      <div className="border-b border-ds-neutral-200 flex gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 font-semibold text-sm transition-colors ${
            activeTab === 'leads'
              ? 'text-ds-blue-500 border-b-2 border-ds-orange-500'
              : 'text-ds-neutral-600 hover:text-ds-blue-500'
          }`}
        >
          Leads
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 font-semibold text-sm transition-colors ${
            activeTab === 'partners'
              ? 'text-ds-blue-500 border-b-2 border-ds-orange-500'
              : 'text-ds-neutral-600 hover:text-ds-blue-500'
          }`}
        >
          Partners
        </button>
      </div>

      {activeTab === 'leads' ? <LeadsTable /> : <PartnersTable />}
    </div>
  )
}
