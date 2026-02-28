const TOOL_ICONS: Record<string, string> = {
  list_products: '📋',
  get_balance: '💰',
  purchase: '🛒',
  order_history: '📜',
};

interface Props {
  name: string;
}

export function ToolBadge({ name }: Props) {
  const icon = TOOL_ICONS[name] ?? '🔧';
  const label = name.replace(/_/g, ' ');

  return (
    <span className="inline-flex items-center gap-1 text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full px-2 py-0.5 font-mono">
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
