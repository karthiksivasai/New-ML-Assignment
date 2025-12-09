import { DataRow, ColumnStats, Dataset, ScalerType } from '../types';

export const parseCSV = (text: string): { data: DataRow[]; columns: string[] } => {
  // Normalize line endings to \n
  const normalizedText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');
  
  if (lines.length < 2) throw new Error('CSV must have at least a header and one data row');

  // Regex to split by comma while ignoring commas inside quotes
  // Matches a comma only if it's followed by an even number of quotes (or 0) until the end of the string
  const splitCSVLine = (line: string) => {
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => 
      // Remove surrounding quotes and unescape double quotes
      val.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
    );
  };

  const headers = splitCSVLine(lines[0]);
  const data: DataRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCSVLine(line);
    
    // Skip malformed rows that don't match header count
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i + 1}: Expected ${headers.length} columns, got ${values.length}`);
      continue;
    }

    const row: DataRow = {};
    headers.forEach((header, index) => {
      const valStr = values[index];
      // Check if the value is a valid number and not an empty string (which Number() casts to 0)
      const valNum = Number(valStr);
      const isNumeric = !isNaN(valNum) && valStr !== '';
      
      row[header] = isNumeric ? valNum : valStr;
    });
    data.push(row);
  }

  if (data.length === 0) {
    throw new Error('Parsed CSV contains no valid data rows');
  }

  return { data, columns: headers };
};

export const calculateStats = (data: DataRow[], columns: string[]): ColumnStats[] => {
  return columns.map(col => {
    const values = data.map(d => d[col]);
    const numericValues = values.filter(v => typeof v === 'number') as number[];
    const isNumeric = numericValues.length === values.length && values.length > 0;

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