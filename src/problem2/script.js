// API Configuration
const PRICES_API = 'https://interview.switcheo.com/prices.json';
const TOKEN_ICON_BASE = 'https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/';

// State Management
let tokenPrices = {};
let availableTokens = [];
let fromToken = null;
let toToken = null;
let isLoading = false;
let tokenBalances = {}; // Mock balances for each token
let settings = {
  slippage: 0.5, // Default 0.5% slippage tolerance
  deadline: 20 // Default 20 minute deadline
};
let refreshInterval = null;

// DOM Elements
const elements = {
  form: document.getElementById('swap-form'),
  fromAmount: document.getElementById('from-amount'),
  toAmount: document.getElementById('to-amount'),
  fromTokenSelector: document.getElementById('from-token-selector'),
  toTokenSelector: document.getElementById('to-token-selector'),
  fromTokenIcon: document.getElementById('from-token-icon'),
  fromTokenSymbol: document.getElementById('from-token-symbol'),
  toTokenIcon: document.getElementById('to-token-icon'),
  toTokenSymbol: document.getElementById('to-token-symbol'),
  fromBalance: document.getElementById('from-balance'),
  toBalance: document.getElementById('to-balance'),
  fromError: document.getElementById('from-error'),
  toError: document.getElementById('to-error'),
  submitBtn: document.getElementById('submit-btn'),
  btnText: document.querySelector('.btn-text'),
  btnLoader: document.querySelector('.btn-loader'),
  swapDirectionBtn: document.getElementById('swap-direction-btn'),
  exchangeRateInfo: document.getElementById('exchange-rate-info'),
  exchangeRate: document.getElementById('exchange-rate'),
  tokenModal: document.getElementById('token-modal'),
  modalTitle: document.getElementById('modal-title'),
  modalClose: document.getElementById('modal-close'),
  tokenSearch: document.getElementById('token-search'),
  tokenList: document.getElementById('token-list'),
  maxFromBtn: document.getElementById('max-from-btn'),
  settingsBtn: document.getElementById('settings-btn')
};

let currentModalType = null; // 'from' or 'to'

// Initialize App
async function init() {
  try {
    await loadTokenPrices();
    setupEventListeners();
    updateSubmitButton();
    // Set up auto-refresh every 30 seconds
    refreshInterval = setInterval(loadTokenPrices, 30000);
  } catch (error) {
    // Show user-friendly error message
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: var(--error); color: white; padding: 16px; border-radius: 8px; z-index: 10000; max-width: 300px;';
    errorMsg.textContent = 'Failed to load token prices. Please check your connection.';
    document.body.appendChild(errorMsg);
    setTimeout(() => errorMsg.remove(), 5000);
  }
}

