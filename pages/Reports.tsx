

import React, { useState } from 'react';
import { Plate, TransactionLog, PlateStatus, UsageConfig } from '../types';
import { EQUIPMENT_RULES } from '../constants';
import { formatNumber, calculateEffectiveUsage } from '../utils/plateUtils';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, FileText, History, Info } from 'lucide-react';

interface ReportsProps {
  plates: Plate[];
  logs: TransactionLog[];
  usageConfig: UsageConfig;
}

const Reports: React.FC<ReportsProps> = ({ plates, logs, usageConfig }) => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'history' | 'allocated'>('forecast');

  // Logic for Stock Forecast
  const forecastData = EQUIPMENT_RULES.map(rule => {
    const currentStock = plates.filter(
      p => p.equipmentName === rule.name && p.status === PlateStatus.IN_STOCK
    ).length;
    
    // Effective Usage Calculation (History vs Manual)
    const effectiveUsage = calculateEffectiveUsage(rule, logs, usageConfig);
    
    const monthlyUsage = effectiveUsage.value / 12;
    // Months coverage = Stock / Monthly
    const monthsCoverage = monthlyUsage > 0 ? (currentStock / monthlyUsage) : 999;
    
    return {
      name: rule.name,
      stock: currentStock,
      annualUsage: effectiveUsage.value,
      usageSource: effectiveUsage.source,
      monthsCoverage: monthsCoverage,
      isLow: monthsCoverage < 12
    };
  }).sort((a, b) => a.monthsCoverage - b.monthsCoverage);

  // Logic for Allocated Report
  const distributedPlates = plates.filter(p => p.status === PlateStatus.DISTRIBUTED);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-2">
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'forecast' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <TrendingUp size={18} />
          Previsão de Compra
        </button>
        <button
          onClick={() => setActiveTab('allocated')}
          className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'allocated' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <FileText size={18} />
          Relatório de Alocação
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'history' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <History size={18} />
          Histórico de Movimentações
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
        
        {/* FORECAST TAB */}
        {activeTab === 'forecast' && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
              <h3 className="font-bold text-blue-800 mb-1">Planejamento de Estoque</h3>
              <p className="text-sm text-blue-600">
                A cobertura é calculada com base na média de consumo anual (manual ou histórica).
                Itens com cobertura inferior a <strong>12 meses</strong> são destacados.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Equipamento</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Estoque</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Consumo Anual</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Fonte do Dado</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Cobertura (Meses)</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {forecastData.map((item) => (
                    <tr key={item.name} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{item.stock}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500">{item.annualUsage}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border 
                          ${item.usageSource === 'HISTORY' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : item.usageSource === 'MANUAL'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                          {item.usageSource === 'HISTORY' ? 'Histórico (3 anos)' : item.usageSource === 'MANUAL' ? 'Manual' : 'Padrão'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        {item.monthsCoverage > 120 ? '> 120' : item.monthsCoverage.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            <AlertTriangle size={12} />
                            Comprar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            <CheckCircle size={12} />
                            Adequado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ALLOCATED TAB */}
        {activeTab === 'allocated' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Placas Distribuídas</h3>
              <span className="text-sm text-gray-500">Total: {distributedPlates.length}</span>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Data Saída</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Número</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Equipamento</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {distributedPlates.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhuma placa alocada ainda.</td></tr>
                  ) : (
                    distributedPlates
                      .sort((a, b) => new Date(b.dateOut!).getTime() - new Date(a.dateOut!).getTime())
                      .map((p) => (
                      <tr key={p.number} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(p.dateOut!).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-blue-600">{formatNumber(p.number)}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{p.equipmentName}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                            {p.destination}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">Log de Movimentações</h3>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Data/Hora</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Equipamento</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Intervalo</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Qtd</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          {log.type === 'IN' ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-bold uppercase">
                              <TrendingDown size={14} className="rotate-180" /> Entrada
                            </span>
                          ) : log.type === 'OUT' ? (
                            <span className="flex items-center gap-1 text-orange-600 text-xs font-bold uppercase">
                              <TrendingUp size={14} /> Saída
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-purple-600 text-xs font-bold uppercase">
                              <History size={14} /> Devolução
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">{log.equipmentName}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {formatNumber(log.startNumber)} - {formatNumber(log.endNumber)}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-right">{log.count}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {log.type === 'OUT' ? `Destino: ${log.destination}` : log.type === 'RETURN' ? 'Quarentena iniciada' : 'Recebimento de lote'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;
