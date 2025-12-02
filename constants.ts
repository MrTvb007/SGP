
import { EquipmentRule, Destination } from './types';

// Note: estAnnualUsage values are placeholders. 
// In a real scenario, these should be adjusted based on the user's historical data.
export const EQUIPMENT_RULES: EquipmentRule[] = [
  {
    id: 'chave-tripolar-sem-corte',
    name: 'Chave Tripolar Sem Corte Visível',
    ranges: [{ start: 1, end: 99 }],
    estAnnualUsage: 20,
  },
  {
    id: 'seccionalizador',
    name: 'Seccionalizador',
    ranges: [{ start: 100, end: 199 }],
    estAnnualUsage: 30,
  },
  {
    id: 'chave-fusivel-capacitor',
    name: 'Chave Fusível de Capacitor',
    ranges: [
      { start: 200, end: 299 },
      { start: 85000, end: 85199 },
    ],
    estAnnualUsage: 50,
  },
  {
    id: 'regulador-tensao',
    name: 'Regulador de Tensão',
    ranges: [{ start: 300, end: 399 }],
    estAnnualUsage: 15,
  },
  {
    id: 'chave-tripolar-corte-visivel',
    name: 'Chave Tripolar com Corte Visível',
    ranges: [{ start: 400, end: 499 }],
    estAnnualUsage: 25,
  },
  {
    id: 'religador-rede',
    name: 'Religador da Rede',
    ranges: [
      { start: 500, end: 599 },
      { start: 86500, end: 86999 },
    ],
    estAnnualUsage: 40,
  },
  {
    id: 'chave-fusivel-religadora',
    name: 'Chave Fusível Religadora',
    ranges: [
      { start: 600, end: 799 },
      { start: 82000, end: 82999 },
    ],
    estAnnualUsage: 80,
  },
  {
    id: 'chave-faca-unipolar-carga',
    name: 'Chave Faca Unipolar – Abertura com Carga',
    ranges: [
      { start: 800, end: 2899 },
      { start: 84000, end: 84999 },
      { start: 90000, end: 90999 },
    ],
    estAnnualUsage: 500,
  },
  {
    id: 'chave-faca-unipolar-sem-carga',
    name: 'Chave Faca Unipolar – Abertura sem Carga',
    ranges: [
      { start: 2900, end: 2999 },
      { start: 97800, end: 97999 },
    ],
    estAnnualUsage: 100,
  },
  {
    id: 'chave-fusivel-ramal',
    name: 'Chave Fusível de Ramal',
    ranges: [
      { start: 3000, end: 4999 },
      { start: 80000, end: 81999 },
      { start: 87000, end: 88999 },
    ],
    estAnnualUsage: 800,
  },
  {
    id: 'chave-fusivel-trafo',
    name: 'Chave Fusível de Trafo',
    ranges: [{ start: 5000, end: 69999 }],
    estAnnualUsage: 2000,
  },
  {
    id: 'chave-fusivel-ramal-particular',
    name: 'Chave Fusível de Ramal Particular',
    ranges: [{ start: 70000, end: 79999 }],
    estAnnualUsage: 300,
  },
  {
    id: 'chave-faca-ramal-particular',
    name: 'Chave Faca de Ramal Particular',
    ranges: [{ start: 85200, end: 85699 }],
    estAnnualUsage: 100,
  },
  {
    id: 'seccionalizador-ramal-particular',
    name: 'Seccionalizador para Ramal Particular',
    ranges: [{ start: 85700, end: 85999 }],
    estAnnualUsage: 50,
  },
  {
    id: 'chave-base-fusivel-lamina',
    name: 'Chave Base Fusível com Lâmina Seccionadora',
    ranges: [{ start: 83000, end: 83999 }],
    estAnnualUsage: 60,
  },
  {
    id: 'disjuntor-pvo',
    name: 'Disjuntor a Pequeno Volume de Óleo (DJ PVO)',
    ranges: [{ start: 86000, end: 86499 }],
    estAnnualUsage: 20,
  },
  {
    id: 'trip-saver',
    name: 'Chave Religadora Eletrônica (Trip Saver)',
    ranges: [
      { start: 89000, end: 89199 },
      { start: 89400, end: 89999 },
    ],
    estAnnualUsage: 150,
  },
  {
    id: 'chave-unid-geradora',
    name: 'Chave Unid Geradora',
    ranges: [{ start: 89200, end: 89399 }],
    estAnnualUsage: 40,
  },
  {
    id: 'chave-tripolar',
    name: 'Chave Tripolar',
    ranges: [{ start: 98999, end: 99999 }],
    estAnnualUsage: 100,
  },
  {
    id: 'religador-particular',
    name: 'Religador Particular',
    ranges: [{ start: 98000, end: 98998 }],
    estAnnualUsage: 50,
  },
  {
    id: 'reserva-tecnica',
    name: 'Reserva Técnica',
    ranges: [{ start: 91000, end: 97799 }],
    estAnnualUsage: 1000,
  },
];

export const DESTINATIONS = [
  Destination.CONSTRUCAO,
  Destination.MANUTENCAO,
  Destination.TIMBO,
  Destination.BRUSQUE,
];
