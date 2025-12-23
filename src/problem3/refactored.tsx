import React, { useMemo } from 'react';

// Định nghĩa types
interface BoxProps {
  [key: string]: any; // Placeholder cho BoxProps
}

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // ✅ Thêm property còn thiếu
}

interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
  blockchain: string;
}

interface Props extends BoxProps {}

// Placeholder cho hooks và components (trong thực tế sẽ import từ các file khác)
declare function useWalletBalances(): WalletBalance[];
declare function usePrices(): { [currency: string]: number };
declare function WalletRow(props: {
  className?: string;
  key?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}): JSX.Element;

// ✅ Định nghĩa type cho blockchain thay vì dùng any
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

// ✅ Di chuyển function ra ngoài component để tránh tạo lại mỗi lần render
const getPriority = (blockchain: Blockchain | string): number => {
  switch (blockchain) {
    case 'Osmosis':
      return 100;
    case 'Ethereum':
      return 50;
    case 'Arbitrum':
      return 30;
    case 'Zilliqa':
      return 20;
    case 'Neo':
      return 20;
    default:
      return -99;
  }
};

const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  // ✅ Tính toán sorted và formatted balances trong một useMemo duy nhất
  const formattedBalances = useMemo(() => {
    // ✅ Tính priority một lần và lưu vào object để tránh gọi lại nhiều lần
    const balancesWithPriority = balances.map((balance) => ({
      ...balance,
      priority: getPriority(balance.blockchain),
    }));

    // ✅ Sửa logic filter: loại bỏ balance <= 0 và priority <= -99
    const filtered = balancesWithPriority.filter((balance) => {
      return balance.priority > -99 && balance.amount > 0;
    });

    // ✅ Sửa sort function: return 0 khi bằng nhau
    const sorted = filtered.sort((lhs, rhs) => {
      if (lhs.priority > rhs.priority) {
        return -1;
      } else if (rhs.priority > lhs.priority) {
        return 1;
      }
      return 0; // ✅ Thêm return 0 khi bằng nhau
    });

    // ✅ Format balances ngay trong useMemo
    return sorted.map((balance) => ({
      ...balance,
      formatted: balance.amount.toFixed(2), // ✅ Format với 2 chữ số thập phân
    }));
  }, [balances]); // ✅ Chỉ phụ thuộc vào balances, không cần prices

  // ✅ Render rows với formattedBalances đã được tính toán
  const rows = useMemo(() => {
    return formattedBalances.map((balance) => {
      const usdValue = prices[balance.currency] * balance.amount;
      return (
        <WalletRow
          className="row" // ✅ Sửa classes.row thành string hoặc import classes
          key={`${balance.currency}-${balance.blockchain}`} // ✅ Dùng unique key thay vì index
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.formatted}
        />
      );
    });
  }, [formattedBalances, prices]);

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;