// Load token prices from API
async function loadTokenPrices() {
  try {
    const response = await fetch(PRICES_API, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add cache control to avoid stale data
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle different data formats
    if (Array.isArray(data)) {
      // If API returns array, convert to object
      // API format: [{currency: 'BLUR', price: 0.208, date: '...'}, ...]
      tokenPrices = {};
      data.forEach(item => {
        if (item && item.price) {
          // Support both 'currency' and 'symbol' field names
          const symbol = item.currency || item.symbol;
          if (symbol) {
            tokenPrices[symbol] = item.price;
          }
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      // Direct object format: {BTC: 50000, ETH: 3000, ...}
      tokenPrices = data;
    } else {
      throw new Error('Invalid data format from API');
    }

    // Filter tokens that have prices and create token list
    const tokenKeys = Object.keys(tokenPrices);

    availableTokens = tokenKeys
      .map(token => {
        const price = tokenPrices[token];
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return {
          symbol: token,
          price: numPrice,
          rawPrice: price
        };
      })
      .filter(token => {
        // Accept tokens with valid numeric prices > 0
        const isValid = !isNaN(token.price) &&
                       isFinite(token.price) &&
                       token.price > 0;
        return isValid;
      })
      .map(token => {
        // Generate mock balance for each token
        const balance = generateMockBalance(token.symbol, token.price);
        tokenBalances[token.symbol] = balance;
        return {
          symbol: token.symbol,
          price: token.price,
          icon: `${TOKEN_ICON_BASE}${token.symbol}.svg`
        };
      })
      .sort((a, b) => a.symbol.localeCompare(b.symbol));

    if (availableTokens.length === 0) {
      if (elements.tokenList) {
        elements.tokenList.innerHTML = `
          <div class="no-tokens">
            <p>No tokens available</p>
            <p style="font-size: 12px; margin-top: 8px; color: var(--text-muted);">
              Failed to load tokens. Please check your connection and refresh the page.
            </p>
          </div>
        `;
      }
    } else {
      renderTokenList();
    }

    // Update balances if tokens are selected
    if (fromToken) {
      updateFromTokenDisplay();
    }
    if (toToken) {
      updateToTokenDisplay();
    }
  } catch (error) {
    if (elements.tokenList) {
      elements.tokenList.innerHTML = `
        <div class="no-tokens">
          <p>Error loading tokens</p>
          <p style="font-size: 12px; margin-top: 8px; color: var(--error);">
            ${error.message}
          </p>
        </div>
      `;
    }
    throw error;
  }
}

// Generate mock balance for a token
function generateMockBalance(symbol, price) {
  // Generate random balance based on price to keep realistic values
  // Higher price tokens have lower amounts, lower price tokens have higher amounts
  const baseAmount = price > 100 ? Math.random() * 10 :
                     price > 10 ? Math.random() * 100 :
                     price > 1 ? Math.random() * 1000 :
                     Math.random() * 10000;

  // Round to reasonable precision based on price
  if (price > 100) {
    return parseFloat(baseAmount.toFixed(4));
  } else if (price > 10) {
    return parseFloat(baseAmount.toFixed(2));
  } else if (price > 1) {
    return parseFloat(baseAmount.toFixed(1));
  }
  return parseFloat(baseAmount.toFixed(0));
}

// Setup event listeners
function setupEventListeners() {
  // Token selector clicks
  elements.fromTokenSelector.addEventListener('click', () => openTokenModal('from'));
  elements.toTokenSelector.addEventListener('click', () => openTokenModal('to'));

  // Settings button
  elements.settingsBtn.addEventListener('click', openSettingsModal);

  // Modal close
  elements.modalClose.addEventListener('click', closeTokenModal);
  elements.tokenModal.addEventListener('click', (e) => {
    if (e.target === elements.tokenModal) closeTokenModal();
  });

  // Token search
  elements.tokenSearch.addEventListener('input', handleTokenSearch);

  // Amount inputs
  elements.fromAmount.addEventListener('input', handleFromAmountChange);
  elements.fromAmount.addEventListener('blur', validateFromAmount);

  // Swap direction button
  elements.swapDirectionBtn.addEventListener('click', swapTokens);

  // Max button
  elements.maxFromBtn.addEventListener('click', setMaxAmount);

  // Form submit
  elements.form.addEventListener('submit', handleSubmit);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTokenModal();
      closeSettingsModal();
    }
  });
}

// Open token selection modal
function openTokenModal(type) {
  if (availableTokens.length === 0) {
    // Try to reload tokens
    loadTokenPrices().catch(() => {});
    return;
  }

  currentModalType = type;
  elements.modalTitle.textContent = `Select ${type === 'from' ? 'token to pay' : 'token to receive'}`;
  elements.tokenModal.style.display = 'flex';
  elements.tokenSearch.value = '';
  renderTokenList();
  setTimeout(() => elements.tokenSearch.focus(), 100);
}

// Close token selection modal
function closeTokenModal() {
  elements.tokenModal.style.display = 'none';
  currentModalType = null;
  elements.tokenSearch.value = '';
}

// Handle token search
function handleTokenSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  renderTokenList(query);
}

