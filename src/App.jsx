import React, { useState, useEffect, useMemo } from 'react';
import Dropzone from './components/Dropzone';
import SensorSelector from './components/SensorSelector';
import ChartView from './components/ChartView';
import ThemeToggle from './components/ThemeToggle';
import { parseHWiNFOCsv, smoothData } from './utils/parseCsv';
import { getInitialTheme, toggleTheme } from './utils/theme';
import html2canvas from 'html2canvas';

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme());
  const [parsedData, setParsedData] = useState(null);
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [smoothingWindow, setSmoothingWindow] = useState(1);
  const [error, setError] = useState(null);
  const [activeTooltipIndex, setActiveTooltipIndex] = useState(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showRotatePrompt, setShowRotatePrompt] = useState(false);
  const isDark = theme === 'dark';

  // 检测是否是移动端设备
  const checkIsMobile = () => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
    setIsMobile(mobile);
    return mobile;
  };

  // 检测横竖屏
  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
      
      // 移动端竖屏时显示提示
      const mobile = checkIsMobile();
      if (mobile && !landscape) {
        setShowRotatePrompt(true);
      } else {
        setShowRotatePrompt(false);
      }
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);



  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeToggle = () => {
    const newTheme = toggleTheme(theme);
    setTheme(newTheme);
  };

  const handleFileLoaded = (text) => {
    setError(null);
    try {
      const parsed = parseHWiNFOCsv(text);
      setParsedData(parsed);
      const initialSelected = parsed.sensors.slice(0, 10);
      setSelectedSensors(initialSelected);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleError = (message) => {
    setError(message);
  };

  const chartData = useMemo(() => {
    if (!parsedData) return [];
    if (smoothingWindow <= 1) return parsedData.data;
    return smoothData(parsedData.data, selectedSensors, smoothingWindow);
  }, [parsedData, selectedSensors, smoothingWindow]);

  const groupedSelectedByUnit = useMemo(() => {
    const grouped = {};
    selectedSensors.forEach(sensor => {
      const unit = sensor.unit || 'none';
      if (!grouped[unit]) {
        grouped[unit] = [];
      }
      grouped[unit].push(sensor);
    });
    return grouped;
  }, [selectedSensors]);

  const exportChartPNG = async (unit) => {
    try {
      const chartContainers = document.querySelectorAll('.chart-container');
      let chartDiv = null;
      for (let i = 0; i < chartContainers.length; i++) {
        if (chartContainers[i].dataset.unit === unit) {
          chartDiv = chartContainers[i];
          break;
        }
      }
      if (chartDiv) {
        const canvas = await html2canvas(chartDiv, {
          backgroundColor: isDark ? '#262626' : '#ffffff',
          scale: 2,
          useCORS: true
        });
        const link = document.createElement('a');
        const currentUnit = unit.replace(/[^\w]/g, '-');
        link.download = `logvisualizer-${currentUnit}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        window.alert('导出失败，找不到图表容器');
      }
    } catch (err) {
      console.error('导出失败:', err);
      window.alert('导出失败: ' + err.message);
    }
  };

  const exportSVG = () => {
    window.alert('SVG export 功能开发中...');
  };

  return (
    <div className={`h-screen grid grid-rows-1 ${
      isLandscape 
        ? 'grid-cols-[56px_calc((100vw-56px)*2/9)_1fr]' 
        : 'grid-cols-[56px_1fr]'
    }`}>
      {/* 左侧导航栏 */}
      <aside className="[grid-area:1/1/2/2] border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-neutral-50 dark:bg-neutral-900">
        <h1 
          className="h-14 flex items-center justify-center border-b border-neutral-200 dark:border-neutral-800 cursor-pointer"
          onClick={() => {
            setParsedData(null);
            setSelectedSensors([]);
            setError(null);
          }}
        >
          <svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-7 rounded">
            <rect width="800" height="800" fill="url(#logo-bg-gradient)"></rect>
            <path d="M130 430H160H190H220H250L265 377.5L280 325L295 272.5L310 220L321.25 265.062L332.5 310.125L343.75 355.188L355 400.25L366.25 445.312L377.5 490.375L388.75 535.438L400 580.5L422.5 520.375L445 460.25L467.5 400.125L490 340L520 385L550 430H580H610H640H670" stroke="white" strokeWidth="60" strokeLinecap="round" strokeLinejoin="round"></path>
            <defs>
              <linearGradient id="logo-bg-gradient" x1="400" y1="0" x2="400" y2="800" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FB923C"></stop>
                <stop offset="1" stopColor="#F97316"></stop>
              </linearGradient>
            </defs>
          </svg>
        </h1>
        <ul className="flex flex-col flex-1">
          <li className="h-14 flex items-center justify-center text-neutral-900 dark:text-neutral-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256" className="size-7">
              <path d="M224,128a8,8,0,0,1-8,8H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128ZM128,72h88a8,8,0,0,0,0-16H128a8,8,0,0,0,0,16Zm88,112H128a8,8,0,0,0,0,16h88a8,8,0,0,0,0-16ZM82.34,42.34,56,68.69,45.66,58.34A8,8,0,0,0,34.34,69.66l16,16a8,8,0,0,0,11.32,0l32-32A8,8,0,0,0,82.34,42.34Zm0,64L56,132.69,45.66,122.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Zm0,64L56,196.69,45.66,186.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32,0l32-32a8,8,0,0,0-11.32-11.32Z"></path>
            </svg>
          </li>
        </ul>
        <ul className="flex flex-col justify-end pb-1 mt-auto">
          <li className="h-12 flex items-center justify-center">
            <button onClick={handleThemeToggle} className="text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors">
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256" className="size-6">
                  <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-8H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256" className="size-6">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm0-112a8,8,0,0,0-8-8H48a8,8,0,0,0,0,16h72A8,8,0,0,0,128,104Zm0,48a8,8,0,0,0-8-8H48a8,8,0,0,0,0,16h72A8,8,0,0,0,128,152Zm0-168a8,8,0,0,0-8-8H48a8,8,0,0,0,0,16h72A8,8,0,0,0,128-16Zm0,336a8,8,0,0,0-8-8H48a8,8,0,0,0,0,16h72A8,8,0,0,0,128,320Z"></path>
                </svg>
              )}
            </button>
          </li>
        </ul>
      </aside>

      {/* 传感器选择面板 */}
      <aside className={`[grid-area:1/2/2/3] overflow-y-auto bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 ${isLandscape ? 'border-r' : ''}`}>
        {!parsedData ? (
          <div className="flex flex-col h-full justify-center items-center p-8">
            <p className="text-neutral-400 text-center text-sm">请先上传 CSV 文件</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* 搜索框 */}
            <div className="relative shrink-0 h-14 w-full border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <input 
                type="search" 
                placeholder="搜索传感器..." 
                className="peer block h-full w-full bg-transparent pl-12 pr-4 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 256 256" className="size-5">
                  <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                </svg>
              </div>
            </div>
            {/* 传感器列表 */}
            <div className="flex-1 min-h-0">
              <SensorSelector
                groupedSensors={parsedData.groupedSensors}
                selectedSensors={selectedSensors}
                onSelectionChange={setSelectedSensors}
              />
            </div>
          </div>
        )}
      </aside>

      {/* 主图表区域 */}
      <main className="[grid-area:1/3/2/4] overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
        {!parsedData ? (
          <div className="max-w-3xl mx-auto mt-20 px-4">
            <Dropzone onFileLoaded={handleFileLoaded} onError={handleError} />
            <div className="mt-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
              <p>所有数据处理都在浏览器本地完成，文件不会上传到任何服务器</p>
              <p className="mt-2">需要 HWiNFO64 导出的 CSV 格式日志文件</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
                {error}
              </div>
            )}
            {Object.entries(groupedSelectedByUnit).map(([unit, sensors]) => {
              return (
                <div key={unit} className="chart-container" data-unit={unit}>
                  <ChartView
                    data={chartData}
                    selectedSensors={sensors}
                    unit={unit}
                    onExportPNG={() => exportChartPNG(unit)}
                    onExportSVG={exportSVG}
                    theme={theme}
                    showStats={true}
                    activeTooltipIndex={activeTooltipIndex}
                    onActiveIndexChange={setActiveTooltipIndex}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 移动端横屏提示弹窗 */}
      {showRotatePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <div className="mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-16 mx-auto text-orange-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">请横屏观看</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              为获得最佳浏览体验，建议将设备旋转至横屏模式
            </p>
            <button
              onClick={() => setShowRotatePrompt(false)}
              className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}