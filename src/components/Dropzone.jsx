
import React, { useRef, useState } from 'react';
import { detect } from 'jschardet';

export default function Dropzone({ onFileLoaded, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      onError('请选择 HWiNFO64 导出的 CSV 文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target.result;
        const uint8 = new Uint8Array(arrayBuffer);
        
        // jschardet 需要字符串输入，先转成 Latin1 字符串（不改变字节）
        const binaryStr = new TextDecoder('latin1').decode(uint8);
        // 检测文件编码
        const result = detect(binaryStr);
        let encoding = 'utf-8';
        
        if (result.encoding === 'GB2312' || result.encoding === 'GBK' || result.encoding === 'GB18030') {
          encoding = 'gbk';
        } else if (result.encoding === 'UTF-8') {
          encoding = 'utf-8';
        } else {
          // 其他编码默认试 GBK
          encoding = 'gbk';
        }
        
        // 使用检测到的编码解码
        const text = new TextDecoder(encoding).decode(uint8);
        onFileLoaded(text);
      } catch (e) {
        onError('解析文件失败: ' + e.message);
      }
    };
    reader.onerror = () => {
      onError('读取文件失败');
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all
        ${isDragging 
          ? 'border-orange-400 bg-orange-400/10' 
          : 'border-neutral-300 dark:border-neutral-700 hover:border-orange-400 dark:hover:border-orange-400'
        }
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileSelect}
        accept=".csv"
        className="hidden"
      />
      <svg 
        className="mx-auto mb-4 w-16 h-16 text-neutral-400 dark:text-neutral-600" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
        />
      </svg>
      <p className="text-xl font-medium mb-2">拖放HWiNFO64导出的CSV日志文件到这里  或点击选择文件</p>
      <p className="text-neutral-500 dark:text-neutral-500 mb-6"></p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current.click();
          }}
          className="px-6 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors font-medium"
        >
          选择文件
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            // 动态获取 base url，适配开发环境和生产环境
            const base = import.meta.env.BASE_URL;
            fetch(`${base}test.CSV`)
              .then(res => res.text())
              .then(text => onFileLoaded(text))
              .catch(err => onError('加载演示数据失败: ' + err.message));
          }}
          className="px-6 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors font-medium"
        >
          Try the demo
        </button>
      </div>
    </div>
  );
}
