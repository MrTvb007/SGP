
import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Trash2, AlertTriangle, Lock, Save, CheckCircle, ShieldAlert, History, RefreshCcw, Shield, Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { Plate, TransactionLog, UsageConfig } from '../types';
import { EQUIPMENT_RULES } from '../constants';

interface SettingsProps {
  plates: Plate[];
  logs: TransactionLog[];
  usageConfig: UsageConfig;
  onImport: (plates: Plate[], logs: TransactionLog[]) => void;
  onClear: () => void;
  onUpdateUsage: (config: UsageConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ plates, logs, usageConfig, onImport, onClear, onUpdateUsage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSet, setIsPasswordSet] = useState(false);
  
  // UI State
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Modal State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityPasswordInput, setSecurityPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState<'IMPORT' | 'CLEAR' | null>(null);

  // Restore Point State
  const [restorePointDate, setRestorePointDate] = useState<string | null>(null);

  // Local Usage State for Editing
  const [localUsage, setLocalUsage] = useState<UsageConfig>({});
  const [isUsageOpen, setIsUsageOpen] = useState(false);

  useEffect(() => {
    const storedPass = localStorage.getItem('sgp_admin_password');
    if (storedPass) {
      setIsPasswordSet(true);
    }
    checkRestorePoint();
    setLocalUsage(usageConfig);
  }, [usageConfig]);

  const checkRestorePoint = () => {
    const storedPoint = localStorage.getItem('sgp_restore_point');
    if (storedPoint) {
      try {
        const parsed = JSON.parse(storedPoint);
        if (parsed.timestamp) {
          setRestorePointDate(parsed.timestamp);
        }
      } catch (e) {
        // Invalid restore point
      }
    }
  };

