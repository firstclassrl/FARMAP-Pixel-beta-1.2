import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Eye, User, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
    photo_url?: string;
    customer_id?: string;
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
  const [customerName, setCustomerName] = useState<string>('');

  // Fetch customer name if customer_id exists
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (product.customer_id) {
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('company_name')
            .eq('id', product.customer_id)
            .single();
          
          if (error) {
            console.error('Error fetching customer:', error);
          } else {
            setCustomerName(data?.company_name || '');
          }
        } catch (error) {
          console.error('Error fetching customer:', error);
        }
      }
    };

    fetchCustomerName();
  }, [product.customer_id]);

  const handleViewDetails = () => {
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
        {/* Product Name */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-700 transition-colors duration-300 text-center">
            {product.name}
          </h3>
        </div>

        {/* Product Code */}
        <div className="mb-4">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Hash className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-mono text-gray-700 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/50">
              {product.code}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        {customerName && (
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-medium text-gray-800 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/50">
                {customerName}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleViewDetails}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 h-10 text-sm font-medium"
          >
            <Eye className="w-4 h-4 mr-2" />
            Dettagli
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