// Render token list in modal
function renderTokenList(searchQuery = '') {
  if (!elements.tokenList) {
    return;
  }

  // If no tokens loaded at all
  if (availableTokens.length === 0) {
    elements.tokenList.innerHTML = `
      <div class="no-tokens">
        <p>No tokens available</p>
        <p style="font-size: 12px; margin-top: 8px; color: var(--text-muted);">
          Please wait while we load tokens...
        </p>
      </div>
    `;
    return;
  }
  
  const filtered = searchQuery
    ? availableTokens.filter(token => 
        token.symbol.toLowerCase().includes(searchQuery)
      )
    : availableTokens;
  
  if (filtered.length === 0) {
    elements.tokenList.innerHTML = `
      <div class="no-tokens">
        <p>No tokens found</p>
        <p style="font-size: 12px; margin-top: 8px; color: var(--text-muted);">
          ${searchQuery ? `No tokens match "${searchQuery}"` : 'Try refreshing the page'}
        </p>
      </div>
    `;
    return;
  }
  
  elements.tokenList.innerHTML = filtered.map(token => {
    const isSelected = (currentModalType === 'from' && fromToken?.symbol === token.symbol) ||
                       (currentModalType === 'to' && toToken?.symbol === token.symbol);
    
    return `
      <div class="token-item ${isSelected ? 'selected' : ''}" data-symbol="${token.symbol}">
        <img src="${token.icon}" alt="${token.symbol}" class="token-item-icon" 
             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22%3E%3Ccircle cx=%2212%22 cy=%2212%22 r=%2210%22 fill=%22%236366f1%22/%3E%3Ctext x=%2212%22 y=%2216%22 font-size=%2212%22 fill=%22white%22 text-anchor=%22middle%22%3E${token.symbol[0]}%3C/text%3E%3C/svg%3E'">
        <div class="token-item-info">
          <div class="token-item-name">${token.symbol}</div>
          <div class="token-item-symbol">$${formatNumber(token.price)}</div>
        </div>
        <div class="token-item-price">$${formatNumber(token.price)}</div>
      </div>
    `;
  }).join('');
  
  // Add click listeners
  elements.tokenList.querySelectorAll('.token-item').forEach(item => {
    item.addEventListener('click', () => selectToken(item.dataset.symbol));
  });
}

// Select a token
function selectToken(symbol) {
  const token = availableTokens.find(t => t.symbol === symbol);
  if (!token) return;
  
  if (currentModalType === 'from') {
    if (toToken?.symbol === symbol) {
      showError('Cannot select the same token', 'from');
      return;
    }
    fromToken = token;
    updateFromTokenDisplay();
  } else {
    if (fromToken?.symbol === symbol) {
      showError('Cannot select the same token', 'to');
      return;
    }
    toToken = token;
    updateToTokenDisplay();
  }
  
  closeTokenModal();
  updateExchangeRate();
  updateSubmitButton();
  calculateToAmount();
}

// Update from token display
function updateFromTokenDisplay() {
  if (!fromToken) {
    elements.fromTokenIcon.style.display = 'none';
    elements.fromTokenSymbol.textContent = 'Select';
    elements.fromBalance.textContent = '0.00';
    return;
  }

  elements.fromTokenIcon.src = fromToken.icon;
  elements.fromTokenIcon.alt = fromToken.symbol;
  elements.fromTokenIcon.style.display = 'block';
  elements.fromTokenIcon.onerror = function() {
    this.style.display = 'none';
  };
  elements.fromTokenSymbol.textContent = fromToken.symbol;
  // Use mock balance
  const balance = tokenBalances[fromToken.symbol] || 0;
  elements.fromBalance.textContent = formatNumber(balance, balance > 100 ? 2 : 4);
}

// Update to token display
function updateToTokenDisplay() {
  if (!toToken) {
    elements.toTokenIcon.style.display = 'none';
    elements.toTokenSymbol.textContent = 'Select';
    elements.toBalance.textContent = '0.00';
    return;
  }

  elements.toTokenIcon.src = toToken.icon;
  elements.toTokenIcon.alt = toToken.symbol;
  elements.toTokenIcon.style.display = 'block';
  elements.toTokenIcon.onerror = function() {
    this.style.display = 'none';
  };
  elements.toTokenSymbol.textContent = toToken.symbol;
  // Use mock balance
  const balance = tokenBalances[toToken.symbol] || 0;
  elements.toBalance.textContent = formatNumber(balance, balance > 100 ? 2 : 4);
}

// Handle from amount change
function handleFromAmountChange(e) {
  const value = parseFloat(e.target.value);
  clearError('from');
  
  if (isNaN(value) || value <= 0) {
    elements.toAmount.value = '';
    elements.exchangeRateInfo.style.display = 'none';
    updateSubmitButton();
    return;
  }
  
  calculateToAmount();
  updateExchangeRate();
  updateSubmitButton();
}

