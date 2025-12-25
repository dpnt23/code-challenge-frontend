# Currency Swap Form

A modern and intuitive currency swap form built with Vite.

## Features

- ✅ **Token Selection**: Select tokens from a list with icons from GitHub
- ✅ **Real-time Exchange Rate**: Automatically calculates exchange rates based on API
- ✅ **Auto-refresh Prices**: Automatically updates token prices every 30 seconds
- ✅ **Mock Balances**: Displays realistic mock token balances
- ✅ **Input Validation**: Validates inputs and shows error messages
- ✅ **Loading States**: Shows loading indicator during swap
- ✅ **Swap Direction**: Swap direction with one click
- ✅ **Max Button**: Select maximum amount
- ✅ **Settings Modal**: Customize slippage tolerance and transaction deadline
- ✅ **Responsive Design**: Optimized for mobile and desktop
- ✅ **Modern UI/UX**: Beautiful interface with gradients and animations

## Installation

```bash
cd frontend/src/problem2
npm install
```

## Development Server

```bash
npm run dev
```

Server will run at `http://localhost:3000`

## Production Build

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Project Structure

```
problem2/
├── index.html          # HTML structure
├── style.css           # Styles and animations
├── script.js           # Logic and API integration
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── README.md           # Documentation
```

## API Integration

- **Token Prices**: `https://interview.switcheo.com/prices.json`
- **Token Icons**: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/{SYMBOL}.svg`

## How to Use

1. Select the token you want to send (You pay)
2. Select the token you want to receive (You receive)
3. Enter the amount you want to swap
4. View the automatically calculated exchange rate
5. Click "CONFIRM SWAP" to execute the swap
6. Use the swap button (↕) to swap direction
7. Use the "MAX" button to select maximum amount
8. Click the ⚙️ icon (Settings) to customize slippage and deadline

## Features Detail

### Auto-refresh Prices
Prices automatically reload every 30 seconds to ensure exchange rates are always up to date.

### Mock Balances
Each token has a mock balance based on its value:
- High value tokens (>$100): 0-10 tokens
- Medium value tokens ($10-$100): 0-100 tokens
- Low value tokens ($1-$10): 0-1000 tokens
- Very low value tokens (<$1): 0-10000 tokens

### Settings Modal
- **Slippage Tolerance**: Choose from 0.1%, 0.5%, 1% or custom (0-50%)
- **Transaction Deadline**: Maximum time for transaction (1-60 minutes)

