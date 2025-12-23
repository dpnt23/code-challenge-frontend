# Phân Tích Code: Computational Inefficiencies và Anti-patterns

## 🔴 CÁC VẤN ĐỀ NGHIÊM TRỌNG (Critical Issues)

### 1. **Lỗi Logic: Biến `lhsPriority` không được định nghĩa**
**Vị trí:** Dòng 30 trong filter function
```typescript
if (lhsPriority > -99) {  // ❌ lhsPriority không tồn tại
```
**Vấn đề:** Code sử dụng `lhsPriority` nhưng biến này chưa được khai báo. Có vẻ như đây là lỗi copy-paste, nên là `balancePriority`.

**Hậu quả:** Code sẽ bị lỗi runtime error khi chạy.

---

### 2. **Logic Filter Sai: Giữ lại balance <= 0 thay vì loại bỏ**
**Vị trí:** Dòng 31-33
```typescript
if (balance.amount <= 0) {
  return true;  // ❌ Giữ lại balance <= 0
}
```
**Vấn đề:** Logic này sẽ **giữ lại** các balance có amount <= 0, trong khi thông thường chúng ta muốn **loại bỏ** chúng.

**Hậu quả:** Hiển thị các balance không hợp lệ (âm hoặc bằng 0).

---

### 3. **Type Safety: `WalletBalance` thiếu property `blockchain`**
**Vị trí:** Dòng 29, 37, 38
```typescript
const balancePriority = getPriority(balance.blockchain);  // ❌ blockchain không có trong interface
```
**Vấn đề:** Interface `WalletBalance` chỉ có `currency` và `amount`, nhưng code đang truy cập `balance.blockchain`.

**Hậu quả:** TypeScript error và runtime error.

---

### 4. **Type Mismatch: `sortedBalances` là `WalletBalance[]` nhưng dùng như `FormattedWalletBalance[]`**
**Vị trí:** Dòng 50
```typescript
const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
  // ❌ sortedBalances không có property 'formatted'
```
**Vấn đề:** `sortedBalances` là mảng `WalletBalance[]` (không có `formatted`), nhưng code cast thành `FormattedWalletBalance` và truy cập `balance.formatted`.

**Hậu quả:** TypeScript error và `balance.formatted` sẽ là `undefined`.

---

### 5. **Sort Function thiếu return 0**
**Vị trí:** Dòng 36-42
```typescript
.sort((lhs: WalletBalance, rhs: WalletBalance) => {
  // ... logic ...
  // ❌ Không return 0 khi bằng nhau
});
```
**Vấn đề:** Khi `leftPriority === rightPriority`, function không return gì (undefined), điều này có thể gây ra hành vi không mong muốn trong sort.

**Hậu quả:** Kết quả sort không ổn định khi có các phần tử có cùng priority.

---

## ⚠️ CÁC VẤN ĐỀ VỀ HIỆU NĂNG (Performance Issues)

### 6. **Gọi `getPriority` nhiều lần không cần thiết**
**Vị trí:** Dòng 29, 37, 38
**Vấn đề:** 
- Trong filter: gọi `getPriority(balance.blockchain)` cho mỗi balance
- Trong sort: gọi lại `getPriority` cho mỗi cặp so sánh
- Tổng cộng có thể gọi hàng trăm lần cho cùng một balance

**Hậu quả:** Lãng phí computation, đặc biệt khi danh sách balance lớn.

**Giải pháp:** Tính priority một lần và lưu vào object, hoặc dùng Map để cache.

---

### 7. **Dependency không cần thiết trong `useMemo`**
**Vị trí:** Dòng 44
```typescript
}, [balances, prices]);  // ❌ prices không được dùng trong computation
```
**Vấn đề:** `prices` được thêm vào dependency array nhưng không được sử dụng trong `useMemo` computation.

**Hậu quả:** `useMemo` sẽ re-compute mỗi khi `prices` thay đổi, dù không cần thiết.

