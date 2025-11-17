// 个人投资财务统计应用 - 主要JavaScript逻辑

// 全局变量和数据存储
let portfolioData = JSON.parse(localStorage.getItem('portfolioData')) || {
    assets: [
        { id: 1, symbol: 'AAPL', name: '苹果', type: '美股', price: 175.43, shares: 10, currency: 'USD', avgCost: 170.00 },
        { id: 2, symbol: 'MSFT', name: '微软', type: '美股', price: 378.85, shares: 5, currency: 'USD', avgCost: 350.00 },
        { id: 3, symbol: 'BTC', name: '比特币', type: '虚拟货币', price: 43250.00, shares: 0.5, currency: 'USD', avgCost: 40000.00 },
        { id: 4, symbol: 'ETH', name: '以太坊', type: '虚拟货币', price: 2280.00, shares: 2, currency: 'USD', avgCost: 2100.00 },
        { id: 5, symbol: '000001', name: '平安银行', type: 'A股', price: 12.85, shares: 1000, currency: 'CNY', avgCost: 12.00 },
        { id: 6, symbol: '600519', name: '贵州茅台', type: 'A股', price: 1678.50, shares: 10, currency: 'CNY', avgCost: 1600.00 },
        { id: 7, symbol: 'TSLA', name: '特斯拉', type: '美股', price: 238.45, shares: 8, currency: 'USD', avgCost: 250.00 },
        { id: 8, symbol: 'NVDA', name: '英伟达', type: '美股', price: 875.28, shares: 3, currency: 'USD', avgCost: 800.00 }
    ],
    transactions: [
        { id: 1, date: '2024-01-15', symbol: 'AAPL', type: '买入', shares: 10, price: 170.00, amount: 1700, currency: 'USD' },
        { id: 2, symbol: 'MSFT', date: '2024-02-01', type: '买入', shares: 5, price: 350.00, amount: 1750, currency: 'USD' },
        { id: 3, symbol: 'BTC', date: '2024-02-15', type: '买入', shares: 0.5, price: 40000.00, amount: 20000, currency: 'USD' },
        { id: 4, symbol: '000001', date: '2024-03-01', type: '买入', shares: 1000, price: 12.00, amount: 12000, currency: 'CNY' }
    ],
    exchangeRate: 7.15, // USD/CNY汇率
    lastUpdate: new Date().toISOString()
};

// 常用股票/虚拟货币列表
const commonAssets = {
    '美股': [
        { symbol: 'AAPL', name: '苹果' },
        { symbol: 'MSFT', name: '微软' },
        { symbol: 'GOOGL', name: '谷歌' },
        { symbol: 'AMZN', name: '亚马逊' },
        { symbol: 'TSLA', name: '特斯拉' },
        { symbol: 'NVDA', name: '英伟达' },
        { symbol: 'META', name: 'Meta' },
        { symbol: 'NFLX', name: 'Netflix' }
    ],
    'A股': [
        { symbol: '000001', name: '平安银行' },
        { symbol: '600519', name: '贵州茅台' },
        { symbol: '000858', name: '五粮液' },
        { symbol: '600036', name: '招商银行' },
        { symbol: '601318', name: '中国平安' },
        { symbol: '600030', name: '中信证券' },
        { symbol: '000002', name: '万科A' },
        { symbol: '600000', name: '浦发银行' }
    ],
    '虚拟货币': [
        { symbol: 'BTC', name: '比特币' },
        { symbol: 'ETH', name: '以太坊' },
        { symbol: 'USDT', name: '泰达币' },
        { symbol: 'BNB', name: '币安币' },
        { symbol: 'XRP', name: '瑞波币' },
        { symbol: 'ADA', name: '卡尔达诺' },
        { symbol: 'DOGE', name: '狗狗币' },
        { symbol: 'SOL', name: '索拉纳' }
    ]
};

// 初始化应用
function initApp() {
    updatePortfolioDisplay();
    updateExchangeRate();
    startPriceUpdates();
    
    // 添加页面加载动画
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.portfolio-card',
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(100),
            duration: 800,
            easing: 'easeOutQuart'
        });
    }
}

