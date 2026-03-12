import { Leaf } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-4">
          <Leaf size={20} className="text-brand-500" />
          <span className="text-lg font-bold text-white">GreenLeaf</span>
        </div>
        <p className="text-sm">Licensed cannabis dispensary. Must be 21+ to purchase. Please consume responsibly.</p>
        <p className="text-xs mt-4">Powered by CannaSaas</p>
      </div>
    </footer>
  );
}
