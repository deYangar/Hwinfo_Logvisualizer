# HWiNFO Log Visualizer

一个由AI堆出来的纯客户端的 HWiNFO CSV 日志可视化工具，一键生成性能图表。复刻自 [logvisualizer.app](https://www.logvisualizer.app)。

# 在线体验

- [Hwinfo_Logvisualizer](https://deyangar.github.io/Hwinfo_Logvisualizer/)

## 功能特性

- 📁 **拖放上传**：直接拖放 HWiNFO 导出的 CSV 文件，也可以点击选择
- 🎯 **Try the demo**：自带演示数据，一键查看效果
- 📊 **智能分组**：按单位自动分组图表，和原网站一致
- 🔍 **传感器搜索**：快速筛选需要的传感器
- 📈 **交互图表**：支持缩放刷选，鼠标悬停显示详细数值，所有图表同步高亮同一时间点
- 📊 **统计信息**：每个图表可以查看每个传感器的最小/最大/平均值
- 🖼️ **导出 PNG**：一键导出当前图表为 PNG 图片分享
- 🌓 **深色/浅色模式**：自动跟随系统，支持手动切换，偏好保存本地
- 📱 **响应式**：移动端自动堆叠，桌面端左右分栏
- 📱 **PWA 支持**：可以添加到桌面作为App打开
- 🔒 **隐私保障**：所有数据处理都在浏览器本地完成，文件不会上传到任何服务器


## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打包生产版本
npm run build
```

打包后的 `dist` 目录可以直接部署到任何静态网站服务器。

## 使用方法

1. 在 HWiNFO64 中导出日志为 CSV 格式
2. 上传/拖放到网站
3. 选择你需要可视化的传感器
4. 分析图表，导出分享

- 基于 React + Vite + Tailwind CSS + Recharts 构建

## 许可

MIT
