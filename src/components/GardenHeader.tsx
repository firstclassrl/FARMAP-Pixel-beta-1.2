import React from 'react';
import { Zap, Users, Package } from 'lucide-react';

interface GardenHeaderProps {
  userName?: string;
  userRole?: string;
  productCount: number;
}

export const GardenHeader: React.FC<GardenHeaderProps> = ({
  userName,
  userRole,
  productCount
}) => {
  return (
    <div className="relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 blur-3xl opacity-50" />
      
      {/* Main Header */}
      <div className="relative z-10 text-center py-8">
        {/* Logos Stacked */}
        <div className="mb-6 space-y-3">
          {/* Farmap Logo */}
          <div>
            <img 
              src="/logo farmap industry.png" 
              alt="FARMAP Industry Logo" 
              className="h-12 mx-auto object-contain"
            />
          </div>
          {/* Garden Logo */}
          <div>
            <img 
              src="/Logo Garden Farmap.png" 
              alt="Garden Farmap Logo" 
              className="h-16 mx-auto object-contain"
            />
          </div>
        </div>

        {/* User Info Card */}
        <div className="inline-flex items-center space-x-3 bg-white/30 backdrop-blur-xl border border-white/40 rounded-xl px-4 py-3 shadow-2xl">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-medium text-gray-300">
              Benvenuto, <span className="font-bold text-emerald-400">{userName || 'Utente'}</span>
            </span>
          </div>
          
          <div className="w-px h-4 bg-gray-500" />
          
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-medium text-gray-300">
              Ruolo: <span className="font-bold text-teal-400 capitalize">{userRole || 'Utente'}</span>
            </span>
          </div>
          
          <div className="w-px h-4 bg-gray-500" />
          
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-gray-300">
              <span className="font-bold text-cyan-400">{productCount}</span> prodotti
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
