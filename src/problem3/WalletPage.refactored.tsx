// Refactored Solution for Problem 3: Messy React

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

