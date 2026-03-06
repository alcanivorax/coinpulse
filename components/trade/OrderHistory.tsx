'use client';

import { useTradingStore } from '@/lib/trading-store';
import { cn, formatCurrency } from '@/lib/utils';

const formatTime = (timestamp: number) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
};

export const OrderHistory = () => {
  const { orders } = useTradingStore();

  if (orders.length === 0) {
    return (
      <div className="order-history">
        <h2 className="order-history__title">Order History</h2>
        <p className="order-history__empty">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="order-history">
      <div className="order-history__header">
        <h2 className="order-history__title">Order History</h2>
        <span className="order-history__count">{orders.length} orders</span>
      </div>

      <div className="order-history__list">
        <table className="order-history__table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Coin</th>
              <th>Amount</th>
              <th>Price</th>
              <th>Total</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <span className={cn('order-history__badge', `is-${order.type}`)}>
                    {order.type.toUpperCase()}
                  </span>
                </td>
                <td className="order-history__symbol">{order.symbol}</td>
                <td>{order.amount.toFixed(6)}</td>
                <td>{formatCurrency(order.price, 2)}</td>
                <td className={cn(order.type === 'buy' ? 'text-red-400' : 'text-green-400')}>
                  {order.type === 'buy' ? '-' : '+'}
                  {formatCurrency(order.total)}
                </td>
                <td className="order-history__time">{formatTime(order.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