// Calculate to amount based on exchange rate
function calculateToAmount() {
  if (!fromToken || !toToken || !elements.fromAmount.value) {
    elements.toAmount.value = '';
    updateSubmitButton();
    return;
  }
  
  const fromAmount = parseFloat(elements.fromAmount.value);
  if (isNaN(fromAmount) || fromAmount <= 0) {
    elements.toAmount.value = '';
    updateSubmitButton();
    return;
  }
  
  const fromPrice = tokenPrices[fromToken.symbol];
  const toPrice = tokenPrices[toToken.symbol];
  
  if (!fromPrice || !toPrice) {
    elements.toAmount.value = '';
    updateSubmitButton();
    return;
  }
  
  // Calculate: (fromAmount * fromPrice) / toPrice
  const toAmount = (fromAmount * fromPrice) / toPrice;
  elements.toAmount.value = formatNumber(toAmount, 6);
  updateSubmitButton();
}

// Update exchange rate display
function updateExchangeRate() {
  if (!fromToken || !toToken) {
    elements.exchangeRateInfo.style.display = 'none';
    return;
  }
  
  const fromPrice = tokenPrices[fromToken.symbol];
  const toPrice = tokenPrices[toToken.symbol];
  
  if (!fromPrice || !toPrice) {
    elements.exchangeRateInfo.style.display = 'none';
    return;
  }
  
  const rate = toPrice / fromPrice;
  elements.exchangeRate.textContent = `1 ${fromToken.symbol} = ${formatNumber(rate, 6)} ${toToken.symbol}`;
  elements.exchangeRateInfo.style.display = 'block';
}

// Validate from amount
function validateFromAmount() {
  const value = parseFloat(elements.fromAmount.value);
  
  if (!elements.fromAmount.value) {
    clearError('from');
    updateSubmitButton();
    return;
  }
  
  if (isNaN(value) || value <= 0) {
    showError('Please enter a valid amount', 'from');
    return;
  }
  
  // Check balance (simulated)
  const balance = parseFloat(elements.fromBalance.textContent);
  if (value > balance && balance > 0) {
    showError('Insufficient balance', 'from');
    return;
  }
  
  clearError('from');
  updateSubmitButton();
}

// Swap tokens
function swapTokens() {
  if (!fromToken || !toToken) return;
  
  const tempToken = fromToken;
  const tempAmount = elements.fromAmount.value;
  
  fromToken = toToken;
  toToken = tempToken;
  
  updateFromTokenDisplay();
  updateToTokenDisplay();
  
  elements.fromAmount.value = elements.toAmount.value;
  calculateToAmount();
  updateExchangeRate();
  clearError('from');
  clearError('to');
}

// Set max amount
function setMaxAmount() {
  if (!fromToken) return;
  
  const balance = parseFloat(elements.fromBalance.textContent) || 0;
  if (balance > 0) {
    elements.fromAmount.value = balance.toString();
    calculateToAmount();
    updateExchangeRate();
    validateFromAmount();
  }
}

// Update submit button state
function updateSubmitButton() {
  const hasTokens = fromToken && toToken;
  const hasAmount = elements.fromAmount.value && parseFloat(elements.fromAmount.value) > 0;
  const hasError = elements.fromError.classList.contains('show');
  
  if (!hasTokens) {
    elements.submitBtn.disabled = true;
    elements.btnText.textContent = 'Select tokens to swap';
  } else if (!hasAmount) {
    elements.submitBtn.disabled = true;
    elements.btnText.textContent = 'Enter an amount';
  } else if (hasError) {
    elements.submitBtn.disabled = true;
    elements.btnText.textContent = 'Fix errors to continue';
  } else {
    elements.submitBtn.disabled = false;
    elements.btnText.textContent = 'CONFIRM SWAP';
  }
}

// Handle form submit
async function handleSubmit(e) {
  e.preventDefault();
  
  if (isLoading) return;
  
  const fromAmount = parseFloat(elements.fromAmount.value);
  if (!fromToken || !toToken || !fromAmount || fromAmount <= 0) {
    return;
  }
  
  // Validate
  validateFromAmount();
  if (elements.fromError.classList.contains('show')) {
    updateSubmitButton();
    return;
  }
  
  // Show loading state
  isLoading = true;
  elements.submitBtn.disabled = true;
  elements.btnText.style.display = 'none';
  elements.btnLoader.style.display = 'block';
  
  // Simulate API call with delay
  try {
    await simulateSwap();
    
    // Success - reset form
    setTimeout(() => {
      showSuccessMessage();
      resetForm();
    }, 500);
  } catch (error) {
    showError('Swap failed. Please try again.', 'from');
  } finally {
    isLoading = false;
    elements.btnText.style.display = 'block';
    elements.btnLoader.style.display = 'none';
    updateSubmitButton();
  }
}