  const createRestorePoint = () => {
    const backupData = {
      plates,
      logs,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('sgp_restore_point', JSON.stringify(backupData));
    setRestorePointDate(backupData.timestamp);
  };

  const handleRestoreFromPoint = () => {
    const storedPoint = localStorage.getItem('sgp_restore_point');
    if (storedPoint) {
      try {
        const parsed = JSON.parse(storedPoint);
        onImport(parsed.plates, parsed.logs);
        setMessage({ type: 'success', text: 'Sistema restaurado para o ponto de segurança com sucesso.' });
      } catch (e) {
        setMessage({ type: 'error', text: 'Falha ao restaurar. O arquivo de backup automático está corrompido.' });
      }
    }
  };

  const handleExport = () => {
    const data = {
      plates,
      logs,
      usageConfig,
      exportDate: new Date().toISOString(),
      version: '1.5'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_sgp_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMessage({ type: 'success', text: 'Backup exportado com sucesso!' });
  };

  const handleRequestAction = (action: 'IMPORT' | 'CLEAR') => {
    if (!isPasswordSet) {
      setMessage({ type: 'error', text: 'Para realizar operações críticas, você deve primeiro definir uma Senha de Administrador.' });
      return;
    }
    setPendingAction(action);
    setSecurityPasswordInput('');
    setShowSecurityModal(true);
  };

  const confirmSecurityAction = () => {
    const storedPass = localStorage.getItem('sgp_admin_password');
    
    if (securityPasswordInput === storedPass) {
      createRestorePoint();

      if (pendingAction === 'IMPORT') {
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
      } else if (pendingAction === 'CLEAR') {
        onClear();
        setMessage({ type: 'success', text: 'Banco de dados apagado com sucesso. Um ponto de restauração foi criado.' });
      }

      setShowSecurityModal(false);
      setSecurityPasswordInput('');
    } else {
      setMessage({ type: 'error', text: 'Senha incorreta. Operação cancelada.' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.plates && Array.isArray(json.plates)) {
          onImport(json.plates, json.logs || []);
          if (json.usageConfig) onUpdateUsage(json.usageConfig);
          setMessage({ type: 'success', text: 'Dados importados com sucesso! Ponto de restauração criado.' });
        } else {
          throw new Error('Formato inválido');
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Erro ao ler arquivo. Verifique se é um backup válido do SGP.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSavePassword = () => {
    const storedPass = localStorage.getItem('sgp_admin_password');

    // If password exists, validate current password
    if (isPasswordSet && storedPass) {
      if (currentPassword !== storedPass) {
        setMessage({ type: 'error', text: 'Senha atual incorreta.' });
        return;
      }
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 4 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem.' });
      return;
    }

    localStorage.setItem('sgp_admin_password', newPassword);
    setIsPasswordSet(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: 'Senha de administrador atualizada com sucesso!' });
  };

  const handleSaveUsage = () => {
    onUpdateUsage(localUsage);
    setMessage({ type: 'success', text: 'Médias de consumo atualizadas com sucesso.' });
    setIsUsageOpen(false); // Close after saving for cleaner UI
  };

  const handleUsageChange = (id: string, val: string) => {
    const num = parseInt(val);
    setLocalUsage(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      
      {/* Header */}
      <div className="bg-gray-800 text-white p-6 rounded-xl shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={28} />
            Painel do Usuário Master
          </h2>
          <p className="text-gray-300 mt-1">Gerenciamento de dados, segurança e parâmetros.</p>
        </div>
      </div>

      {/* Feedback Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <p>{message.text}</p>
        </div>
      )}

      {/* 0. Emergency Restore Section */}
      {restorePointDate && (
        <section className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
                <History size={20} />
                Recuperação de Emergência
              </h3>
              <p className="text-orange-700 text-sm mt-1">
                Existe um ponto de restauração automático criado em <strong>{new Date(restorePointDate).toLocaleString('pt-BR')}</strong>.
              </p>
            </div>
            <button
              onClick={handleRestoreFromPoint}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-bold shadow-sm whitespace-nowrap"
            >
              <RefreshCcw size={18} />
              Desfazer Última Ação
            </button>
          </div>
        </section>
      )}

      {/* 1. Security / Password */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Lock size={20} className="text-purple-600" />
          Senha Master
        </h3>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-3 h-3 rounded-full ${isPasswordSet ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-medium text-gray-700">
              {isPasswordSet ? 'Senha Ativa' : 'Senha não definida'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             {isPasswordSet && (
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha Atual</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Digite sua senha atual para autorizar alterações"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Nova senha..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Repita a nova senha..."
              />
            </div>
          </div>
          
          <button 
            onClick={handleSavePassword}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
          >
            <Save size={16} />
            {isPasswordSet ? 'Alterar Senha' : 'Definir Senha'}
          </button>
        </div>
      </section>

      {/* 2. Consumption Data Configuration (Collapsible) */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <button 
          onClick={() => setIsUsageOpen(!isUsageOpen)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors text-left focus:outline-none"
        >
          <div className="flex items-center gap-2">
            <Calculator size={20} className="text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">Dados de Consumo (Média Anual)</h3>
              <p className="text-xs text-gray-500 font-normal">Clique para expandir ou ocultar a tabela de médias manuais.</p>
            </div>
          </div>
          {isUsageOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </button>

        {isUsageOpen && (
          <div className="p-6 border-t border-gray-100 animate-fade-in bg-gray-50/30">
            <p className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
              <span className="text-blue-600 font-bold">Nota:</span> Se o sistema detectar histórico de uso superior a 3 anos, 
              ele passará automaticamente a usar a média calculada do histórico, ignorando os valores abaixo.
            </p>

            <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Equipamento</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase w-48">Média Anual (Qtd)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {EQUIPMENT_RULES.map(rule => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-700 font-medium">
                        {rule.name}
                      </td>
                      <td className="px-6 py-3">
                        <input 
                          type="number"
                          min="0"
                          value={localUsage[rule.id] !== undefined ? localUsage[rule.id] : rule.estAnnualUsage}
                          onChange={(e) => handleUsageChange(rule.id, e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-right font-mono"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSaveUsage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <Save size={16} />
                Salvar Configurações
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Backup */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Download size={20} className="text-green-600" />
          Backup dos Dados
        </h3>
        <button 
          onClick={handleExport}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 font-medium"
        >
          <Download size={24} />
          <div>
            <span className="block text-left font-bold text-gray-800">Exportar Dados (.json)</span>
            <span className="block text-left text-xs font-normal">Inclui placas, logs e configurações</span>
          </div>
        </button>
      </section>

      {/* 4. Danger Zone */}
      <section className="bg-white rounded-xl shadow-sm border border-red-200 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
          <ShieldAlert size={20} />
          Zona de Perigo
        </h3>
        <p className="text-gray-500 mb-6 text-sm">
          Ações irreversíveis. Exigem Senha Master.
        </p>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50/50">
            <div className="mb-4 md:mb-0">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <Upload size={18} className="text-gray-500" />
                Importar Backup
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                Substitui o banco de dados atual.
              </p>
            </div>
            <button 
              onClick={() => handleRequestAction('IMPORT')}
              className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-bold flex items-center gap-2 shadow-sm"
            >
              <Upload size={16} />
              Restaurar
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50/50">
            <div className="mb-4 md:mb-0">
              <h4 className="font-bold text-red-800 flex items-center gap-2">
                <Trash2 size={18} className="text-red-600" />
                Limpar Sistema
              </h4>
              <p className="text-xs text-red-600 mt-1">
                Apaga tudo.
              </p>
            </div>
            <button 
              onClick={() => handleRequestAction('CLEAR')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold flex items-center gap-2 shadow-sm"
            >
              <Trash2 size={16} />
              Limpar
            </button>
          </div>
        </div>
      </section>

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-4 border-red-500">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
              {pendingAction === 'CLEAR' ? 'Limpar Dados' : 'Importar Backup'}
            </h3>
            <p className="text-gray-500 text-center text-sm mb-4">
              Digite a Senha Master para confirmar.
            </p>
            <input 
              type="password"
              value={securityPasswordInput}
              onChange={(e) => setSecurityPasswordInput(e.target.value)}
              placeholder="Senha de Administrador"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-6 text-center text-lg"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSecurityModal(false)} className="flex-1 py-3 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={confirmSecurityAction} disabled={!securityPasswordInput} className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
