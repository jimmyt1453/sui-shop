import type { Toast as ToastType } from '../hooks/useToast';

interface Props {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const STYLES = {
  success: 'bg-emerald-950/90 border-emerald-600/40 text-emerald-300',
  error: 'bg-red-950/90 border-red-600/40 text-red-300',
  info: 'bg-slate-800/90 border-slate-600/40 text-slate-200',
};

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const ICON_STYLES = {
  success: 'bg-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
};

export function ToastStack({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 border rounded-xl px-4 py-3 backdrop-blur-md shadow-xl pointer-events-auto max-w-sm animate-in slide-in-from-right-4 duration-300 ${STYLES[toast.type]}`}
        >
          <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${ICON_STYLES[toast.type]}`}>
            {ICONS[toast.type]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.message && (
              <p className="text-xs opacity-70 mt-0.5 leading-snug">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => onRemove(toast.id)}
            className="shrink-0 text-current opacity-40 hover:opacity-70 transition-opacity cursor-pointer ml-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