---

### 8. **Tạo `formattedBalances` nhưng không sử dụng**
**Vị trí:** Dòng 46-50
```typescript
const formattedBalances = sortedBalances.map(...)  // ❌ Tạo nhưng không dùng
// ...
const rows = sortedBalances.map(...)  // Dùng sortedBalances thay vì formattedBalances
```
**Vấn đề:** Code tạo `formattedBalances` với property `formatted`, nhưng sau đó lại dùng `sortedBalances` (không có `formatted`) để render.

**Hậu quả:** 
- Lãng phí computation tạo `formattedBalances`
- `balance.formatted` trong rows sẽ là `undefined`

---

### 9. **Tính toán `formatted` nhiều lần**
**Vị trí:** Dòng 46-50, 52
**Vấn đề:** 
- Tính `formatted` trong `formattedBalances` map
- Sau đó trong `rows` map lại tính `balance.amount.toFixed()` (nhưng dùng sai biến)

**Hậu quả:** Duplicate computation.

---

### 10. **Dùng `index` làm key trong React**
**Vị trí:** Dòng 54
```typescript
key={index}  // ❌ Anti-pattern
```
**Vấn đề:** Dùng index làm key là anti-pattern trong React, đặc biệt khi list có thể thay đổi thứ tự.

**Hậu quả:** 
- React có thể re-render sai component
- Mất state của component khi list thay đổi
- Performance kém hơn

**Giải pháp:** Dùng unique identifier như `balance.currency` hoặc kết hợp `currency + blockchain`.

---

## 🟡 CÁC VẤN ĐỀ VỀ CODE QUALITY (Code Quality Issues)

### 11. **Type `any` trong `getPriority`**
**Vị trí:** Dòng 18
```typescript
const getPriority = (blockchain: any): number => {  // ❌ any type
```
**Vấn đề:** Dùng `any` mất đi lợi ích của TypeScript type safety.

**Giải pháp:** Tạo type hoặc enum cho blockchain.

---

### 12. **Function `getPriority` được định nghĩa bên trong component**
**Vị trí:** Dòng 18-28
**Vấn đề:** Function được tạo lại mỗi lần component re-render, mặc dù logic không thay đổi.

**Giải pháp:** Di chuyển ra ngoài component hoặc dùng `useCallback`.

---

### 13. **Thiếu import/định nghĩa `classes`**
**Vị trí:** Dòng 53
```typescript
className={classes.row}  // ❌ classes không được định nghĩa
```
**Vấn đề:** `classes` được sử dụng nhưng không được import hoặc định nghĩa.

**Hậu quả:** Runtime error.

---

### 14. **Thiếu import các dependencies**
**Vị trí:** Toàn bộ file
**Vấn đề:** Thiếu import:
- `React`, `React.FC`
- `BoxProps`
- `useWalletBalances`, `usePrices`
- `WalletRow`
- `useMemo`

---

### 15. **Inconsistent formatting và indentation**
**Vị trí:** Toàn bộ file
**Vấn đề:** Code có indentation không nhất quán (mix tabs và spaces).

---

## 📊 TÓM TẮT

### Critical Issues (5):
1. Biến `lhsPriority` không tồn tại
2. Logic filter sai (giữ balance <= 0)
3. Thiếu property `blockchain` trong interface
4. Type mismatch giữa `WalletBalance` và `FormattedWalletBalance`
5. Sort function thiếu return 0

### Performance Issues (5):
6. Gọi `getPriority` nhiều lần
7. Dependency `prices` không cần thiết trong useMemo
8. Tạo `formattedBalances` nhưng không dùng
9. Tính toán `formatted` duplicate
10. Dùng index làm key

### Code Quality Issues (5):
11. Type `any`
12. Function định nghĩa trong component
13. Thiếu `classes` definition
14. Thiếu imports
15. Inconsistent formatting

**Tổng cộng: 15 vấn đề**

