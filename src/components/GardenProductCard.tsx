import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Package, Eye, Download, Sparkles, Zap } from 'lucide-react';

interface GardenProductCardProps {
  product: {
    id: string;
    name: string;
    code: string;
    description?: string;
    category?: string;
    base_price: number;
    unit?: string;
    brand_name?: string;
    image_url?: string;
  };
  onViewDetails?: (product: any) => void;
  onDownload?: (product: any) => void;
}

export const GardenProductCard: React.FC<GardenProductCardProps> = ({
  product,
  onViewDetails,
  onDownload
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    console.log('🔍 GardenProductCard: Navigating to product details', { 
      productId: product.id,
      productName: product.name,
      currentPath: window.location.pathname,
      targetPath: `/garden/product/${product.id}`
    });
    navigate(`/garden/product/${product.id}`);
  };
  return (
    <Card className="group relative overflow-hidden bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 hover:scale-[1.02] hover:border-emerald-400/70">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Content */}
      <CardContent className="relative z-10 p-4">
        {/* Header with Product Name */}
        <div className="mb-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-700 transition-colors duration-300">
              {product.name}
            </h3>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                {product.category || 'Generale'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {product.code}
            </span>
          </div>
          
          {product.description && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
            <div className="flex items-center space-x-1 mb-1">
              <Zap className="w-3 h-3 text-emerald-500" />
              <span className="text-xs font-medium text-gray-700">Prezzo</span>
            </div>
            <p className="text-sm font-bold text-emerald-600">
              €{product.base_price?.toFixed(2) || '0.00'}
            </p>
          </div>
          
          <div className="bg-white/40 backdrop-blur-sm rounded-lg p-2 border border-white/50">
            <div className="flex items-center space-x-1 mb-1">
              <Package className="w-3 h-3 text-teal-500" />
              <span className="text-xs font-medium text-gray-700">Unità</span>
            </div>
            <p className="text-xs font-semibold text-gray-800">
              {product.unit || 'pz'}
            </p>
          </div>
        </div>

        {/* Brand Info */}
        {product.brand_name && (
          <div className="mb-3 p-2 bg-white/40 backdrop-blur-sm rounded-lg border border-white/50">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">B</span>
              </div>
              <span className="text-xs font-medium text-gray-800">
                {product.brand_name}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleViewDetails}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 h-8 text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            Dettagli
          </Button>
          
          <Button
            onClick={() => onDownload?.(product)}
            variant="outline"
            className="flex-1 bg-white/40 backdrop-blur-sm border-white/50 text-gray-800 hover:bg-white/50 hover:border-emerald-400/70 transition-all duration-300 h-8 text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
