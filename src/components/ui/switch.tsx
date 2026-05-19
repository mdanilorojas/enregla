import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, disabled, label, className = '', ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-background-brand)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked
            ? 'bg-[var(--ds-status-vigente)]'
            : 'bg-[var(--ds-neutral-300)]'
        } ${className}`}
        {...rest}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';
