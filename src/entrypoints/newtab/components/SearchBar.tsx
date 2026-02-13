import { JSX, useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Input, Select } from 'antd';
import { motion } from 'framer-motion';

const { Search } = Input;

interface SearchEngineConfig {
  name: string;
  url: string;
  icon: string;
}

const searchEngines: Record<string, SearchEngineConfig> = {
  google: {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: 'logos:google-icon',
  },
  bing: {
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: 'logos:bing',
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: 'simple-icons:duckduckgo',
  },
  yahoo: {
    name: 'Yahoo',
    url: 'https://search.yahoo.com/search?p=',
    icon: 'logos:yahoo',
  },
  ecosia: {
    name: 'Ecosia',
    url: 'https://www.ecosia.org/search?q=',
    icon: 'simple-icons:ecosia',
  },
};

export const SearchBar: React.FC = () => {
  const [searchEngine, setSearchEngine] = useState('google');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Web');
  const [suggestions, setSuggestions] = useState<{ value: string; label: JSX.Element }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const tabs = ['Web', 'Images', 'Videos', 'News'];

  useEffect(() => {
    getSearchEngine().then(setSearchEngine);

    // Close dropdown when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Fetch Chrome history
  const fetchHistory = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      if (typeof chrome !== 'undefined' && chrome.history) {
        const results = await chrome.history.search({
          text: query,
          maxResults: 8,
          startTime: Date.now() - 30 * 24 * 60 * 60 * 1000,
        });
        const formattedSuggestions = results
          .filter((item) => item.url)
          .map((item) => ({
            value: item.url || '',
            label: (
              <div className="dark:hover:bg-app-900 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-100">
                <Icon className="text-lg text-gray-500" icon="material-symbols:history" />
                <div className="flex-1 overflow-hidden">
                  <div className="text-theme truncate text-sm font-medium">
                    {item.title || item.url || 'Untitled'}
                  </div>
                  <div className="truncate text-[10px] text-gray-500 dark:text-white/50">
                    {item.url}
                  </div>
                </div>
              </div>
            ),
          }));
        setSuggestions(formattedSuggestions);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchHistory(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (value: string) => {
    if (!value.trim()) return;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      window.location.href = value;
    } else {
      const engine = searchEngines[searchEngine];
      window.location.href = engine.url + encodeURIComponent(value);
    }
  };

  const handleSelect = (value: string) => {
    setSearchQuery(value);
    setShowDropdown(false);
    handleSearch(value);
  };

  return (
    <div className="glass widget mx-auto w-full max-w-xl p-4">
      {/* Tabs */}
      <motion.div
        className="space-y-3"
        key={'search-bar'}
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              className={`cursor-pointer rounded-full px-2 py-1 text-sm font-medium transition-colors duration-200 ${activeTab === tab ? 'bg-app-900 dark:bg-white/10' : ''}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div
          className="relative flex items-center space-x-2 rounded-lg bg-white/30 px-3 py-1 dark:bg-black/30"
          ref={containerRef}
        >
          <Select
            className="border-none bg-transparent px-0 shadow-none outline-none"
            suffixIcon={
              <Icon className="text-xl" icon="material-symbols:arrow-drop-down-rounded" />
            }
            value={searchEngine}
            onChange={(val) => setSearchEngine(val)}
            options={Object.entries(searchEngines).map(([key, config]) => ({
              value: key,
              label: <Icon className="text-base" icon={config.icon} />,
              title: config.name,
            }))}
            popupMatchSelectWidth={52}
          />

          <input
            className="text-app-900 flex-1 rounded-md bg-transparent px-2 py-1 outline-none dark:text-white"
            placeholder="Search the web..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(searchQuery);
            }}
          />
          <button
            className="rounded p-1 transition hover:bg-black/10 dark:hover:bg-white/20"
            onClick={() => handleSearch(searchQuery)}
          >
            <Icon className="text-xl" icon="material-symbols:search" />
          </button>

          {/* Suggestions Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md bg-white shadow-lg dark:bg-black/80">
              {suggestions.map((s) => (
                <div key={s.value} onClick={() => handleSelect(s.value)}>
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
