import React, { useState } from 'react';

export default function SensorSelector({ groupedSensors, selectedSensors, onSelectionChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSensor = (sensor) => {
    const isSelected = selectedSensors.some(s => s.index === sensor.index);
    let newSelected;
    if (isSelected) {
      newSelected = selectedSensors.filter(s => s.index !== sensor.index);
    } else {
      newSelected = [...selectedSensors, sensor];
    }
    onSelectionChange(newSelected);
  };

  const toggleGroup = (groupName, sensors) => {
    const allSelected = sensors.every(s => selectedSensors.some(ss => ss.index === s.index));
    let newSelected;
    if (allSelected) {
      newSelected = selectedSensors.filter(s => !sensors.some(g => g.index === s.index));
    } else {
      const existingIndexes = new Set(selectedSensors.map(s => s.index));
      newSelected = [...selectedSensors];
      sensors.forEach(s => {
        if (!existingIndexes.has(s.index)) {
          newSelected.push(s);
        }
      });
    }
    onSelectionChange(newSelected);
  };

  const selectAll = () => {
    const all = [];
    Object.values(groupedSensors).forEach(group => {
      all.push(...group);
    });
    onSelectionChange(all);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const filterSensors = (sensors) => {
    if (!searchTerm) return sensors;
    const term = searchTerm.toLowerCase();
    return sensors.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.group.toLowerCase().includes(term)
    );
  };

  return (
    <div className="text-sm">
      {/* 控制按钮 */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1 text-sm rounded border border-orange-400 bg-orange-400 text-white hover:bg-orange-500 transition-colors"
          >
            全选
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            清空
          </button>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          已选择 {selectedSensors.length} 个传感器
        </p>
      </div>

      {/* 传感器列表 */}
      <div className="p-4">
        <input
          type="text"
          placeholder="搜索传感器..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-400 mb-4"
        />

        {Object.entries(groupedSensors)
          .map(([group, sensors]) => ({ group, sensors, filtered: filterSensors(sensors) }))
          .filter(({ filtered }) => filtered.length > 0)
          .map(({ group, sensors, filtered }) => {
            const allInGroupSelected = filtered.every(s => 
              selectedSensors.some(ss => ss.index === s.index)
            );
            
            return (
              <section key={group} className="mb-4">
                <header className="sticky top-0 bg-neutral-100 p-4 py-3 backdrop-blur-md dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 -mx-4 mb-2">
                  <h2 className="truncate font-bold leading-none">{group}</h2>
                </header>
                <ul className="space-y-4">
                  {filtered.map(sensor => {
                    const isChecked = selectedSensors.some(s => s.index === sensor.index);
                    return (
                      <li key={sensor.index} className="group">
                        <label className="flex items-center gap-2 group-hover:text-black dark:group-hover:text-neutral-200">
                          <button
                            type="button"
                            onClick={() => toggleSensor(sensor)}
                            className={`mr-2 flex shrink-0 size-4 items-center justify-center rounded ${
                              isChecked 
                                ? 'bg-neutral-200 dark:bg-neutral-600' 
                                : 'border border-neutral-300 dark:border-neutral-700 group-hover:border-neutral-400 dark:group-hover:border-neutral-600'
                            }`}
                          >
                            {isChecked && (
                              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256" className="size-3 text-neutral-950 dark:text-neutral-50">
                                <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"></path>
                              </svg>
                            )}
                          </button>
                          <span className="truncate">{sensor.name}</span>
                          <span className="text-neutral-400 dark:text-neutral-600">[{sensor.unit || ''}]</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
      </div>
    </div>
  );
}