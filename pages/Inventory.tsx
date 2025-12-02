
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Info, X, Edit2, Save, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Plate, PlateStatus, Destination } from '../types';
import { EQUIPMENT_RULES, DESTINATIONS } from '../constants';
import { formatNumber } from '../utils/plateUtils';

interface InventoryProps {
  plates: Plate[];
  onUpdatePlate?: (original: Plate, updated: Plate) => void;
}

const Inventory: React.FC<InventoryProps> = ({ plates, onUpdatePlate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterDestination, setFilterDestination] = useState<string>('ALL');
  const [showRanges, setShowRanges] = useState(false);
  
  // Pagination State
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Edit State
  const [editingPlate, setEditingPlate] = useState<Plate | null>(null);
  const [editForm, setEditForm] = useState<Partial<Plate>>({});

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterDestination, itemsPerPage]);

  const filteredPlates = useMemo(() => {
    return plates.filter(plate => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        plate.number.toString().includes(term) || 
        plate.equipmentName.toLowerCase().includes(term) ||
        (plate.destination && plate.destination.toLowerCase().includes(term));
      
      const matchesStatus = filterStatus === 'ALL' || plate.status === filterStatus;
      
      const matchesDest = filterDestination === 'ALL' || 
        (filterStatus === PlateStatus.DISTRIBUTED && plate.destination === filterDestination);

      return matchesSearch && matchesStatus && matchesDest;
    }).sort((a, b) => b.number - a.number); // Newest numbers first
  }, [plates, searchTerm, filterStatus, filterDestination]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredPlates.length / itemsPerPage);
  const paginatedPlates = filteredPlates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const headers = ["Número", "Equipamento", "Status", "Destino", "Data Entrada", "Data Saída", "Data Devolução"];
    // Export ALL filtered plates, not just the page
    const csvContent = [
      headers.join(","),
      ...filteredPlates.map(p => [
        formatNumber(p.number),
        `"${p.equipmentName}"`,
        p.status,
        p.destination || "-",
        p.dateIn.split('T')[0],
        p.dateOut ? p.dateOut.split('T')[0] : "-",
        p.dateReturned ? p.dateReturned.split('T')[0] : "-"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "estoque_placas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEditing = (plate: Plate) => {
    setEditingPlate(plate);
    setEditForm({ ...plate });
  };

  const saveEdit = () => {
    if (editingPlate && onUpdatePlate && editForm.equipmentName) {
      const updatedPlate: Plate = {
        ...editingPlate,
        equipmentName: editForm.equipmentName,
        status: editForm.status as PlateStatus,
        destination: editForm.status === PlateStatus.DISTRIBUTED ? editForm.destination : undefined,
        // Logic adjustments if status changed manually
        dateOut: editForm.status === PlateStatus.IN_STOCK ? undefined : (editForm.dateOut || editingPlate.dateOut),
        dateReturned: editForm.status === PlateStatus.RETURNED ? (editForm.dateReturned || new Date().toISOString()) : undefined
      };
      
      onUpdatePlate(editingPlate, updatedPlate);
      setEditingPlate(null);
    }
  };

  const getReleaseDate = (returnDateStr: string) => {
    const returnDate = new Date(returnDateStr);
    const releaseDate = new Date(returnDate);
    releaseDate.setFullYear(releaseDate.getFullYear() + 2);
    return releaseDate.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 relative pb-12">
      {/* Edit Modal */}
      {editingPlate && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Editar Placa {formatNumber(editingPlate.number)}</h3>
              <button onClick={() => setEditingPlate(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Equipamento</label>
                <select 
                  value={editForm.equipmentName}
                  onChange={(e) => setEditForm({...editForm, equipmentName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {EQUIPMENT_RULES.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select 
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value as PlateStatus})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={PlateStatus.IN_STOCK}>{PlateStatus.IN_STOCK}</option>
                  <option value={PlateStatus.DISTRIBUTED}>{PlateStatus.DISTRIBUTED}</option>
                  <option value={PlateStatus.RETURNED}>{PlateStatus.RETURNED}</option>
                </select>
              </div>

              {editForm.status === PlateStatus.DISTRIBUTED && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Destino</label>
                  <select 
                    value={editForm.destination || DESTINATIONS[0]}
                    onChange={(e) => setEditForm({...editForm, destination: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {DESTINATIONS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setEditingPlate(null)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={saveEdit}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Range Info Modal */}
      {showRanges && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Faixas Numéricas Válidas</h3>
              <button onClick={() => setShowRanges(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
              {EQUIPMENT_RULES.map(rule => (
                <div key={rule.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">{rule.name}</h4>
                  <div className="flex flex-wrap gap-2">
                    {rule.ranges.map((r, idx) => (
                      <span key={idx} className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-blue-600">
                        {formatNumber(r.start)} - {formatNumber(r.end)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número, equipamento ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <button
             onClick={() => setShowRanges(true)}
             className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 transition-colors border border-blue-100"
          >
            <Info size={16} />
            Ver Faixas
          </button>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value={PlateStatus.IN_STOCK}>{PlateStatus.IN_STOCK}</option>
            <option value={PlateStatus.DISTRIBUTED}>{PlateStatus.DISTRIBUTED}</option>
            <option value={PlateStatus.RETURNED}>{PlateStatus.RETURNED}</option>
          </select>

          {filterStatus === PlateStatus.DISTRIBUTED && (
             <select 
             value={filterDestination}
             onChange={(e) => setFilterDestination(e.target.value)}
             className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
           >
             <option value="ALL">Todos os Destinos</option>
             {Object.values(Destination).map(d => (
               <option key={d} value={d}>{d}</option>
             ))}
           </select>
          )}

          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Número</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipamento</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destino / Info</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma placa encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedPlates.map((plate) => (
                  <tr key={plate.number} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-blue-600">
                      {formatNumber(plate.number)}
                    </td>
                    <td className="px-6 py-4 text-gray-700 text-sm">
                      {plate.equipmentName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${plate.status === PlateStatus.IN_STOCK 
                          ? 'bg-green-100 text-green-800' 
                          : plate.status === PlateStatus.DISTRIBUTED
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {plate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {plate.status === PlateStatus.RETURNED && plate.dateReturned ? (
                        <div className="flex items-center gap-1 text-purple-600 font-medium text-xs">
                          <AlertCircle size={12} />
                          Liberada em: {getReleaseDate(plate.dateReturned)}
                        </div>
                      ) : (
                        plate.destination || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                       {plate.status === PlateStatus.RETURNED && plate.dateReturned
                        ? `Dev: ${new Date(plate.dateReturned).toLocaleDateString('pt-BR')}`
                        : plate.status === PlateStatus.DISTRIBUTED 
                          ? new Date(plate.dateOut!).toLocaleDateString('pt-BR')
                          : new Date(plate.dateIn).toLocaleDateString('pt-BR')
                       }
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => startEditing(plate)}
                         className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                         title="Editar registro"
                       >
                         <Edit2 size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-xs text-gray-500">
              Mostrando {filteredPlates.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} até {Math.min(currentPage * itemsPerPage, filteredPlates.length)} de {filteredPlates.length} registros
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Itens por página:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={5000}>5000</option>
                <option value={10000}>10000</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(1)} 
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="text-xs font-medium text-gray-700 px-2 whitespace-nowrap">
              Página {currentPage} de {Math.max(1, totalPages)}
            </span>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)} 
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-100"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
