
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Movements from './pages/Movements';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import PurchaseOrder from './pages/PurchaseOrder';
import Settings from './pages/Settings';
import { Plate, TransactionLog, ViewState, PlateStatus } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [plates, setPlates] = useState<Plate[]>([]);
  const [logs, setLogs] = useState<TransactionLog[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const storedPlates = localStorage.getItem('sgp_plates');
    const storedLogs = localStorage.getItem('sgp_logs');
    if (storedPlates) setPlates(JSON.parse(storedPlates));
    if (storedLogs) setLogs(JSON.parse(storedLogs));
  }, []);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('sgp_plates', JSON.stringify(plates));
    localStorage.setItem('sgp_logs', JSON.stringify(logs));
  }, [plates, logs]);

  const handleAddPlates = (newPlates: Plate[], log: TransactionLog) => {
    setPlates(prev => [...prev, ...newPlates]);
    setLogs(prev => [log, ...prev]);
  };

  const handleDistributePlates = (numbers: number[], destination: string, log: TransactionLog) => {
    setPlates(prev => prev.map(p => {
      if (numbers.includes(p.number)) {
        return {
          ...p,
          status: PlateStatus.DISTRIBUTED,
          destination,
          dateOut: new Date().toISOString()
        };
      }
      return p;
    }));
    setLogs(prev => [log, ...prev]);
  };

  const handleReturnPlates = (numbers: number[], log: TransactionLog) => {
    setPlates(prev => prev.map(p => {
      if (numbers.includes(p.number)) {
        return {
          ...p,
          status: PlateStatus.RETURNED,
          destination: undefined,
          dateReturned: new Date().toISOString()
        };
      }
      return p;
    }));
    setLogs(prev => [log, ...prev]);
  };

  const handleUpdatePlate = (original: Plate, updated: Plate) => {
    setPlates(prev => prev.map(p => {
      if (p.number === original.number) {
        return updated;
      }
      return p;
    }));
  };

  // Import Data Handler
  const handleImportData = (importedPlates: Plate[], importedLogs: TransactionLog[]) => {
    setPlates(importedPlates);
    setLogs(importedLogs);
  };

  // Clear Data Handler
  const handleClearData = () => {
    setPlates([]);
    setLogs([]);
    localStorage.removeItem('sgp_plates');
    localStorage.removeItem('sgp_logs');
    // Note: We do NOT clear the password ('sgp_admin_password') here, 
    // so the user doesn't get locked out or have to reset it unnecessarily.
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 text-gray-900">
      <Sidebar currentView={currentView} setView={setCurrentView} plates={plates} />
      
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              {currentView === 'dashboard' && 'Visão Geral'}
              {currentView === 'movements' && 'Registro de Movimentações'}
              {currentView === 'inventory' && 'Controle de Estoque'}
              {currentView === 'reports' && 'Relatórios e Previsões'}
              {currentView === 'purchase' && 'Pedidos de Compra'}
              {currentView === 'settings' && 'Configurações e Dados'}
            </h2>
            <p className="text-gray-500">
              {currentView === 'dashboard' && 'Métricas e resumo do estoque atual.'}
              {currentView === 'movements' && 'Entrada de novas placas, distribuição ou devoluções de campo.'}
              {currentView === 'inventory' && 'Listagem completa, busca detalhada e faixas válidas.'}
              {currentView === 'reports' && 'Histórico de alocação, logs e estatísticas.'}
              {currentView === 'purchase' && 'Planejamento automático de reposição para 36 meses.'}
              {currentView === 'settings' && 'Gerenciamento de backups, segurança e banco de dados.'}
            </p>
          </div>

          <div className="animate-fade-in">
            {currentView === 'dashboard' && <Dashboard plates={plates} />}
            {currentView === 'movements' && (
              <Movements 
                plates={plates} 
                onAddPlates={handleAddPlates} 
                onDistributePlates={handleDistributePlates}
                onReturnPlates={handleReturnPlates}
              />
            )}
            {currentView === 'inventory' && (
              <Inventory 
                plates={plates} 
                onUpdatePlate={handleUpdatePlate}
              />
            )}
            {currentView === 'reports' && <Reports plates={plates} logs={logs} />}
            {currentView === 'purchase' && <PurchaseOrder plates={plates} />}
            {currentView === 'settings' && (
              <Settings 
                plates={plates} 
                logs={logs} 
                onImport={handleImportData} 
                onClear={handleClearData} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
