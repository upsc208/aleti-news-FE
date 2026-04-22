import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="max-w-2xl mx-auto mb-12 w-full relative">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search size={20} className="text-gray-400" />
      </div>
      <input 
        type="text"
        placeholder="찾으시는 소식의 제목이나 기자 이름을 검색해보세요"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 soft-shadow focus:outline-none focus:ring-2 focus:ring-aleti-red/20 focus:border-aleti-red transition-all font-medium placeholder:text-gray-400"
      />
    </div>
  );
}
