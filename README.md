# phasetida-node-demo
[![GitHub Pages](https://github.com/phasetida/phasetida-node-demo/actions/workflows/pages/pages-build-deployment/badge.svg)](https://phasetida.github.io/phasetida-node-demo/) [![GitHub Pages](https://github.com/phasetida/phasetida-node-demo/actions/workflows/build_deploy.yaml/badge.svg)](https://github.com/phasetida/phasetida-node-demo/tree/demo)   
一个 [phasetida-wasm-core](https://github.com/phasetida/phasetida-wasm-core) 的简单前端实现，使用了Nodejs和Vite

## 构建与运行
### 本地构建
1. 确保设备上安装了Node，如果没有，请先[安装Node](https://nodejs.org/en/download)
2. 克隆这个仓库
   ```bash
   git clone https://github.com/phasetida/phasetida-node-demo
   ```
3. 进入仓库目录，运行
   ```bash
   npm install      # 先安装依赖

   npm run dev      # 运行本地服务器
   npm run build    #...或者构建到dist
   ```

### Github Pages
本仓库具有Github Pages部署 ~~如果不想自己构建，可以来尝尝鲜~~  
[phasetida-node-demo](https://phasetida.github.io/phasetida-node-demo/)

## 注意
本仓库为实验性玩具项目，所以文档十分潦草。  
由于Android WebView对共享缓冲区的限制，本仓库不使用共享缓冲区作为数据交换的方式！  