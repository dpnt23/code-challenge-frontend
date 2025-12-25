# Problem 3: Messy React - Detailed Analysis

## 1. Critical Issues Identified

### Issue 1: Incorrect Filter Logic (CRITICAL)
**Location**: Line 29-35 inside `useMemo` filter function

```tsx
const sortedBalances = useMemo(() => {
  return balances.filter((balance: WalletBalance) => {
    const balancePriority = getPriority(balance.blockchain);
    if (lhsPriority > -99) {  // ❌ lhsPriority is undefined
      if (balance.amount <= 0) {
        return true;
      }
    }
    return false
  })
}, [balances, prices]);
```

**Problems:**
- `lhsPriority` variable is never defined, causes runtime error
- Logic is inverted: it returns `true` when `amount <= 0` (should filter out zero/negative amounts)
- Code silently fails to filter as intended

**Impact**: Component will crash at runtime or silently include/exclude wrong balances

---

### Issue 2: Type Safety Violation with `any` (CRITICAL)
**Location**: Line 25

```tsx
const getPriority = (blockchain: any): number => {
```

**Problems:**
- Using `any` defeats TypeScript's purpose
- No compile-time validation of blockchain strings
- Can lead to runtime bugs with typos (e.g., 'Ethereum' vs 'Ethereum')

**Better approach**: Use union type or enum
```tsx
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo' | string;

const getPriority = (blockchain: Blockchain): number => { ... }
```

---

### Issue 3: Unnecessary Re-creation of `getPriority` Function (PERFORMANCE)
**Location**: Line 25-38

**Problem**: The function is defined inside component body, so it's recreated on every render.

**Impact**: When `useMemo` dependency `[balances, prices]` triggers re-computation, the closure reference changes, potentially triggering unnecessary re-evaluations.

**Solution**: Move outside component or use `useCallback` (though moving outside is cleaner).

---

### Issue 4: Unused Dependency in useMemo (PERFORMANCE)
**Location**: Line 46

```tsx
}, [balances, prices]);
```

**Problem**: `prices` is in dependency array but never used inside the `useMemo` callback.

**Impact**: Every time `prices` changes (which could be frequent if prices update frequently), `sortedBalances` recalculates unnecessarily.

**Solution**: Remove `prices` from dependency array.

---

### Issue 5: Missing Memoization for `formattedBalances` (PERFORMANCE)
**Location**: Line 48-53

```tsx
const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
  return {
    ...balance,
    formatted: balance.amount.toFixed()
  }
})
```

**Problems**:
- This runs on EVERY render, not just when `sortedBalances` changes
- Creates new object references each time
- No memoization with `useMemo`

**Impact**: If parent re-renders for unrelated reasons, this expensive map runs unnecessarily.

---

### Issue 6: Inconsistent Type Usage (BUG)
**Location**: Line 55-65

```tsx
const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
  const usdValue = prices[balance.currency] * balance.amount;
```

**Problems**:
- Source is `sortedBalances` (type: `WalletBalance[]`)
- But parameter is typed as `FormattedWalletBalance` (which has `formatted` field)
- `formatted` field doesn't exist in `WalletBalance`
- Using `sortedBalances` instead of `formattedBalances` means we're mapping twice

**Impact**: TypeScript error potential, incorrect data source.

---

### Issue 7: Index as Key in List (ANTI-PATTERN)
**Location**: Line 62

```tsx
<WalletRow 
  key={index}
  amount={balance.amount}
  usdValue={usdValue}
  ...
/>
```

**Problem**: Using array index as `key` is a React anti-pattern.

**Why it's bad**:
- If items get reordered, filtered, or inserted in the middle, React can't track elements properly
- Causes unnecessary re-renders and unmounts/remounts
- Can cause bugs if component has state

**Solution**: Use stable, unique identifier like `balance.currency` or `balance.blockchain + balance.currency`.

---

### Issue 8: `rows` Not Memoized (PERFORMANCE)
**Location**: Line 55-65

```tsx
const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
  return <WalletRow ... />
})
```

**Problem**: Creates new array of React elements on every render.

**Impact**: Even if `sortedBalances` hasn't changed, React receives a new array reference and must diff all elements again.

**Solution**: Memoize with `useMemo` and use `React.memo` on `WalletRow`.

---

### Issue 9: Incomplete Sort Function (POTENTIAL BUG)
**Location**: Line 39-45

```tsx
.sort((lhs: WalletBalance, rhs: WalletBalance) => {
  const leftPriority = getPriority(lhs.blockchain);
  const rightPriority = getPriority(rhs.blockchain);
  if (leftPriority > rightPriority) {
    return -1;
  } else if (rightPriority > leftPriority) {
    return 1;
  }
  // ❌ Missing return 0 for equal priorities
});
```