// Simulate swap API call
function simulateSwap() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        resolve();
      } else {
        reject(new Error('Swap failed'));
      }
    }, 2000);
  });
}

// Show success message
function showSuccessMessage() {
  const originalText = elements.btnText.textContent;
  elements.btnText.textContent = 'Swap successful! ✓';
  elements.submitBtn.style.background = 'var(--success)';
  
  setTimeout(() => {
    elements.btnText.textContent = originalText;
    elements.submitBtn.style.background = '';
  }, 2000);
}

// Reset form
function resetForm() {
  elements.fromAmount.value = '';
  elements.toAmount.value = '';
  elements.exchangeRateInfo.style.display = 'none';
  clearError('from');
  clearError('to');
}

// Open settings modal
function openSettingsModal() {
  const settingsModal = document.getElementById('settings-modal');
  if (!settingsModal) return;

  settingsModal.style.display = 'flex';

  // Set current values
  const slippageBtns = document.querySelectorAll('.slippage-btn');
  const customSlippage = document.getElementById('custom-slippage');
  const deadlineInput = document.getElementById('deadline-input');

  // Set slippage buttons state
  slippageBtns.forEach(btn => {
    const value = parseFloat(btn.dataset.value);
    if (value === settings.slippage) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Set custom slippage
  if (![0.1, 0.5, 1].includes(settings.slippage)) {
    customSlippage.value = settings.slippage.toString();
    customSlippage.disabled = false;
    slippageBtns.forEach(btn => btn.classList.remove('active'));
  } else {
    customSlippage.value = '';
    customSlippage.disabled = true;
  }

  // Set deadline
  deadlineInput.value = settings.deadline.toString();

  // Remove old event listeners
  slippageBtns.forEach(btn => {
    btn.onclick = null;
  });
  customSlippage.oninput = null;
  deadlineInput.oninput = null;

  // Add event listeners for slippage buttons
  slippageBtns.forEach(btn => {
    btn.onclick = function() {
      const value = parseFloat(this.dataset.value);
      settings.slippage = value;
      customSlippage.value = '';
      customSlippage.disabled = true;

      slippageBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    };
  });

  // Add event listener for custom slippage
  customSlippage.oninput = function() {
    const value = parseFloat(this.value);
    if (!isNaN(value) && value >= 0 && value <= 50) {
      settings.slippage = value;
      customSlippage.disabled = false;
      slippageBtns.forEach(b => b.classList.remove('active'));
    }
  };

  // Add event listener for deadline
  deadlineInput.oninput = function() {
    const value = parseInt(this.value);
    if (!isNaN(value) && value >= 1 && value <= 60) {
      settings.deadline = value;
    }
  };

  // Add close button event listener
  const settingsClose = document.getElementById('settings-close');
  if (settingsClose) {
    settingsClose.onclick = closeSettingsModal;
  }

  // Click outside to close
  settingsModal.onclick = function(e) {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  };
}

// Close settings modal
function closeSettingsModal() {
  const settingsModal = document.getElementById('settings-modal');
  if (!settingsModal) return;
  settingsModal.style.display = 'none';

  // Remove event listeners
  const settingsClose = document.getElementById('settings-close');
  if (settingsClose) {
    settingsClose.onclick = null;
  }
  settingsModal.onclick = null;
}

// Show error message
function showError(message, type = 'from') {
  const errorElement = type === 'from' ? elements.fromError : elements.toError;
  errorElement.textContent = message;
  errorElement.classList.add('show');
  updateSubmitButton();
}

// Clear error message
function clearError(type = 'from') {
  const errorElement = type === 'from' ? elements.fromError : elements.toError;
  errorElement.classList.remove('show');
  errorElement.textContent = '';
  updateSubmitButton();
}

// Format number
function formatNumber(num, decimals = 2) {
  if (isNaN(num)) return '0';
  return parseFloat(num.toFixed(decimals)).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

