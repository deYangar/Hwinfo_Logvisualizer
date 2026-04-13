import React, { useState, memo, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush,
  ReferenceLine
} from 'recharts';
import { getSensorColor } from '../utils/parseCsv';

// Calculate min/max/avg for each sensor
function calculateStats(data, selectedSensors) {
  const stats = {};
  const count = data.length;
  
  selectedSensors.forEach(sensor => {
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    let validCount = 0;
    
    data.forEach(point => {
      const val = point[sensor.index];
      if (val !== null && !isNaN(val)) {
        sum += val;
        if (val < min) min = val;
        if (val > max) max = val;
        validCount++;
      }
    });
    
    if (validCount > 0) {
      stats[sensor.index] = {
        min,
        max,
        avg: sum / validCount,
        count: validCount
      };
    } else {
      stats[sensor.index] = { min: 0, max: 0, avg: 0, count: 0 };
    }
  });
  
  return stats;
}

const ChartView = ({ 
  data, 
  selectedSensors, 
  unit, 
  theme, 
  showStats, 
  onExportPNG, 
  onExportSVG,
  activeTooltipIndex,
  onActiveIndexChange
}) => {
  const [statsOpen, setStatsOpen] = useState(false);
  const isDark = theme === 'dark';

  if (!data || data.length === 0 || selectedSensors.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm h-full flex flex-col">
        <p className="text-neutral-500 dark:text-neutral-400">请选择至少一个传感器以显示图表</p>
      </div>
    );
  }

  const strokeColor = isDark ? '#d4d4d4' : '#404040';
  const gridColor = isDark ? '#404040' : '#e5e5e5';
  const tooltipBg = isDark ? 'rgba(23, 23, 23, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? '1px solid #404040' : '1px solid #e5e5e5';
  const tooltipText = isDark ? '#d4d4d4' : '#404040';

  // 缓存统计结果，只在传感器或数据变化时重新计算
  const stats = useMemo(() => calculateStats(data, selectedSensors), [data, selectedSensors]);

  const handleMouseMove = (state) => {
    if (state && state.activeTooltipIndex !== undefined) {
      onActiveIndexChange(state.activeTooltipIndex);
    }
  };

  const handleMouseLeave = () => {
    onActiveIndexChange(null);
  };

  const shouldShow = activeTooltipIndex != null && 
                   activeTooltipIndex >= 0 && 
                   activeTooltipIndex < data.length;

  // 完全按照你的要求 + 原网站实现：
  // - 竖直参考线：所有图表都同步在鼠标悬停时间点（所有图表都有）
  // - tooltip信息：所有图表都跟随当前时间点水平移动，和原网站完全一致
  // - 问题2：只保留这一个跟随鼠标的tooltip，删除重复
  // - 优化：当鼠标在右侧时，tooltip向左偏移，避免超出容器挤压变形
  const renderTooltip = () => {
    if (!shouldShow) return null;
    
    const currentData = data[activeTooltipIndex];
    const totalSeconds = currentData.time;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // X位置和参考线完全对齐，使用索引计算百分比而不是时间值：
    // - 不管X轴怎么刷选缩放，位置总是对的
    // - 索引从0 ~ data.length-1，百分比总是相对于整个图表宽度，和Recharts参考线完全对齐
    // - 左边留出Y轴宽度偏移，保证位置精确
    const chartLeftPaddingPercent = 0.08;
    const chartWidthPercent = 0.82;
    const indexPercent = activeTooltipIndex / (data.length - 1);
    const actualX = chartLeftPaddingPercent + indexPercent * chartWidthPercent;
    
    // 优化：鼠标在右侧超过55%位置时，tooltip向左偏移，避免超出容器挤压变形
    const isRightSide = indexPercent > 0.55;
    const transform = isRightSide ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)';
    
    return (
      <div
        className="absolute"
        style={{
          top: 16,
          left: `${actualX * 100}%`,
          transform,
          backgroundColor: tooltipBg,
          border: tooltipBorder,
          color: tooltipText,
          padding: '8px 12px',
          borderRadius: '6px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          zIndex: 50,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <p className="font-medium mb-2">{timeLabel}</p>
        {selectedSensors.map((sensor, groupIdx) => {
          const value = currentData[sensor.index];
          if (value == null || isNaN(value)) return null;
          const color = getSensorColor(groupIdx);
          return (
            <div key={sensor.index} className="flex items-center gap-2 mb-1 last:mb-0">
              <span style={{ color, fontWeight: 600 }}>
                {sensor.name}: <span style={{ color: tooltipText }}>{value.toFixed(1)} {unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-2 justify-between items-center">
        <h3 className="font-semibold text-lg">{unit}</h3>
        <div className="flex gap-2">
          {showStats && (
            <button
              onClick={() => setStatsOpen(!statsOpen)}
              className="px-3 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              {statsOpen ? '隐藏统计' : '图例 & 统计'}
            </button>
          )}
          <button
            onClick={onExportPNG}
            className="px-3 py-1 text-sm rounded-lg bg-orange-400 text-white hover:bg-orange-500 transition-colors"
          >
            导出 PNG
          </button>
        </div>
      </div>

      {statsOpen && (
        <div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedSensors.map((sensor, groupIdx) => {
              const s = stats[sensor.index];
              return (
                <div key={sensor.index} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSensorColor(groupIdx) }} />
                  <span className="flex-1">{sensor.name}:</span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    最小: {s.min?.toFixed(2)}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    最大: {s.max?.toFixed(2)}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    平均: {s.avg?.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 问题1修复：tooltip要相对于图表区域定位，不是整个卡片，这样位置才对 */}
      {/* 统计图展开时，整个容器自动扩展，下方图表自然向下移动，符合你的要求 */}
      {/* 直接给图表区域固定高度 280px，保证始终可见 */}
      <div className="h-[280px] w-full relative">
        {/* 所有图表都渲染跟随鼠标时间线的tooltip，放在图表区域内，位置才会正确 */}
        {renderTooltip()}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="time"
              label={{ value: '时间 (秒)', position: 'insideBottom', offset: -5 }}
              tick={{ fill: strokeColor }}
              stroke={isDark ? '#525252' : '#d4d4d4'}
            />
            <YAxis
              tick={{ fill: strokeColor }}
              stroke={isDark ? '#525252' : '#d4d4d4'}
              unit={unit}
            />
            {/* 问题2修复：完全删除内置tooltip，只保留我们跟随鼠标的那一个，彻底解决重复显示 */}
            <Legend wrapperStyle={{ color: strokeColor }} />
            <Brush 
              dataKey="time" 
              height={30} 
              stroke="#fb923c"
              fill={isDark ? '#404040' : '#f5f5f5'}
              travellerFill={isDark ? '#737373' : '#e5e5e5'}
            />
            {/* 问题1修复：所有图表都显示同步竖直参考线，和原网站一样 */}
            {shouldShow && (
              <ReferenceLine 
                x={data[activeTooltipIndex].time} 
                stroke={isDark ? '#a3a3a3' : '#737373'} 
                strokeWidth={1} 
              />
            )}
            {selectedSensors.map((sensor, groupIndex) => (
              <Line
                key={sensor.index}
                type="monotone"
                dataKey={sensor.index}
                name={`${sensor.name}`}
                stroke={getSensorColor(groupIndex)}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 问题3修复：
// - 使用memo缓存，只有真正需要变化的数据改变才重渲染折线部分
// - 关闭折线动画，避免每次重渲染都重新加载动画
// - activeTooltipIndex 改变必须重渲染来更新tooltip位置，这里直接检查
export default memo(ChartView, (prevProps, nextProps) => {
  // 只要 activeTooltipIndex 变了，必须重渲染更新 tooltip 和参考线
  if (prevProps.activeTooltipIndex !== nextProps.activeTooltipIndex) {
    return false;
  }
  // 其他数据不变就缓存
  if (prevProps.data !== nextProps.data) return false;
  if (prevProps.selectedSensors !== nextProps.selectedSensors) return false;
  if (prevProps.theme !== nextProps.theme) return false;
  if (prevProps.onExportPNG !== nextProps.onExportPNG) return false;
  return true;
});