**Problem**: When priorities are equal, function returns `undefined` instead of `0`.

**Impact**: JavaScript's `Array.prototype.sort` treats `undefined` as "keep original order" (implementation-dependent), which can lead to non-deterministic ordering in some browsers/engines.

---

### Issue 10: Unused Props Destructuring (CODE QUALITY)
**Location**: Line 21

```tsx
const { children, ...rest } = props;
```

**Problem**: `children` is destructured but never used in component.

**Impact**: Confusing code, suggests incomplete implementation.

---

### Issue 11: Ambiguous `toFixed()` Usage (POTENTIAL BUG)
**Location**: Line 51

```tsx
formatted: balance.amount.toFixed()
```

**Problem**: `toFixed()` without arguments defaults to 0 decimal places.

**Impact**: Large amounts lose precision. Example:
- `1234.56.toFixed()` → `"1235"` (rounded to whole number)
- Likely intended behavior is 2 decimal places for currency: `toFixed(2)`

---

### Issue 12: Missing Null/Undefined Checks (ROBUSTNESS)
**Location**: Line 58

```tsx
const usdValue = prices[balance.currency] * balance.amount;
```

**Problem**: No validation that `prices[balance.currency]` exists.

**Impact**: If price data is missing, `usdValue` becomes `NaN`, potentially causing UI issues.

---

## 2. Refactored Solution

```tsx
// Define proper types for type safety
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo' | string;

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

interface Props extends BoxProps {}

// Priority mapping outside component for better performance and type safety
const PRIORITY_MAP: Record<string, number> = {
  'Osmosis': 100,
  'Ethereum': 50,
  'Arbitrum': 30,
  'Zilliqa': 20,
  'Neo': 20,
};

const getPriority = (blockchain: Blockchain): number => {
  return PRIORITY_MAP[blockchain] ?? -99;
};

const WalletPage: React.FC<Props> = ({ ...rest }: Props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // Memoize sorted balances - only depends on balances, not prices
  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const priority = getPriority(balance.blockchain);
        // Only include balances with priority > -99 AND positive amount
        return priority > -99 && balance.amount > 0;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        
        // Use subtract for simpler, more stable sorting
        return rightPriority - leftPriority;
      });
  }, [balances]); // Removed prices from dependencies - not used

  // Memoize formatted balances to avoid recalculation
  const formattedBalances = useMemo<FormattedWalletBalance[]>(() => {
    return sortedBalances.map((balance: WalletBalance) => ({
      ...balance,
      formatted: balance.amount.toFixed(2), // 2 decimal places for currency
    }));
  }, [sortedBalances]);

  // Memoize rows to prevent unnecessary re-renders
  const rows = useMemo(() => {
    return formattedBalances.map((balance: FormattedWalletBalance) => {
      const usdValue = prices[balance.currency] ?? 0; // Default to 0 if price missing
      const safeUsdValue = usdValue * balance.amount;

      return (
        <WalletRow
          className={classes.row}
          key={`${balance.blockchain}-${balance.currency}`} // Stable, unique key
          amount={balance.amount}
          usdValue={safeUsdValue}
          formattedAmount={balance.formatted}
        />
      );
    });
  }, [formattedBalances, prices]); // Prices is now used and properly tracked

  return <div {...rest}>{rows}</div>;
};
```

## 3. Summary of Improvements

| Category | Issue | Fix |
|----------|-------|-----|
| **Correctness** | Undefined `lhsPriority` variable | Use correct variable name `balancePriority` |
| **Correctness** | Inverted filter logic | Fix condition to only include positive amounts |
| **Type Safety** | `any` type for blockchain | Use union type `Blockchain` |
| **Type Safety** | Inconsistent type in map | Use `formattedBalances` with correct type |
| **Performance** | `getPriority` recreated on render | Move outside component |
| **Performance** | Unused `prices` dependency | Remove from dependency array |
| **Performance** | `formattedBalances` not memoized | Wrap in `useMemo` |
| **Performance** | `rows` not memoized | Wrap in `useMemo` |
| **React Best Practice** | Index as key | Use compound key from blockchain+currency |
| **Bug Prevention** | Incomplete sort function | Return proper comparison result |
| **UX** | Missing decimal places in toFixed() | Use `toFixed(2)` for currency |
| **Robustness** | No null check for prices | Use nullish coalescing operator |
| **Code Quality** | Unused `children` prop | Remove unused destructuring |

