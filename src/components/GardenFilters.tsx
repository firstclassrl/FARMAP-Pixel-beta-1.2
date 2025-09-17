import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, Filter, Grid, List, Sparkles } from 'lucide-react';

interface GardenFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onFilterClick: () => void;
}

export const GardenFilters: React.FC<GardenFiltersProps> = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onFilterClick
}) => {
  return (
    <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-xl p-4 shadow-2xl">
      <div className="flex flex-col lg:flex-row gap-3 items-center">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="🔍 Cerca prodotti, codici, categorie..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-3 h-10 bg-white/40 backdrop-blur-sm border-white/50 text-gray-800 placeholder:text-gray-600 focus:border-emerald-400/70 focus:ring-emerald-400/30 rounded-lg text-sm"
          />
        </div>

        {/* Filter Button */}
        <Button
          onClick={onFilterClick}
          variant="outline"
          className="h-10 px-4 bg-white/40 backdrop-blur-sm border-white/50 text-gray-800 hover:bg-white/50 hover:border-emerald-400/70 transition-all duration-300 text-sm"
        >
          <Filter className="w-4 h-4 mr-1" />
          Filtri
        </Button>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-white/40 backdrop-blur-sm rounded-lg p-1 border border-white/50">
          <Button
            onClick={() => onViewModeChange('grid')}
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className={`h-7 px-2 ${
              viewMode === 'grid'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Grid className="w-3 h-3" />
          </Button>
          
          <Button
            onClick={() => onViewModeChange('list')}
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`h-7 px-2 ${
              viewMode === 'list'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <List className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mt-3 flex items-center space-x-2 text-xs text-gray-600">
          <Sparkles className="w-3 h-3 text-emerald-500" />
          <span>Ricerca attiva per: <span className="font-semibold text-emerald-600">"{searchTerm}"</span></span>
        </div>
      )}
    </div>
  );
};
