import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={14} />
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm font-semibold border border-outline-variant rounded-lg pl-8 pr-2 py-1.5 bg-surface-container-low hover:bg-surface-container transition-colors focus:outline-none focus:ring-2 focus:ring-brand-link/20 w-40 h-9"
      />
    </div>
  );
}
