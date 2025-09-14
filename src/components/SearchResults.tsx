import React from 'react';
import { SearchResult } from '../hooks/useSmartSearch';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Loader2, Search, X } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResult[];
  isSearching: boolean;
  onResultClick: (result: SearchResult) => void;
  onClear: () => void;
  searchTerm: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isSearching,
  onResultClick,
  onClear,
  searchTerm
}) => {
  if (!searchTerm) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2">
      <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50/50">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {isSearching ? 'Ricerca in corso...' : `Risultati per "${searchTerm}"`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              className="h-6 w-6"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Loading */}
          {isSearching && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Ricerca intelligente...</span>
            </div>
          )}

          {/* Results */}
          {!isSearching && (
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Nessun risultato trovato</p>
                  <p className="text-xs mt-1">Prova con termini diversi</p>
                </div>
              ) : (
                <div className="divide-y">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => onResultClick(result)}
                      className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">{result.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900 truncate">
                              {result.title}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              result.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                              result.type === 'product' ? 'bg-green-100 text-green-800' :
                              result.type === 'order' ? 'bg-orange-100 text-orange-800' :
                              result.type === 'price_list' ? 'bg-purple-100 text-purple-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {result.type === 'customer' ? 'Cliente' :
                               result.type === 'product' ? 'Prodotto' :
                               result.type === 'order' ? 'Ordine' :
                               result.type === 'price_list' ? 'Listino' :
                               'Campionatura'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {result.subtitle}
                          </p>
                          {result.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {result.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          {results.length > 0 && !isSearching && (
            <div className="p-3 border-t bg-gray-50/50">
              <p className="text-xs text-gray-500 text-center">
                {results.length} risultato{results.length > 1 ? 'i' : ''} trovato{results.length > 1 ? 'i' : ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
