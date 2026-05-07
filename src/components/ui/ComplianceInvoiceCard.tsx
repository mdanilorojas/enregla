import { memo } from 'react';
import { DollarSign } from '@/lib/lucide-icons';

export interface InvoiceLine {
  label: string;
  detail?: string;
  amount: number;
}

export interface ComplianceInvoiceCardProps {
  lines: InvoiceLine[];
  total: number;
  currency?: string;
  warningAmount?: number;
  warningText?: React.ReactNode;
  footnote?: string;
}

function formatAmount(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/,/g, ' ');
}

function ComplianceInvoiceCardImpl({
  lines,
  total,
  currency = 'USD',
  warningAmount,
  warningText,
  footnote,
}: ComplianceInvoiceCardProps) {
  return (
    <div className="cic">
      <style>{CSS}</style>

      <div className="cic__accent" />

      <div className="cic__header">
        <div className="cic__title">
          <div className="cic__title-icon">
            <DollarSign size={15} strokeWidth={2.5} />
          </div>
          Lo que te falta pagar
        </div>
        <div className="cic__approx">aprox.</div>
      </div>

      <div className="cic__list">
        {lines.map((line, i) => (
          <div key={i} className="cic__line">
            <div className="cic__label">
              {line.label}
              {line.detail && <span className="cic__detail">· {line.detail}</span>}
            </div>
            <div className="cic__price">${formatAmount(line.amount)}</div>
          </div>
        ))}
      </div>

      <div className="cic__total">
        <div className="cic__total-label">Total pendiente</div>
        <div className="cic__total-amount">
          ${formatAmount(total)}<small> {currency}</small>
        </div>
      </div>

      {warningText && (
        <div className="cic__warning">
          {warningText}
          {warningAmount !== undefined && (
            <> <b>${formatAmount(warningAmount)}</b>.</>
          )}
        </div>
      )}

      {footnote && <div className="cic__footnote">{footnote}</div>}
    </div>
  );
}

export const ComplianceInvoiceCard = memo(ComplianceInvoiceCardImpl);

const CSS = `
.cic {
  background: white;
  border: 1px solid #dfe3e8;
  border-radius: 16px;
  padding: 28px;
  min-height: 340px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  overflow: hidden;
}
.cic__accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #16a34a, #15803d);
}
.cic__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.cic__title {
  font-size: 15px;
  font-weight: 600;
  color: #172b4d;
  display: flex;
  align-items: center;
  gap: 10px;
}
.cic__title-icon {
  width: 30px;
  height: 30px;
  background: #ecfdf5;
  color: #15803d;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cic__approx {
  font-size: 10px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 12px;
  background: #eef0f3;
  color: #5e6c84;
  font-style: italic;
  flex-shrink: 0;
}
.cic__list {
  display: flex;
  flex-direction: column;
}
.cic__line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13.5px;
  padding: 8px 0;
  border-bottom: 1px dotted #dfe3e8;
  color: #172b4d;
}
.cic__line:last-child { border-bottom: none; }
.cic__label {
  line-height: 1.3;
  min-width: 0;
}
.cic__detail {
  color: #5e6c84;
  font-size: 11px;
  font-style: italic;
  margin-left: 4px;
}
.cic__price {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  white-space: nowrap;
  margin-left: 12px;
  color: #172b4d;
}
.cic__total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 14px;
  border-top: 2px solid #dfe3e8;
}
.cic__total-label {
  font-size: 13px;
  font-weight: 500;
  color: #172b4d;
}
.cic__total-amount {
  font-size: 34px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.8px;
  line-height: 1;
  color: #166534;
  white-space: nowrap;
}
.cic__total-amount small {
  font-size: 14px;
  font-weight: 300;
  opacity: 0.6;
  margin-left: 3px;
  letter-spacing: 0;
  color: #5e6c84;
}
.cic__warning {
  font-size: 12.5px;
  line-height: 1.5;
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff4e6;
  border: 1px dashed rgba(194, 65, 12, 0.35);
  color: #7c2d12;
}
.cic__warning b {
  font-weight: 600;
  color: #c2410c;
  font-variant-numeric: tabular-nums;
}
.cic__footnote {
  font-size: 10.5px;
  color: #8993a4;
  font-style: italic;
  line-height: 1.4;
}
`;
