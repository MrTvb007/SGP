
import React, { useState, useEffect } from 'react';
import { ArrowDown, ArrowUp, RotateCcw, Layers, Hash, Save, AlertCircle, Info } from 'lucide-react';
import { DESTINATIONS, EQUIPMENT_RULES } from '../constants';
import { findEquipmentByNumber, formatNumber } from '../utils/plateUtils';
import { Plate, PlateStatus, TransactionLog, Destination } from '../types';

interface MovementsProps {
  plates: Plate[];
  onAddPlates: (newPlates: Plate[], log: TransactionLog) => void;
  onDistributePlates: (numbers: number[], destination: string, log: TransactionLog) => void;
  onReturnPlates: (numbers: number[], log: TransactionLog) => void;
}

type Mode = 'IN' | 'OUT' | 'RETURN';
type InputType = 'SINGLE' | 'RANGE';

const Movements: React.FC<MovementsProps> = ({ plates, onAddPlates, onDistributePlates, onReturnPlates }) => {
  const [mode, setMode] = useState<Mode>('IN');
  const [inputType, setInputType] = useState<InputType>('SINGLE');
  
  const [startNum, setStartNum] = useState<string>('');
  const [endNum, setEndNum] = useState<string>('');
  const [destination, setDestination] = useState<string>(DESTINATIONS[0]);
  
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset form on mode switch
  useEffect(() => {
    setStartNum('');
    setEndNum('');
    setError(null);
    setSuccessMsg(null);
    setSelectedEquipment('');
  }, [mode, inputType]);

  // Validation & Auto-Selection Logic
  useEffect(() => {
    const s = parseInt(startNum);
    const e = inputType === 'RANGE' ? parseInt(endNum) : s;

    if (isNaN(s)) return;

    // Auto-detect equipment based on range
    const eqStart = findEquipmentByNumber(s);
    if (eqStart) {
      // Only overwrite if empty or matches logic (simplified for UX: just update if found)
      setSelectedEquipment(eqStart.name);
    }

    // Range Validation
    if (inputType === 'RANGE' && !isNaN(e)) {
      if (e < s) {
        setError('Número final deve ser maior que o inicial.');
        return;
      }
      const eqEnd = findEquipmentByNumber(e);
      if (eqStart && eqEnd && eqStart.id !== eqEnd.id) {
         setError('Atenção: A faixa numérica parece abranger tipos diferentes de equipamentos.');
         return;
      }
    }

    setError(null);
  }, [startNum, endNum, inputType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const s = parseInt(startNum);
    const endVal = inputType === 'RANGE' && endNum ? parseInt(endNum) : s;

    if (isNaN(s)) return;
    if (!selectedEquipment) {
      setError("Por favor, selecione o tipo de equipamento.");
      return;
    }

    const numbersToProcess: number[] = [];
    for (let i = s; i <= endVal; i++) {
      numbersToProcess.push(i);
    }

    // --- IN MODE (New Stock) ---
    if (mode === 'IN') {
      const existing = plates.filter(p => numbersToProcess.includes(p.number));
      if (existing.length > 0) {
        setError(`Erro: ${existing.length} placas já existem no cadastro (ex: ${formatNumber(existing[0].number)}). Use a aba "Devolução" caso estejam retornando do campo.`);
        return;
      }

      const newPlates: Plate[] = numbersToProcess.map(num => ({
        number: num,
        equipmentName: selectedEquipment,
        status: PlateStatus.IN_STOCK,
        dateIn: new Date().toISOString(),
      }));

      const log: TransactionLog = {
        id: Date.now().toString(),
        type: 'IN',
        startNumber: s,
        endNumber: endVal,
        count: numbersToProcess.length,
        equipmentName: selectedEquipment,
        timestamp: new Date().toISOString()
      };

      onAddPlates(newPlates, log);
      setSuccessMsg(`${numbersToProcess.length} placas de "${selectedEquipment}" adicionadas com sucesso!`);
    } 
    // --- OUT MODE (Distribution) ---
    else if (mode === 'OUT') {
      // Check availability logic
      const missingOrDistributed = numbersToProcess.filter(num => {
         const p = plates.find(p => p.number === num);
         return !p || (p.status === PlateStatus.DISTRIBUTED); 
         // Note: RETURNED plates exist but need quarantine check, so we don't filter them out here yet
      });

      if (missingOrDistributed.length > 0) {
        setError(`Erro: Algumas placas não estão disponíveis (ex: ${formatNumber(missingOrDistributed[0])}). Verifique se já não foram distribuídas.`);
        return;
      }
      
      // Quarantine Check (2 Years)
      const quarantineViolations = [];
      for (const num of numbersToProcess) {
        const plate = plates.find(p => p.number === num);
        if (plate && plate.status === PlateStatus.RETURNED && plate.dateReturned) {
          const returnDate = new Date(plate.dateReturned);
          const releaseDate = new Date(returnDate);
          releaseDate.setFullYear(releaseDate.getFullYear() + 2);
          
          if (new Date() < releaseDate) {
            quarantineViolations.push({
              num,
              release: releaseDate.toLocaleDateString('pt-BR')
            });
          }
        }
      }

      if (quarantineViolations.length > 0) {
        setError(`Erro: Bloqueio de Quarentena. A placa ${formatNumber(quarantineViolations[0].num)} só pode ser reutilizada após ${quarantineViolations[0].release} (Norma de 2 anos).`);
        return;
      }

      const log: TransactionLog = {
        id: Date.now().toString(),
        type: 'OUT',
        startNumber: s,
        endNumber: endVal,
        count: numbersToProcess.length,
        equipmentName: selectedEquipment,
        destination: destination,
        timestamp: new Date().toISOString()
      };

      onDistributePlates(numbersToProcess, destination, log);
      setSuccessMsg(`${numbersToProcess.length} placas destinadas para "${destination}".`);
    }
    // --- RETURN MODE (From Field) ---
    else if (mode === 'RETURN') {
       // Check if they exist and are distributed
       const notFoundOrInStock = numbersToProcess.filter(num => {
          const p = plates.find(p => p.number === num);
          return !p || p.status === PlateStatus.IN_STOCK || p.status === PlateStatus.RETURNED;
       });

       if (notFoundOrInStock.length > 0) {
         setError(`Erro: Algumas placas não constam como "Distribuídas" (ex: ${formatNumber(notFoundOrInStock[0])}). Apenas placas em campo podem ser devolvidas.`);
         return;
       }

       const log: TransactionLog = {
        id: Date.now().toString(),
        type: 'RETURN',
        startNumber: s,
        endNumber: endVal,
        count: numbersToProcess.length,
        equipmentName: selectedEquipment,
        timestamp: new Date().toISOString()
       };

       onReturnPlates(numbersToProcess, log);
       setSuccessMsg(`${numbersToProcess.length} placas retornadas e colocadas em quarentena (2 anos).`);
    }

    setStartNum('');
    setEndNum('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('IN')}
            className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
              ${mode === 'IN' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <ArrowDown size={20} />
            Entrada (Novo)
          </button>
          <button
            onClick={() => setMode('OUT')}
            className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
              ${mode === 'OUT' ? 'bg-orange-50 text-orange-700 border-b-2 border-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Saída (Distribuição)
            <ArrowUp size={20} />
          </button>
          <button
            onClick={() => setMode('RETURN')}
            className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
              ${mode === 'RETURN' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <RotateCcw size={20} />
            Devolução (Campo)
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
             {/* Warning for RETURN mode */}
             {mode === 'RETURN' && (
              <div className="bg-purple-50 p-4 rounded-lg flex items-start gap-3 border border-purple-100">
                <AlertCircle className="shrink-0 mt-1 text-purple-600" size={18} />
                <p className="text-sm text-purple-800">
                  <strong>Atenção:</strong> Placas devolvidas entrarão automaticamente em 
                  <strong> quarentena por 2 anos</strong> conforme norma técnica, ficando indisponíveis para nova saída neste período.
                </p>
              </div>
            )}

            {/* Info for OUT mode regarding Quarantine */}
            {mode === 'OUT' && (
              <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 border border-blue-100">
                <Info className="shrink-0 mt-1 text-blue-600" size={18} />
                <p className="text-sm text-blue-800">
                  <strong>Verificação Automática:</strong> O sistema bloqueará a saída de placas que retornaram do campo há menos de 2 anos (Quarentena).
                </p>
              </div>
            )}

            {/* Input Type Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                <button
                  type="button"
                  onClick={() => setInputType('SINGLE')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    inputType === 'SINGLE' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Hash size={16} />
                    Unitário
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setInputType('RANGE')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    inputType === 'RANGE' ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers size={16} />
                    Sequencial (Faixa)
                  </div>
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número Inicial
                </label>
                <input
                  type="number"
                  value={startNum}
                  onChange={(e) => setStartNum(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: 00100"
                  required
                />
              </div>

              {inputType === 'RANGE' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número Final
                  </label>
                  <input
                    type="number"
                    value={endNum}
                    onChange={(e) => setEndNum(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Ex: 00150"
                    required
                  />
                </div>
              )}
            </div>

            {/* Editable Equipment Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Equipamento
              </label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="">-- Selecione o equipamento --</option>
                {EQUIPMENT_RULES.map(rule => (
                  <option key={rule.id} value={rule.name}>
                    {rule.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Selector for OUT */}
            {mode === 'OUT' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destino
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                >
                  {DESTINATIONS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 animate-fade-in">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p>{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-3 animate-fade-in">
                <Save className="shrink-0 mt-0.5" size={18} />
                <p>{successMsg}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!!error && !selectedEquipment}
              className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2
                ${(!!error && error.startsWith('Erro')) || !selectedEquipment 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : mode === 'IN' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : mode === 'OUT'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                }`}
            >
              <Save size={20} />
              {mode === 'IN' && 'Registrar Entrada'}
              {mode === 'OUT' && 'Registrar Saída'}
              {mode === 'RETURN' && 'Registrar Devolução'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Movements;
