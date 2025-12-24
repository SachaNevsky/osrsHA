import React, { useState, useEffect } from 'react';
import ITEMS_DATA from "public/items.json";

const AlchemyCalculator = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'profit', direction: 'desc' });
  const [showMembers, setShowMembers] = useState(true);
  const [natureRunePrice, setNatureRunePrice] = useState(85);

  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all item prices from the API
      const response = await fetch('https://prices.runescape.wiki/api/v1/osrs/latest', {
        headers: {
          'User-Agent': 'OSRS Alchemy Calculator - claude.ai artifact'
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();

      // Update nature rune price if available
      if (data.data && data.data['561'] && data.data['561'].high) {
        setNatureRunePrice(data.data['561'].high);
      }

      // Enrich items with current prices
      const currentNatPrice = data.data?.['561']?.high || natureRunePrice;
      const enrichedItems = ITEMS_DATA.map(item => {
        const priceData = data.data?.[item.id];
        const buyPrice = priceData?.high || 0;
        const profit = buyPrice > 0 ? item.highAlch - buyPrice - currentNatPrice : 0;
        const profitPerLimit = profit * item.limit;

        return {
          ...item,
          buyPrice,
          profit,
          profitPerLimit
        };
      });

      setItems(enrichedItems);
    } catch (err) {
      console.error('Error fetching prices:', err);
      setError('Unable to fetch live prices. This may be due to CORS restrictions in the preview environment. The webapp will work when deployed to GitHub Pages.');

      // Set items with zero prices if fetch fails
      const enrichedItems = ITEMS_DATA.map(item => ({
        ...item,
        buyPrice: 0,
        profit: 0,
        profitPerLimit: 0
      }));
      setItems(enrichedItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize with items immediately to show table structure
    const initialItems = ITEMS_DATA.map(item => ({
      ...item,
      buyPrice: 0,
      profit: 0,
      profitPerLimit: 0
    }));
    setItems(initialItems);

    // Then fetch prices
    fetchPrices();
  }, []);

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = React.useMemo(() => {
    const filtered = items.filter(item => showMembers || !item.members);

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a];
      const bVal = b[sortConfig.key as keyof typeof b];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return sorted;
  }, [items, sortConfig, showMembers]);

  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return ' ↕';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">OSRS High Alchemy Profit Calculator</h1>

        <div className="mb-4 flex gap-4 items-center justify-center flex-wrap">
          <button
            onClick={fetchPrices}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-semibold transition"
          >
            {loading ? 'Loading...' : 'Refresh Prices'}
          </button>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMembers}
              onChange={(e) => setShowMembers(e.target.checked)}
              className="w-5 h-5"
            />
            <span>Show Members Items</span>
          </label>

          <div className="text-sm">
            Nature Rune Price: <span className="font-bold text-yellow-400">{natureRunePrice} gp</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-yellow-900 border border-yellow-600 rounded text-yellow-100">
            <strong>Note:</strong> {error}
          </div>
        )}

        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('name')}
                >
                  Item{getSortIndicator('name')}
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('highAlch')}
                >
                  High Alch{getSortIndicator('highAlch')}
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('buyPrice')}
                >
                  Buy Price{getSortIndicator('buyPrice')}
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('limit')}
                >
                  Limit{getSortIndicator('limit')}
                </th>
                <th
                  className="px-4 py-3 text-center cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('members')}
                >
                  Members{getSortIndicator('members')}
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('profit')}
                >
                  Profit{getSortIndicator('profit')}
                </th>
                <th
                  className="px-4 py-3 text-right cursor-pointer hover:bg-gray-600"
                  onClick={() => handleSort('profitPerLimit')}
                >
                  Profit/Limit{getSortIndicator('profitPerLimit')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-t border-gray-700 ${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700`}
                >
                  <td className="px-4 py-2">
                    <a
                      href={`https://prices.runescape.wiki/osrs/item/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {item.name}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-right text-yellow-300">
                    {formatNumber(item.highAlch)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {item.buyPrice ? formatNumber(item.buyPrice) : 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatNumber(item.limit)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {item.members ? '✓' : '✗'}
                  </td>
                  <td className={`px-4 py-2 text-right font-bold ${item.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.buyPrice ? formatNumber(item.profit) : 'N/A'}
                  </td>
                  <td className={`px-4 py-2 text-right font-bold ${item.profitPerLimit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.buyPrice ? formatNumber(item.profitPerLimit) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Prices fetched from <a href="https://prices.runescape.wiki" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">prices.runescape.wiki</a></p>
          <p>Click column headers to sort. Click item names to view price history.</p>
        </div>
      </div>
    </div>
  );
};

export default AlchemyCalculator;