import { DataRow, ColumnStats, Dataset, ScalerType } from '../types';

export const parseCSV = (text: string): { data: DataRow[]; columns: string[] } => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have at least header and one row');

  // Simple CSV parser handling basic commas. For complex CSVs with quotes, a library is better, 
  // but this suffices for the demo constraints.
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const data: DataRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;

    const row: DataRow = {};
    headers.forEach((header, index) => {
      const valStr = values[index].trim().replace(/^"|"$/g, '');
      const valNum = parseFloat(valStr);
      row[header] = isNaN(valNum) ? valStr : valNum;
    });
    data.push(row);
  }

  return { data, columns: headers };
};

export const calculateStats = (data: DataRow[], columns: string[]): ColumnStats[] => {
  return columns.map(col => {
    const values = data.map(d => d[col]);
    const numericValues = values.filter(v => typeof v === 'number') as number[];
    const isNumeric = numericValues.length === values.length;

    if (!isNumeric) {
      const unique = new Set(values).size;
      return { name: col, type: 'string', uniqueValues: unique };
    }

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const sum = numericValues.reduce((a, b) => a + b, 0);
    const mean = sum / numericValues.length;
    const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
    const std = Math.sqrt(variance);

    return { name: col, type: 'number', min, max, mean, std, uniqueValues: new Set(values).size };
  });
};

export const applyScaling = (data: DataRow[], stats: ColumnStats[], scaler: ScalerType, targetCol: string | null): DataRow[] => {
  if (scaler === 'None') return [...data];

  return data.map(row => {
    const newRow = { ...row };
    stats.forEach(stat => {
      if (stat.type === 'number' && stat.name !== targetCol) {
        let val = newRow[stat.name] as number;
        
        if (scaler === 'MinMax' && stat.min !== undefined && stat.max !== undefined && stat.max !== stat.min) {
          val = (val - stat.min) / (stat.max - stat.min);
        } else if (scaler === 'Standard' && stat.mean !== undefined && stat.std !== undefined && stat.std !== 0) {
          val = (val - stat.mean) / stat.std;
        }
        
        // Round for cleaner UI
        newRow[stat.name] = Number(val.toFixed(4));
      }
    });
    return newRow;
  });
};