// 更新投资组合显示
function updatePortfolioDisplay() {
    const portfolioTable = document.getElementById('portfolio-table');
    const totalUSDElement = document.getElementById('total-usd');
    const totalCNYElement = document.getElementById('total-cny');
    
    if (!portfolioTable) return;
    
    let totalUSD = 0;
    let totalCNY = 0;
    
    const tbody = portfolioTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    portfolioData.assets.forEach(asset => {
        const currentValue = asset.price * asset.shares;
        const costValue = asset.avgCost * asset.shares;
        const profit = currentValue - costValue;
        const profitPercent = ((currentValue - costValue) / costValue * 100).toFixed(2);
        
        if (asset.currency === 'USD') {
            totalUSD += currentValue;
        } else {
            totalCNY += currentValue;
        }
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                        ${asset.symbol.substring(0, 2)}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${asset.symbol}</div>
                        <div class="text-sm text-gray-500">${asset.name}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900">${asset.type}</td>
            <td class="px-4 py-3 text-sm font-medium">${asset.currency} ${asset.price.toFixed(2)}</td>
            <td class="px-4 py-3 text-sm">${asset.shares}</td>
            <td class="px-4 py-3 text-sm font-medium">${asset.currency} ${currentValue.toFixed(2)}</td>
            <td class="px-4 py-3 text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}">
                ${profit >= 0 ? '+' : ''}${asset.currency} ${profit.toFixed(2)} (${profitPercent}%)
            </td>
            <td class="px-4 py-3">
                <button onclick="editShares(${asset.id})" class="text-blue-600 hover:text-blue-800 mr-2 text-sm">编辑</button>
                <button onclick="removeAsset(${asset.id})" class="text-red-600 hover:text-red-800 text-sm">删除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // 更新总资产显示
    const totalInUSD = totalUSD + (totalCNY / portfolioData.exchangeRate);
    const totalInCNY = totalCNY + (totalUSD * portfolioData.exchangeRate);
    
    if (totalUSDElement) {
        totalUSDElement.textContent = `$${totalInUSD.toFixed(2)}`;
    }
    if (totalCNYElement) {
        totalCNYElement.textContent = `¥${totalInCNY.toFixed(2)}`;
    }
    
    // 更新最后更新时间
    document.getElementById('last-update').textContent = new Date().toLocaleString();
}

// 添加新资产
function addAsset() {
    const symbol = document.getElementById('asset-symbol').value.toUpperCase();
    const type = document.getElementById('asset-type').value;
    const shares = parseFloat(document.getElementById('asset-shares').value);
    const avgCost = parseFloat(document.getElementById('asset-cost').value);
    
    if (!symbol || !shares || !avgCost) {
        alert('请填写完整信息');
        return;
    }
    
    // 查找资产信息
    const assetInfo = commonAssets[type]?.find(asset => asset.symbol === symbol);
    if (!assetInfo) {
        alert('未找到该资产信息，请检查代码是否正确');
        return;
    }
    
    const newAsset = {
        id: Date.now(),
        symbol: symbol,
        name: assetInfo.name,
        type: type,
        price: avgCost, // 初始价格使用买入成本
        shares: shares,
        currency: type === 'A股' ? 'CNY' : 'USD',
        avgCost: avgCost
    };
    
    portfolioData.assets.push(newAsset);
    saveData();
    updatePortfolioDisplay();
    
    // 清空表单
    document.getElementById('asset-symbol').value = '';
    document.getElementById('asset-shares').value = '';
    document.getElementById('asset-cost').value = '';
    
    // 添加成功动画
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.portfolio-table',
            scale: [0.98, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }
}

// 编辑持有份额
function editShares(assetId) {
    const asset = portfolioData.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    const newShares = prompt(`修改 ${asset.symbol} 的持有份额:`, asset.shares);
    if (newShares !== null && !isNaN(newShares) && newShares > 0) {
        asset.shares = parseFloat(newShares);
        saveData();
        updatePortfolioDisplay();
    }
}

// 删除资产
function removeAsset(assetId) {
    if (confirm('确定要删除这个资产吗？')) {
        portfolioData.assets = portfolioData.assets.filter(a => a.id !== assetId);
        saveData();
        updatePortfolioDisplay();
    }
}

// 更新价格（模拟实时数据）
function updatePrices() {
    portfolioData.assets.forEach(asset => {
        // 模拟价格波动 ±2%
        const variation = (Math.random() - 0.5) * 0.04;
        asset.price = asset.price * (1 + variation);
    });
    
    // 模拟汇率小幅波动
    portfolioData.exchangeRate += (Math.random() - 0.5) * 0.02;
    portfolioData.exchangeRate = Math.max(6.8, Math.min(7.2, portfolioData.exchangeRate));
    
    portfolioData.lastUpdate = new Date().toISOString();
    saveData();
    updatePortfolioDisplay();
}

// 更新汇率显示
function updateExchangeRate() {
    const rateElement = document.getElementById('exchange-rate');
    if (rateElement) {
        rateElement.textContent = `1 USD = ${portfolioData.exchangeRate.toFixed(4)} CNY`;
    }
}

// 开始价格自动更新
function startPriceUpdates() {
    // 每30秒更新一次价格
    setInterval(updatePrices, 30000);
    
    // 立即更新一次
    updatePrices();
}

// 保存数据到localStorage
function saveData() {
    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
}

// 获取资产类型选项
function getAssetOptions(type) {
    const options = commonAssets[type] || [];
    return options.map(asset => `<option value="${asset.symbol}">${asset.symbol} - ${asset.name}</option>`).join('');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // 资产类型变化时更新选项
    const assetTypeSelect = document.getElementById('asset-type');
    const assetSymbolSelect = document.getElementById('asset-symbol');
    
    if (assetTypeSelect && assetSymbolSelect) {
        assetTypeSelect.addEventListener('change', function() {
            const type = this.value;
            if (type) {
                assetSymbolSelect.innerHTML = '<option value="">选择资产</option>' + getAssetOptions(type);
            }
        });
    }
    
    // 添加资产按钮事件
    const addAssetBtn = document.getElementById('add-asset-btn');
    if (addAssetBtn) {
        addAssetBtn.addEventListener('click', addAsset);
    }
    
    // 刷新价格按钮事件
    const refreshBtn = document.getElementById('refresh-prices');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            updatePrices();
            if (typeof anime !== 'undefined') {
                anime({
                    targets: '#refresh-prices i',
                    rotate: '360deg',
                    duration: 500,
                    easing: 'easeInOutQuart'
                });
            }
        });
    }
});

// 导出数据功能
function exportData() {
    const dataStr = JSON.stringify(portfolioData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'investment-portfolio.json';
    link.click();
}

// 导入数据功能
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (importedData.assets && importedData.transactions) {
                        portfolioData = importedData;
                        saveData();
                        updatePortfolioDisplay();
                        alert('数据导入成功！');
                    } else {
                        alert('数据格式不正确');
                    }
                } catch (error) {
                    alert('文件解析失败');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}