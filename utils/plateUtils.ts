
import { EQUIPMENT_RULES } from '../constants';
import { EquipmentRule, Plate } from '../types';

export const findEquipmentByNumber = (num: number): EquipmentRule | null => {
  for (const rule of EQUIPMENT_RULES) {
    for (const range of rule.ranges) {
      if (num >= range.start && num <= range.end) {
        return rule;
      }
    }
  }
  return null;
};

export const formatNumber = (num: number): string => {
  return num.toString().padStart(5, '0');
};

export const isValidRange = (start: number, end: number): boolean => {
  if (isNaN(start) || isNaN(end)) return false;
  if (start > end) return false;
  
  // Check if they belong to the same equipment type
  const startEq = findEquipmentByNumber(start);
  const endEq = findEquipmentByNumber(end);

  if (!startEq || !endEq) return false;
  return startEq.id === endEq.id;
};

/**
 * Calculates the next available starting number for a given equipment type.
 * It looks at the existing plates to find the maximum used number, 
 * then determines the next valid number based on the defined ranges.
 */
export const getNextAvailableNumber = (equipmentName: string, plates: Plate[]): number | null => {
  const rule = EQUIPMENT_RULES.find(r => r.name === equipmentName);
  if (!rule) return null;

  // 1. Find the highest number currently used for this equipment
  const equipmentPlates = plates.filter(p => p.equipmentName === equipmentName);
  
  let maxUsed = -1;
  if (equipmentPlates.length > 0) {
    maxUsed = Math.max(...equipmentPlates.map(p => p.number));
  }

  // If no plates exist, start at the beginning of the first range
  if (maxUsed === -1) {
    return rule.ranges.length > 0 ? rule.ranges[0].start : null;
  }

  // 2. Find which range the maxUsed belongs to
  for (let i = 0; i < rule.ranges.length; i++) {
    const range = rule.ranges[i];
    
    // If maxUsed is within this range
    if (maxUsed >= range.start && maxUsed <= range.end) {
      // If there is space left in this range
      if (maxUsed < range.end) {
        return maxUsed + 1;
      } else {
        // This range is full, jump to the start of the next range if it exists
        if (i + 1 < rule.ranges.length) {
          return rule.ranges[i + 1].start;
        } else {
          // No more ranges defined
          return null; // Exhausted
        }
      }
    }
  }

  // Fallback: If maxUsed is somehow outside known ranges (legacy data?), 
  // try to find the first range that starts after maxUsed
  for (const range of rule.ranges) {
    if (range.start > maxUsed) {
      return range.start;
    }
  }

  return null; // Should not happen if data is consistent
};
