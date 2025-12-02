
import React from 'react';
import { ShoppingCart, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Plate, PlateStatus } from '../types';
import { EQUIPMENT_RULES } from '../constants';
import { formatNumber, getNextAvailableNumber, findEquipmentByNumber } from '../utils/plateUtils';

interface PurchaseOrderProps {
  plates: Plate[];
}

const PurchaseOrder: React.FC<PurchaseOrderProps> = ({ plates }) => {
  
  const purchaseSuggestions = EQUIPMENT_RULES.map(rule => {
    const currentStock = plates.filter(
      p => p.equipmentName === rule.name && p.status === PlateStatus.IN_STOCK
    ).length;
    
    const monthlyUsage = rule.estAnnualUsage / 12;
    const currentCoverage = monthlyUsage > 0 ? (currentStock / monthlyUsage) : 999;
    
    // Logic: If coverage < 24 months, we need to buy enough to reach 36 months
    const needsPurchase = currentCoverage < 24;
    const targetStock = Math.ceil(monthlyUsage * 36);
    const quantityToBuy = Math.max(0, targetStock - currentStock);
    
    let nextStart = null;
    let nextEnd = null;
    let note = null;

    if (needsPurchase && quantityToBuy > 0) {
      nextStart = getNextAvailableNumber(rule.name, plates);
      if (nextStart !== null) {
        nextEnd = nextStart + quantityToBuy - 1;
        
        // Check if nextEnd exceeds valid ranges
        const startEq = findEquipmentByNumber(nextStart);
        const endEq = findEquipmentByNumber(nextEnd);
        
        // If the calculated end number falls into a different equipment type or invalid range
        if (!endEq || startEq?.id !== endEq.id) {
           note = "Atenção: A quantidade solicitada excede a faixa atual. Verifique as faixas disponíveis.";
        }
      } else {
        note = "Não há faixas numéricas disponíveis definidas.";
      }
    }

    return {
      ...rule,
      currentStock,
      monthlyUsage,
      currentCoverage,
      needsPurchase,
      quantityToBuy,
      nextStart,
      nextEnd,
      note
    };
  }).sort((a, b) => (a.needsPurchase === b.needsPurchase ? 0 : a.needsPurchase ? -1 : 1));

  const itemsToBuy = purchaseSuggestions.filter(i => i.needsPurchase);
  const itemsOk = purchaseSuggestions.filter(i => !i.needsPurchase);

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <ShoppingCart size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Assistente de Compras</h2>
            <p className="text-blue-100 mt-1">
              Gera sugestões de compra para atingir 36 meses de cobertura de estoque.
            </p>
          </div>
        </div>
        <div className="flex gap-6 mt-6">
           <div className="bg-white/10 px-4 py-2 rounded-lg">
             <span className="block text-2xl font-bold">{itemsToBuy.length}</span>
             <span className="text-xs text-blue-200 uppercase tracking-wide">Itens para Comprar</span>
           </div>
           <div className="bg-white/10 px-4 py-2 rounded-lg">
             <span className="block text-2xl font-bold">{itemsOk.length}</span>
             <span className="text-xs text-blue-200 uppercase tracking-wide">Estoque Adequado</span>
           </div>
        </div>
      </div>

      {/* Action Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="text-red-500" size={20} />
          Necessitam de Reposição (Cobertura &lt; 24 meses)
        </h3>
        
        {itemsToBuy.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
            <h4 className="text-lg font-bold text-green-800">Tudo Certo!</h4>
            <p className="text-green-600">Todos os equipamentos possuem estoque superior a 24 meses.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Equipamento</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Estoque Atual</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Cobertura</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center bg-blue-50 text-blue-800 border-l border-blue-100">Sugestão de Compra</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-blue-50 text-blue-800">Faixa Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itemsToBuy.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400 mt-1">Consumo Mensal Est.: {item.monthlyUsage.toFixed(1)}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-gray-600">
                        {item.currentStock}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                           {item.currentCoverage.toFixed(1)} meses
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center bg-blue-50/30 border-l border-blue-100">
                         <span className="text-lg font-bold text-blue-700">{item.quantityToBuy}</span>
                         <span className="text-xs text-blue-500 ml-1">unid.</span>
                      </td>
                      <td className="px-6 py-4">
                        {item.nextStart !== null && item.nextEnd !== null ? (
                          <div>
                            <div className="flex items-center gap-2 font-mono text-sm bg-white border border-gray-200 px-3 py-1 rounded-md shadow-sm">
                              <span className="text-blue-600 font-bold">{formatNumber(item.nextStart)}</span>
                              <ArrowRight size={14} className="text-gray-400" />
                              <span className="text-blue-600 font-bold">{formatNumber(item.nextEnd)}</span>
                            </div>
                            {item.note && (
                              <p className="text-xs text-orange-600 mt-1 max-w-xs">{item.note}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-red-500">Faixa indisponível</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* OK Table */}
      {itemsOk.length > 0 && (
         <div className="opacity-75">
          <button className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2 cursor-default">
            <CheckCircle className="text-green-500" size={16} />
            Estoque Saudável (Cobertura &ge; 24 meses)
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                     <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Equipamento</th>
                     <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase text-center">Estoque</th>
                     <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase text-center">Cobertura</th>
                     <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {itemsOk.map(item => (
                     <tr key={item.id} className="text-gray-500 hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm">{item.name}</td>
                        <td className="px-6 py-3 text-sm text-center">{item.currentStock}</td>
                        <td className="px-6 py-3 text-sm text-center">
                            {item.currentCoverage > 120 ? '> 10 anos' : `${item.currentCoverage.toFixed(1)} meses`}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">OK</span>
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
             </div>
          </div>
         </div>
      )}
    </div>
  );
};

export default PurchaseOrder;
