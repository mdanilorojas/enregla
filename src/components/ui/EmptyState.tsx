interface EmptyStateProps {
  message: string;
  action?: string;
  onAction?: () => void;
}

export function EmptyState({ message, action, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <div className="w-4 h-0.5 bg-gray-300 rounded" />
      </div>
      <p className="text-sm text-gray-500">{message}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-sm text-gray-900 font-medium hover:underline underline-offset-2 transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}
