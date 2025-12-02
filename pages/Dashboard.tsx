import React from 'react';
import { Package, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import { Plate, PlateStatus } from '../types';

interface DashboardProps {
  plates: Plate[];
}

const Dashboard: React.FC<DashboardProps> = ({ plates }) => {
  const totalStock = plates.filter(p => p.status === PlateStatus.IN_STOCK).length;
  const totalDistributed = plates.filter(p => p.status === PlateStatus.DISTRIBUTED).length;
  
  // Recent activity mock logic (last 24h)
  const today = new Date().toISOString().split('T')[0];
  const movedToday = plates.filter(p => p.dateOut?.startsWith(today)).length;
  const receivedToday = plates.filter(p => p.dateIn.startsWith(today)).length;

  // Chart Data Preparation
  const stockByType = plates.reduce((acc, plate) => {
    if (plate.status === PlateStatus.IN_STOCK) {
      acc[plate.equipmentName] = (acc[plate.equipmentName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(stockByType)
    .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 18) + '...' : name, fullname: name, count }))
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 8); // Top 8

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Em Estoque" 
          value={totalStock} 
          icon={Package} 
          color="blue" 
          description="Placas disponíveis"
        />
        <StatCard 
          title="Distribuídas" 
          value={totalDistributed} 
          icon={Truck} 
          color="green" 
          description="Total entregue"
        />
        <StatCard 
          title="Recebidas Hoje" 
          value={receivedToday} 
          icon={CheckCircle} 
          color="yellow" 
          description="Entradas recentes"
        />
        <StatCard 
          title="Saídas Hoje" 
          value={movedToday} 
          icon={AlertTriangle} 
          color="red" 
          description="Saídas recentes"
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Top 8 Equipamentos em Estoque</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                 cursor={{fill: '#f3f4f6'}}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#60a5fa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;