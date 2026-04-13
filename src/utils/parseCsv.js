
// Parse HWiNFO64 CSV log file
// Correct HWiNFO CSV format:
// First row: sensor full names with units [unit]
// Last line of the whole CSV file: sensor hardware categories (the "class" name for grouping)
// The line before last is also a duplicate header row (sensor names again), ignore it
// Date column + Time column are always first two columns
// Data rows are between header and last category line

export function parseHWiNFOCsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length < 3) {
    throw new Error('文件格式错误，不是有效的 HWiNFO64 CSV 日志');
  }

  // First row (index 0): sensor names with units
  const sensorRow = parseCsvLine(lines[0]);
  // Last line (index lines.length - 1): sensor hardware categories
  const categoryRow = parseCsvLine(lines[lines.length - 1]);
  const sensors = [];

  // Skip first two columns: Date and Time are always first two
  let startIndex = 2;

  for (let i = startIndex; i < sensorRow.length; i++) {
    const sensorFullName = sensorRow[i].trim();
    if (!sensorFullName) continue;

    // Extract unit from [unit] at the end
    const unitMatch = sensorFullName.match(/\[([^\]]+)\]$/);
    const unit = unitMatch ? unitMatch[1] : '';
    const name = sensorFullName.replace(/\[([^\]]+)\]$/, '').trim();

    // Get group from the LAST LINE of the entire file (the hardware category row)
    let group = 'Other';
    if (i < categoryRow.length) {
      group = categoryRow[i].trim();
      if (!group || group === '') {
        // Fallback to empty group name becomes 'Other'
        group = 'Other';
      }
    }

    sensors.push({
      index: i,
      name,
      group,
      unit,
      fullName: sensorFullName
    });
  }

  // Parse data rows: first row (0) is header, last row (-1) is category, data goes from 1 to (lines.length - 2)
  const data = [];
  let startTime = null;

  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i];
    const values = parseCsvLine(line);
    
    if (values.length === 0) continue;

    // Combine Date and Time if they are separate columns
    let timestamp;
    if (startIndex === 2) {
      // Date in first column, Time in second
      const dateStr = values[0];
      const timeStr = values[1];
      timestamp = parseDateTime(dateStr, timeStr);
    } else {
      // Combined timestamp in first column
      const timeStr = values[0];
      timestamp = parseTimestamp(timeStr);
    }
    
    if (startTime === null) {
      startTime = timestamp;
    }

    const relativeTime = ((timestamp - startTime) / 1000); // seconds

    const dataPoint = {
      time: relativeTime,
      timestamp: timestamp
    };

    for (let j = 0; j < sensors.length; j++) {
      const sensor = sensors[j];
      const val = parseFloat(values[sensor.index]);
      dataPoint[sensor.index] = isNaN(val) ? null : val;
    }

    data.push(dataPoint);
  }

  // Group sensors
  const groupedSensors = {};
  sensors.forEach(sensor => {
    if (!groupedSensors[sensor.group]) {
      groupedSensors[sensor.group] = [];
    }
    groupedSensors[sensor.group].push(sensor);
  });

  return {
    sensors,
    groupedSensors,
    data,
    startTime,
    totalDuration: data.length > 0 ? data[data.length - 1].time : 0
  };
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseDateTime(dateStr, timeStr) {
  // Parse separate date (d.m.yyyy) and time (hh:mm:ss.ms)
  // Handle date format like "3.4.2026"
  const dateParts = dateStr.split('.');
  let day, month, year;
  if (dateParts.length === 3) {
    day = parseInt(dateParts[0], 10);
    month = parseInt(dateParts[1], 10) - 1; // 0-indexed
    year = parseInt(dateParts[2], 10);
  } else {
    // Fallback to wrong format guess
    return Date.now();
  }

  // Parse time like "14:15:38.589"
  const timeParts = timeStr.split(':');
  let hours, minutes, seconds;
  if (timeParts.length === 3) {
    hours = parseInt(timeParts[0], 10);
    minutes = parseInt(timeParts[1], 10);
    seconds = parseFloat(timeParts[2]);
  } else {
    return Date.now();
  }
  
  const secFloor = Math.floor(seconds);
  const ms = Math.floor((seconds - secFloor) * 1000);
  
  return new Date(year, month, day, hours, minutes, secFloor, ms).getTime();
}

function parseTimestamp(timeStr) {
  // Try parsing "yyyy-mm-dd hh:mm:ss.ms"
  const date = new Date(timeStr);
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }

  // Fallback: try manual parsing
  const parts = timeStr.split(' ');
  if (parts.length < 2) return Date.now();
  
  const datePart = parts[0].split('-');
  const timePart = parts[1].split(':');
  
  const year = parseInt(datePart[0], 10);
  const month = parseInt(datePart[1], 10) - 1;
  const day = parseInt(datePart[2], 10);
  const hours = parseInt(timePart[0], 10);
  const minutes = parseInt(timePart[1], 10);
  const seconds = parseFloat(timePart[2]);
  
  const secFloor = Math.floor(seconds);
  const ms = Math.floor((seconds - secFloor) * 1000);
  
  return new Date(year, month, day, hours, minutes, secFloor, ms).getTime();
}

// Apply moving average smoothing to data
export function smoothData(data, selectedSensors, windowSize) {
  if (windowSize <= 1 || !selectedSensors.length) return data;

  const smoothed = [...data];
  
  for (let i = 0; i < data.length; i++) {
    let count = 0;
    const sum = {};
    selectedSensors.forEach(s => sum[s.index] = 0);

    for (let j = Math.max(0, i - Math.floor(windowSize / 2)); j <= Math.min(data.length - 1, i + Math.floor(windowSize / 2)); j++) {
      selectedSensors.forEach(sensor => {
        const val = data[j][sensor.index];
        if (val !== null && !isNaN(val)) {
          sum[sensor.index] += val;
          count++;
        }
      });
    }

    selectedSensors.forEach(sensor => {
      if (count > 0) {
        smoothed[i] = { ...smoothed[i] };
        smoothed[i][sensor.index] = sum[sensor.index] / count;
      }
    });
  }

  return smoothed;
}

// Generate distinct colors for sensors
const defaultColors = [
  '#fb923c', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', 
  '#f59e0b', '#ec4899', '#06b6d4', '#14b8a6', '#a855f7',
  '#f97316', '#6366f1', '#22c55e', '#e11d48', '#0ea5e9'
];

export function getSensorColor(index) {
  return defaultColors[index % defaultColors.length];
}
