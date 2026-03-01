const TOOL_ICONS: Record<string, string> = {
  list_products: '📋',
  get_balance: '💰',
  purchase: '🛒',
  order_history: '📜',
};

const TOOL_COLORS: Record<string, string> = {
  list_products: 'bg-violet-600/20 text-violet-400 border-violet-600/30',
  get_balance: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
  purchase: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  order_history: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
};

interface Props {
  name: string;
}

export function ToolBadge({ name }: Props) {
  const icon = TOOL_ICONS[name] ?? '🔧';
  const colors = TOOL_COLORS[name] ?? 'bg-gray-700/20 text-gray-400 border-gray-600/30';
  const label = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 font-medium ${colors}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
