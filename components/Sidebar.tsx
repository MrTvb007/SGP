
import React from 'react';
import { LayoutDashboard, ArrowRightLeft, List, Box, FileBarChart, ShoppingCart, Settings } from 'lucide-react';
import { ViewState, Plate, PlateStatus } from '../types';
import { EQUIPMENT_RULES } from '../constants';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  plates: Plate[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, plates }) => {
  
  // Calculate alerts for Purchase Order (Coverage < 24 months)
  const purchaseAlerts = EQUIPMENT_RULES.reduce((count, rule) => {
    const stock = plates.filter(p => p.equipmentName === rule.name && p.status === PlateStatus.IN_STOCK).length;
    const monthlyUsage = rule.estAnnualUsage / 12;
    const coverage = monthlyUsage > 0 ? stock / monthlyUsage : 999;
    return coverage < 24 ? count + 1 : count;
  }, 0);

  const menuItems = [
    { id: 'dashboard' as ViewState, label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'movements' as ViewState, label: 'Movimentações', icon: ArrowRightLeft },
    { id: 'inventory' as ViewState, label: 'Estoque Total', icon: List },
    { id: 'reports' as ViewState, label: 'Relatórios', icon: FileBarChart },
    { 
      id: 'purchase' as ViewState, 
      label: 'Pedidos de Compra', 
      icon: ShoppingCart,
      badge: purchaseAlerts > 0 ? purchaseAlerts : undefined
    },
    { id: 'settings' as ViewState, label: 'Administração', icon: Settings },
  ];

  return (
    <div className="w-full md:w-64 bg-white md:h-screen shadow-md flex flex-col z-10">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        {/* CELESC Logo */}
        <div className="flex items-center gap-3">
           <img 
             src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Celesc_logo.svg/2560px-Celesc_logo.svg.png" 
             alt="Celesc" 
             className="h-10 w-auto object-contain"
             onError={(e) => {
               (e.target as HTMLImageElement).style.display = 'none';
               (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
             }}
           />
           <div className="hidden w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Box size={24} />
           </div>
           <div className="h-8 w-px bg-gray-300 mx-1"></div>
           <span className="text-xl font-bold text-gray-800 tracking-tight">SGP</span>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${currentView === item.id 
                ? 'bg-blue-50 text-blue-600' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} />
              {item.label}
            </div>
            {item.badge !== undefined && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Gestão de Placas</strong><br/>
            v1.5.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
