
import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Trash2, AlertTriangle, Lock, Save, CheckCircle, ShieldAlert, History, RefreshCcw, Shield } from 'lucide-react';
import { Plate, TransactionLog } from '../types';

interface SettingsProps {
  plates: Plate[];
  logs: TransactionLog[];
  onImport: (plates: Plate[], logs: TransactionLog[]) => void;
  onClear: () => void;
}

const Settings: React.FC<SettingsProps> = ({ plates, logs, onImport, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password State
  const [password, setPassword] = useState('');
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

  useEffect(() => {
    const storedPass = localStorage.getItem('sgp_admin_password');
    if (storedPass) {
      setIsPasswordSet(true);
    }
    checkRestorePoint();
  }, []);

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
    console.log('Ponto de restauração criado.');
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
      exportDate: new Date().toISOString(),
      version: '1.0'
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
      // 1. Create Restore Point automatically before action
      createRestorePoint();

      // 2. Execute Action
      if (pendingAction === 'IMPORT') {
        // Trigger file input
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
          setMessage({ type: 'success', text: 'Dados importados com sucesso! Ponto de restauração criado.' });
        } else {
          throw new Error('Formato inválido');
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Erro ao ler arquivo. Verifique se é um backup válido do SGP.' });
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleSavePassword = () => {
    if (password.length < 4) {
      setMessage({ type: 'error', text: 'A senha deve ter pelo menos 4 caracteres.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não conferem.' });
      return;
    }

    localStorage.setItem('sgp_admin_password', password);
    setIsPasswordSet(true);
    setPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: 'Senha de administrador definida com sucesso!' });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-gray-800 text-white p-6 rounded-xl shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={28} />
            Painel do Usuário Master
          </h2>
          <p className="text-gray-300 mt-1">Gerenciamento de dados sensíveis e configurações de segurança.</p>
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

      {/* 0. Emergency Restore Section (Only visible if point exists) */}
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
                Caso algo tenha dado errado na última importação ou limpeza, você pode reverter agora.
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
        <p className="text-gray-500 mb-6 text-sm">
          Defina ou altere a senha de administrador. Esta senha protege funções críticas como Importar e Limpar dados.
        </p>

        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className={`w-3 h-3 rounded-full ${isPasswordSet ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-sm font-medium text-gray-700">
              {isPasswordSet ? 'Senha de Administrador Ativa' : 'Senha não definida (Proteção inativa)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nova Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Digite a senha..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Senha</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Repita a senha..."
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

      {/* 2. Backup Only */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Download size={20} className="text-blue-600" />
          Backup dos Dados (Exportar)
        </h3>
        <p className="text-gray-500 mb-6 text-sm">
          Faça o download dos dados para salvar um backup seguro em seu computador.
        </p>
        
        <button 
          onClick={handleExport}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-gray-700 font-medium"
        >
          <Download size={24} />
          <div>
            <span className="block text-left font-bold text-gray-800">Exportar Dados (.json)</span>
            <span className="block text-left text-xs font-normal">Salvar arquivo no computador</span>
          </div>
        </button>
      </section>

      {/* 3. Danger Zone (Import & Clear) */}
      <section className="bg-white rounded-xl shadow-sm border border-red-200 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
          <ShieldAlert size={20} />
          Zona de Perigo (Ações Destrutivas)
        </h3>
        <p className="text-gray-500 mb-6 text-sm">
          As ações abaixo <strong>substituem ou apagam</strong> os dados atuais permanentemente. 
          É obrigatório o uso da Senha Master.
        </p>

        <div className="space-y-4">
          
          {/* Import Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50/50 hover:bg-red-50 transition-colors">
            <div className="mb-4 md:mb-0">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <Upload size={18} className="text-gray-500" />
                Importar Backup
              </h4>
              <p className="text-xs text-gray-600 mt-1 max-w-md">
                Substitui todo o banco de dados atual pelo conteúdo de um arquivo. 
                Use com cautela para não sobrescrever dados recentes.
              </p>
            </div>
            <button 
              onClick={() => handleRequestAction('IMPORT')}
              className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-bold flex items-center gap-2 shadow-sm whitespace-nowrap justify-center"
            >
              <Upload size={16} />
              Restaurar Backup
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden" 
            />
          </div>

          {/* Clear Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50/50 hover:bg-red-50 transition-colors">
            <div className="mb-4 md:mb-0">
              <h4 className="font-bold text-red-800 flex items-center gap-2">
                <Trash2 size={18} className="text-red-600" />
                Limpar Todo o Sistema
              </h4>
              <p className="text-xs text-red-600 mt-1 max-w-md">
                Apaga todas as placas, histórico e configurações. O sistema voltará ao estado inicial (zero).
              </p>
            </div>
            <button 
              onClick={() => handleRequestAction('CLEAR')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold flex items-center gap-2 shadow-sm whitespace-nowrap justify-center"
            >
              <Trash2 size={16} />
              Limpar Dados
            </button>
          </div>

        </div>
      </section>

      {/* Unified Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border-t-4 border-red-500">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-red-100 text-red-600">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {pendingAction === 'CLEAR' ? 'Limpar Dados' : 'Importar Backup'}
              </h3>
              <p className="text-gray-500 mt-2 text-sm">
                {pendingAction === 'CLEAR' 
                  ? 'Esta ação apagará os dados atuais. ' 
                  : 'A importação substituirá os dados atuais por um arquivo antigo. '}
                Dados não salvos serão perdidos.
              </p>
              <div className="mt-3 bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-lg border border-blue-100">
                Um <strong>Ponto de Restauração</strong> será criado automaticamente antes da execução.
              </div>
              <p className="text-gray-800 font-bold mt-4 text-sm">
                Digite sua senha Master para confirmar:
              </p>
            </div>

            <div className="mb-6">
              <input 
                type="password"
                value={securityPasswordInput}
                onChange={(e) => setSecurityPasswordInput(e.target.value)}
                placeholder="Senha de Administrador"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center text-lg"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowSecurityModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmSecurityAction}
                disabled={!securityPasswordInput}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
