# Currency Swap Form

Một form swap tiền tệ hiện đại và trực quan được xây dựng với Vite.

## Tính năng

- ✅ **Token Selection**: Chọn token từ danh sách với icons từ GitHub
- ✅ **Real-time Exchange Rate**: Tính toán tỷ giá tự động dựa trên API
- ✅ **Input Validation**: Kiểm tra và hiển thị lỗi khi nhập sai
- ✅ **Loading States**: Hiển thị trạng thái loading khi swap
- ✅ **Swap Direction**: Đổi chiều swap với một click
- ✅ **Max Button**: Chọn số tiền tối đa
- ✅ **Responsive Design**: Tối ưu cho mobile và desktop
- ✅ **Modern UI/UX**: Giao diện đẹp với gradient và animations

## Cài đặt

```bash
cd frontend/src/problem2
npm install
```

## Chạy Development Server

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## Build Production

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

## Cấu trúc Project

```
problem2/
├── index.html          # HTML structure
├── style.css           # Styles và animations
├── script.js           # Logic và API integration
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── README.md           # Documentation
```

## API Integration

- **Token Prices**: `https://interview.switcheo.com/prices.json`
- **Token Icons**: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/{SYMBOL}.svg`

## Cách sử dụng

1. Chọn token bạn muốn gửi (You pay)
2. Chọn token bạn muốn nhận (You receive)
3. Nhập số lượng muốn swap
4. Xem tỷ giá tự động được tính toán
5. Click "CONFIRM SWAP" để thực hiện swap
6. Sử dụng nút swap (↕) để đổi chiều
7. Sử dụng nút "MAX" để chọn số tiền tối đa

