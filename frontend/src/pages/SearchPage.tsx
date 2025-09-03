import { useState } from 'react';
import { SearchFilters } from '../components/SearchFilters';
import { SearchResults } from '../components/SearchResults';
import { SearchBar } from '../components/SearchBar';
import { useAnalytics } from '../hooks/useAnalytics';
import { SearchFilters as SearchFiltersType } from '../types';

export function SearchPage() {
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const { trackSearch, trackFilterUsage } = useAnalytics();

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, query }));
    if (query) {
      trackSearch(query, filters);
    }
  };

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    // Track which filters changed
    Object.entries(newFilters).forEach(([key, value]) => {
      if (filters[key as keyof SearchFiltersType] !== value && value) {
        trackFilterUsage(key, String(value));
      }
    });
    
    setFilters(newFilters);
  };

  return (
    <div className="search-page full-style">
      {/* Main Search Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-header">
            <h1>Search Pipe Tobacco</h1>
            <p>Find the perfect blend from thousands of products</p>
          </div>
          
          <SearchBar 
            className="main-search"
            onSearch={handleSearch}
            initialValue={filters.query || ''}
          />
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="main-content">
        <div className="container">
          <div className="content-grid">
            
            {/* Left Column - Filters */}
            <div className="sidebar">
              <SearchFilters 
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>

            {/* Right Column - Results */}
            <div className="main-section">
              <SearchResults 
                filters={filters}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}