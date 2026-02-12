import { Icon } from '@iconify/react';
import { Input, Select, Space } from 'antd';

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
  const [searchEngine, setSearchEngine] = useState<string>('google');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState('Web');

  const tabs = ['Web', 'Images', 'Videos', 'News'];

  useEffect(() => {
    getSearchEngine().then(setSearchEngine);
  }, []);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      const engine = searchEngines[searchEngine];
      window.location.href = engine.url + encodeURIComponent(value);
    }
  };

  const handleEngineChange = async (value: string) => {
    setSearchEngine(value);
    await saveSearchEngine(value);
  };

  return (
    <>
      <div className="glass widget mx-auto w-full max-w-xl space-y-3 p-4">
        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              className={`rounded-full px-2 py-1 text-sm font-medium transition-colors duration-200 ${activeTab === tab ? 'bg-black/20 dark:bg-white/10' : ''}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <Space.Compact
          className="relative flex items-center rounded-lg bg-white/30 pl-3 dark:bg-black/30"
          size="large"
        >
          <Select
            className="border-none bg-transparent px-0"
            rootClassName="focus:ring-transparent focus:outline-transparent"
            suffixIcon={
              <Icon className="text-xl" icon="material-symbols:arrow-drop-down-rounded" />
            }
            value={searchEngine}
            onChange={handleEngineChange}
            options={Object.entries(searchEngines).map(([key, config]) => ({
              value: key,
              label: <Icon className="text-base" icon={config.icon} />,
              title: config.name,
            }))}
            popupMatchSelectWidth={52}
          />
          <Search
            autoFocus
            rootClassName="bg-transparent border-none text-white"
            placeholder="Search the web..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={handleSearch}
            allowClear
            enterButton={<Icon className="text-xl" icon="material-symbols:search" />}
          />
        </Space.Compact>
      </div>
    </>
  );
};
