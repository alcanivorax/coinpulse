'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useDebounce } from 'react-use';
import useSWR from 'swr';
import { Search as SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchCoins } from '@/lib/coingecko.actions';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type CoinSelectorProps = {
  coins: TradeableCoin[];
  selectedCoinId: string;
  onSelect: (coin: TradeableCoin) => void;
  onAddCoin: (coin: TradeableCoin) => void;
};

export const CoinSelector = ({ coins, selectedCoinId, onSelect, onAddCoin }: CoinSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useDebounce(() => setDebouncedQuery(searchQuery.trim()), 300, [searchQuery]);

  const { data: searchResults = [], isValidating: isSearching } = useSWR<SearchCoin[]>(
    debouncedQuery ? ['trade-coin-search', debouncedQuery] : null,
    ([, query]) => searchCoins(query as string),
    { revalidateOnFocus: false },
  );

  const handleClose = () => {
    setOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleSelect = (coin: SearchCoin) => {
    const tradeable: TradeableCoin = {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      thumb: coin.thumb,
      currentPrice: coin.data.price ?? 0,
    };
    onAddCoin(tradeable);
    handleClose();
  };

  const hasQuery = debouncedQuery.length > 0;
  const hasResults = !isSearching && hasQuery && searchResults.length > 0;
  const noResults = !isSearching && hasQuery && searchResults.length === 0;

  return (
    <div className="coin-selector">
      {coins.map((coin) => (
        <button
          key={coin.id}
          className={cn('coin-selector__item', { 'is-active': coin.id === selectedCoinId })}
          onClick={() => onSelect(coin)}
        >
          {coin.thumb && (
            <Image
              src={coin.thumb}
              alt={coin.name}
              width={20}
              height={20}
              className="coin-selector__img"
            />
          )}
          <span className="coin-selector__symbol">{coin.symbol.toUpperCase()}</span>
        </button>
      ))}

      <button
        className="coin-selector__search-btn"
        onClick={() => setOpen(true)}
        title="Search and add any coin"
      >
        <SearchIcon size={14} />
        <span>Add coin</span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(v) => (!v ? handleClose() : setOpen(true))}
        className="dialog"
        data-search-modal
      >
        <div className="cmd-input">
          <CommandInput
            placeholder="Search any coin by name or symbol..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </div>

        <CommandList className="list custom-scrollbar">
          {isSearching && <div className="empty">Searching...</div>}

          {!isSearching && !hasQuery && <div className="empty">Type to search for any coin...</div>}

          {noResults && <CommandEmpty>No coins found.</CommandEmpty>}

          {hasResults && (
            <CommandGroup heading={<p className="heading">Search Results</p>} className="group">
              {searchResults.map((coin) => (
                <CommandItem
                  key={coin.id}
                  value={coin.id}
                  onSelect={() => handleSelect(coin)}
                  className="search-item"
                >
                  <div className="coin-info">
                    <Image src={coin.thumb} alt={coin.name} width={40} height={40} />
                    <div>
                      <p className="font-bold text-white">{coin.name}</p>
                      <p className="coin-symbol">{coin.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                  {coin.data.price != null && (
                    <div className="coin-price">
                      ${coin.data.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </div>
  );
};
