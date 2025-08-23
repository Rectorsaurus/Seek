import { useState, useEffect } from 'react';
import { useRetailers } from '../hooks/useRetailers';
import { SearchFilters as SearchFiltersType } from '../types';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

const CATEGORIES = [
  'aromatic',
  'english',
  'virginia',
  'burley',
  'latakia',
  'oriental',
  'perique',
  'cavendish',
  'bulk',
  'tinned'
];

const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'limited', label: 'Limited Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' }
];

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SearchFiltersType>(filters);
  const { data: retailersResponse } = useRetailers();
  const retailers = retailersResponse?.data || [];

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof SearchFiltersType, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
    // Don't auto-apply - wait for Apply button
  };

  const handleArrayFilterChange = (key: 'availability' | 'retailers', value: string, checked: boolean) => {
    const currentArray = localFilters[key] || [];
    const updatedArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleFilterChange(key, updatedArray);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: SearchFiltersType = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="search-filters">
      <div className="sidebar-section">
        <div className="filters-header">
          <h3>Search Filters</h3>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Brand</h3>
        <input
          type="text"
          placeholder="Enter brand name..."
          value={localFilters.brand || ''}
          onChange={(e) => handleFilterChange('brand', e.target.value || undefined)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #CD853F', borderRadius: '4px' }}
        />
      </div>

      <div className="sidebar-section">
        <h3>Category</h3>
        <select
          value={localFilters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #CD853F', borderRadius: '4px' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar-section">
        <h3>Price Range</h3>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={localFilters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            style={{ padding: '0.5rem', border: '1px solid #CD853F', borderRadius: '4px', flex: '1' }}
          />
          <span style={{ padding: '0 0.5rem', color: '#8B4513' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={localFilters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            style={{ padding: '0.5rem', border: '1px solid #CD853F', borderRadius: '4px', flex: '1' }}
          />
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Availability</h3>
        <div className="filter-options">
          {AVAILABILITY_OPTIONS.map(option => (
            <label key={option.value} className="filter-option">
              <input
                type="checkbox"
                checked={(localFilters.availability || []).includes(option.value)}
                onChange={(e) => handleArrayFilterChange('availability', option.value, e.target.checked)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Retailers</h3>
        <div className="filter-options">
          {retailers.map(retailer => (
            <label key={retailer._id} className="filter-option">
              <input
                type="checkbox"
                checked={(localFilters.retailers || []).includes(retailer.name)}
                onChange={(e) => handleArrayFilterChange('retailers', retailer.name, e.target.checked)}
              />
              <span>{retailer.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="filter-actions">
          <button 
            className="btn btn-primary apply-filters"
            onClick={applyFilters}
          >
            Apply
          </button>
          <button 
            className="btn btn-secondary clear-filters"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}