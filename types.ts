
export interface NumberRange {
  start: number;
  end: number;
}

export interface EquipmentRule {
  id: string;
  name: string;
  ranges: NumberRange[];
  estAnnualUsage: number; // Estimated usage per year for forecasting
}

export enum Destination {
  CONSTRUCAO = 'Construção',
  MANUTENCAO = 'Manutenção',
  TIMBO = 'Timbó',
  BRUSQUE = 'Brusque',
}

export enum PlateStatus {
  IN_STOCK = 'Em Estoque',
  DISTRIBUTED = 'Distribuído',
  RETURNED = 'Devolvida / Quarentena',
}

export interface Plate {
  number: number;
  equipmentName: string;
  status: PlateStatus;
  destination?: Destination | string;
  dateIn: string; // ISO Date
  dateOut?: string; // ISO Date
  dateReturned?: string; // ISO Date - Starts the 2-year quarantine
}

export interface TransactionLog {
  id: string;
  type: 'IN' | 'OUT' | 'RETURN';
  startNumber: number;
  endNumber: number;
  count: number;
  equipmentName: string;
  destination?: string;
  timestamp: string;
}

export type ViewState = 'dashboard' | 'movements' | 'inventory' | 'reports' | 'purchase';
