// 智能投资管理 - 价格获取与显示系统
// 支持股票、加密货币、汇率实时获取

class PriceManager {
    constructor() {
        this.exchangeRate = 7.15;
        this.portfolio = this.loadPortfolio();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.fetchAllPrices();
        // 每30秒自动刷新
        setInterval(() => this.fetchAllPrices(), 30000);
    }

    setupEventListeners() {
        // 刷新按钮
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.fetchAllPrices();
        });

        // 标签切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // 模态框
        const modal = document.getElementById('addAssetModal');
        document.getElementById('addAssetBtn').addEventListener('click', () => {
            modal.style.display = 'flex';
        });
        document.getElementById('closeModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        document.getElementById('cancelBtn').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // 添加资产表单
        document.getElementById('addAssetForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAsset();
        });
    }

    // 获取汇率
    async getExchangeRate() {
        try {
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            return data.rates.CNY || 7.15;
        } catch (error) {
            console.warn('汇率获取失败，使用默认值');
            return 7.15;
        }
    }

    // 获取股票价格
    async getStockPrices(symbols) {
        const prices = {};
        
        for (const symbol of symbols) {
            try {
                // 使用 Yahoo Finance API
                const response = await fetch(
                    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
                );
                const data = await response.json();
                
                if (data.chart && data.chart.result && data.chart.result[0]) {
                    prices[symbol] = data.chart.result[0].meta.regularMarketPrice || 0;
                } else {
                    prices[symbol] = 0;
                }
            } catch (error) {
                console.warn(`股票 ${symbol} 价格获取失败`);
                prices[symbol] = 0;
            }
        }
        
        return prices;
    }

    // 获取加密货币价格
    async getCryptoPrices(symbols) {
        try {
            const ids = symbols.map(s => s.toLowerCase()).join(',');
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
            );
            const data = await response.json();
            
            const prices = {};
            symbols.forEach(symbol => {
                prices[symbol] = data[symbol.toLowerCase()]?.usd || 0;
            });
            
            return prices;
        } catch (error) {
            console.warn('加密货币价格获取失败');
            const prices = {};
            symbols.forEach(symbol => {
                prices[symbol] = 0;
            });
            return prices;
        }
    }

    // 获取基金价格（简化版）
    async getFundPrices(symbols) {
        const prices = {};
        
        for (const symbol of symbols) {
            try {
                // 这里使用模拟数据，实际应用中需要接入基金API
                prices[symbol] = Math.random() * 10 + 1; // 模拟价格
            } catch (error) {
                prices[symbol] = 0;
            }
        }
        
        return prices;
    }

    // 获取所有价格
    async fetchAllPrices() {
        try {
            this.showLoading();
            
            // 获取汇率
            this.exchangeRate = await this.getExchangeRate();
            
            // 获取各类资产价格
            const stockSymbols = this.getSymbolsByType('stock');
            const cryptoSymbols = this.getSymbolsByType('crypto');
            const fundSymbols = this.getSymbolsByType('fund');
            
            const [stockPrices, cryptoPrices, fundPrices] = await Promise.all([
                this.getStockPrices(stockSymbols),
                this.getCryptoPrices(cryptoSymbols),
                this.getFundPrices(fundSymbols)
            ]);
            
            // 更新显示
            this.updateDisplay(stockPrices, cryptoPrices, fundPrices);
            this.updateLastUpdateTime();
            this.hideLoading();
            
        } catch (error) {
            console.error('价格获取失败:', error);
            this.showError('价格获取失败，请检查网络连接');
            this.hideLoading();
        }
    }

    // 获取指定类型的资产代码
    getSymbolsByType(type) {
        return this.portfolio
            .filter(asset => asset.type === type)
            .map(asset => asset.symbol);
    }

    // 更新显示
    updateDisplay(stockPrices, cryptoPrices, fundPrices) {
        // 计算总资产
        let totalUSD = 0;
        
        // 计算各类资产价值
        this.portfolio.forEach(asset => {
            let price = 0;
            switch (asset.type) {
                case 'stock':
                    price = stockPrices[asset.symbol] || 0;
                    break;
                case 'crypto':
                    price = cryptoPrices[asset.symbol] || 0;
                    break;
                case 'fund':
                    price = fundPrices[asset.symbol] || 0;
                    break;
            }
            totalUSD += price * asset.quantity;
        });
        
        const totalCNY = totalUSD * this.exchangeRate;
        
        // 更新总资产显示
        document.getElementById('totalUSD').innerHTML = `$${totalUSD.toFixed(2)}`;
        document.getElementById('totalCNY').innerHTML = `¥${totalCNY.toFixed(2)}`;
        document.getElementById('exchangeRate').innerHTML = `${this.exchangeRate.toFixed(4)}`;
        document.getElementById('rateDisplay').textContent = `1 USD = ${this.exchangeRate.toFixed(4)} CNY`;
        
        // 更新投资组合显示
        this.updatePortfolioDisplay(stockPrices, cryptoPrices, fundPrices);
        
        // 更新状态指示器
        this.updateStatusIndicator(true);
    }

    // 更新投资组合显示
    updatePortfolioDisplay(stockPrices, cryptoPrices, fundPrices) {
        // 更新股票组合
        const stockPortfolio = document.getElementById('stockPortfolio');
        const stockAssets = this.portfolio.filter(asset => asset.type === 'stock');
        
        if (stockAssets.length === 0) {
            stockPortfolio.innerHTML = '<div class="empty-portfolio">暂无股票资产</div>';
        } else {
            stockPortfolio.innerHTML = stockAssets.map(asset => {
                const currentPrice = stockPrices[asset.symbol] || 0;
                const totalValue = currentPrice * asset.quantity;
                const profit = (currentPrice - asset.cost) * asset.quantity;
                const profitPercent = ((currentPrice - asset.cost) / asset.cost * 100);
                
                return `
                    <div class="portfolio-item">
                        <div class="item-header">
                            <h4>${asset.symbol}</h4>
                            <span class="item-type">股票</span>
                        </div>
                        <div class="item-details">
                            <div class="detail-row">
                                <span>当前价格:</span>
                                <span class="price">$${currentPrice.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span>持有数量:</span>
                                <span>${asset.quantity}</span>
                            </div>
                            <div class="detail-row">
                                <span>总市值:</span>
                                <span class="total-value">$${totalValue.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span>盈亏:</span>
                                <span class="${profit >= 0 ? 'profit' : 'loss'}">
                                    ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // 更新加密货币组合
        const cryptoPortfolio = document.getElementById('cryptoPortfolio');
        const cryptoAssets = this.portfolio.filter(asset => asset.type === 'crypto');
        
        if (cryptoAssets.length === 0) {
            cryptoPortfolio.innerHTML = '<div class="empty-portfolio">暂无加密货币资产</div>';
        } else {
            cryptoPortfolio.innerHTML = cryptoAssets.map(asset => {
                const currentPrice = cryptoPrices[asset.symbol] || 0;
                const totalValue = currentPrice * asset.quantity;
                const profit = (currentPrice - asset.cost) * asset.quantity;
                const profitPercent = asset.cost > 0 ? ((currentPrice - asset.cost) / asset.cost * 100) : 0;
                
                return `
                    <div class="portfolio-item">
                        <div class="item-header">
                            <h4>${asset.symbol}</h4>
                            <span class="item-type">加密货币</span>
                        </div>
                        <div class="item-details">
                            <div class="detail-row">
                                <span>当前价格:</span>
                                <span class="price">$${currentPrice.toFixed(4)}</span>
                            </div>
                            <div class="detail-row">
                                <span>持有数量:</span>
                                <span>${asset.quantity}</span>
                            </div>
                            <div class="detail-row">
                                <span>总市值:</span>
                                <span class="total-value">$${totalValue.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span>盈亏:</span>
                                <span class="${profit >= 0 ? 'profit' : 'loss'}">
                                    ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // 更新基金组合
        const fundPortfolio = document.getElementById('fundPortfolio');
        const fundAssets = this.portfolio.filter(asset => asset.type === 'fund');
        
        if (fundAssets.length === 0) {
            fundPortfolio.innerHTML = '<div class="empty-portfolio">暂无基金资产</div>';
        } else {
            fundPortfolio.innerHTML = fundAssets.map(asset => {
                const currentPrice = fundPrices[asset.symbol] || 0;
                const totalValue = currentPrice * asset.quantity;
                const profit = (currentPrice - asset.cost) * asset.quantity;
                const profitPercent = asset.cost > 0 ? ((currentPrice - asset.cost) / asset.cost * 100) : 0;
                
                return `
                    <div class="portfolio-item">
                        <div class="item-header">
                            <h4>${asset.symbol}</h4>
                            <span class="item-type">基金</span>
                        </div>
                        <div class="item-details">
                            <div class="detail-row">
                                <span>当前价格:</span>
                                <span class="price">¥${currentPrice.toFixed(4)}</span>
                            </div>
                            <div class="detail-row">
                                <span>持有数量:</span>
                                <span>${asset.quantity}</span>
                            </div>
                            <div class="detail-row">
                                <span>总市值:</span>
                                <span class="total-value">¥${totalValue.toFixed(2)}</span>
                            </div>
                            <div class="detail-row">
                                <span>盈亏:</span>
                                <span class="${profit >= 0 ? 'profit' : 'loss'}">
                                    ${profit >= 0 ? '+' : ''}¥${profit.toFixed(2)} (${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // 切换标签
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // 更新内容显示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    // 添加资产
    addAsset() {
        const type = document.getElementById('assetType').value;
        const symbol = document.getElementById('assetSymbol').value.toUpperCase();
        const quantity = parseFloat(document.getElementById('assetQuantity').value);
        const cost = parseFloat(document.getElementById('assetCost').value);
        
        if (!type || !symbol || !quantity || !cost) {
            this.showError('请填写完整信息');
            return;
        }
        
        // 添加到投资组合
        this.portfolio.push({
            type,
            symbol,
            quantity,
            cost,
            id: Date.now()
        });
        
        // 保存到本地存储
        this.savePortfolio();
        
        // 关闭模态框
        document.getElementById('addAssetModal').style.display = 'none';
        
        // 清空表单
        document.getElementById('addAssetForm').reset();
        
        // 重新获取价格
        this.fetchAllPrices();
        
        this.showSuccess('资产添加成功');
    }

    // 本地存储管理
    loadPortfolio() {
        const saved = localStorage.getItem('investmentPortfolio');
        return saved ? JSON.parse(saved) : [];
    }

    savePortfolio() {
        localStorage.setItem('investmentPortfolio', JSON.stringify(this.portfolio));
    }

    // UI 辅助函数
    showLoading() {
        document.querySelectorAll('.asset-value').forEach(el => {
            if (!el.querySelector('.loading-spinner')) {
                el.innerHTML = '<div class="loading-spinner"></div>';
            }
        });
    }

    hideLoading() {
        document.querySelectorAll('.loading-spinner').forEach(spinner => {
            spinner.remove();
        });
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN');
        document.getElementById('lastUpdate').textContent = `最后更新: ${timeString}`;
    }

    updateStatusIndicator(connected) {
        const indicator = document.querySelector('.status-indicator');
        const statusText = document.getElementById('rateStatus');
        
        if (connected) {
            indicator.classList.add('connected');
            indicator.classList.remove('disconnected');
            statusText.innerHTML = '<i class="fas fa-circle status-indicator connected"></i> 已连接';
        } else {
            indicator.classList.add('disconnected');
            indicator.classList.remove('connected');
            statusText.innerHTML = '<i class="fas fa-circle status-indicator disconnected"></i> 连接失败';
        }
    }

    showError(message) {
        const toast = document.getElementById('errorToast');
        document.getElementById('errorMessage').textContent = message;
        toast.style.display = 'flex';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    showSuccess(message) {
        // 创建成功提示
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new PriceManager();
});
