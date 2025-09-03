import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from './Pagination';
import { SearchFilters } from '../types';
import { useProducts } from '../hooks/useProducts';

interface SearchResultsProps {
  filters: SearchFilters;
}

type SortOption = 'name' | 'price' | 'brand';
type SortOrder = 'asc' | 'desc';

export function SearchResults({ filters }: SearchResultsProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const limit = 20;
  
  const { data, isLoading, error } = useProducts(
    { ...filters, sortBy, sortOrder }, 
    page, 
    limit
  );

  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
    setPage(1); // Reset to first page when sorting changes
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error) {
    return (
      <div className="search-results">
        <div className="error-message">
          <h3>Error loading products</h3>
          <p>Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-results">
      <div className="results-header">
        <div className="results-count">
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <span>
              {data?.pagination.total || 0} results
              {filters.query && ` for "${filters.query}"`}
            </span>
          )}
        </div>
        
        <div className="sort-controls">
          <label>Sort by:</label>
          <div className="sort-buttons">
            {[
              { key: 'name' as const, label: 'Name' },
              { key: 'price' as const, label: 'Price' },
              { key: 'brand' as const, label: 'Brand' }
            ].map(option => (
              <button
                key={option.key}
                className={`sort-btn ${sortBy === option.key ? 'active' : ''}`}
                onClick={() => handleSortChange(option.key)}
              >
                {option.label}
                {sortBy === option.key && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="loading-card">
                <div className="loading-image"></div>
                <div className="loading-content">
                  <div className="loading-line long"></div>
                  <div className="loading-line short"></div>
                  <div className="loading-line medium"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="no-results">
          <h3>No products found</h3>
          <p>We couldn't find any products matching your current filters.</p>
          <div className="suggestions">
            <h4>Try:</h4>
            <ul>
              <li>Removing some filters to broaden your search</li>
              <li>Checking your spelling if using search terms</li>
              <li>Using more general brand names (e.g., "Peterson" instead of "Peterson Pipe")</li>
              <li>Selecting different availability options (some products may be temporarily out of stock)</li>
            </ul>
          </div>
          <div className="filter-summary">
            {filters.query && (
              <span className="active-filter">
                Search: "{filters.query}"
              </span>
            )}
            {filters.brand && (
              <span className="active-filter">
                Brand: {filters.brand}
              </span>
            )}
            {filters.category && (
              <span className="active-filter">
                Category: {filters.category}
              </span>
            )}
            {filters.availability && filters.availability.length > 0 && (
              <span className="active-filter">
                Availability: {filters.availability.join(', ')}
              </span>
            )}
            {filters.retailers && filters.retailers.length > 0 && (
              <span className="active-filter">
                Retailers: {filters.retailers.join(', ')}
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="active-filter">
                Price: ${filters.minPrice || '0'} - ${filters.maxPrice || '∞'}
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="products-table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Best Price</th>
                  <th>Retailer</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map(product => {
                  // Find the best retailer to display based on availability and price
                  // Priority: in_stock with lowest price, then limited, then any other availability
                  const sortedRetailers = [...product.retailers].sort((a, b) => {
                    // First, sort by availability priority (in_stock > limited > others)
                    const getAvailabilityPriority = (availability: string) => {
                      switch(availability) {
                        case 'in_stock': return 3;
                        case 'limited': return 2; 
                        default: return 1;
                      }
                    };
                    
                    const priorityA = getAvailabilityPriority(a.availability);
                    const priorityB = getAvailabilityPriority(b.availability);
                    
                    if (priorityA !== priorityB) {
                      return priorityB - priorityA; // Higher priority first
                    }
                    
                    // If same availability, sort by price (lowest first)
                    return a.currentPrice - b.currentPrice;
                  });
                  
                  const displayRetailer = sortedRetailers[0];
                  const inStockRetailers = product.retailers.filter(r => r.availability === 'in_stock');
                  const displayPrice = displayRetailer ? `$${displayRetailer.currentPrice.toFixed(2)}` : 'N/A';

                  return (
                    <tr key={product._id}>
                      <td className="product-name-cell">
                        <div className="product-name-container">
                          <Link to={`/product/${product._id}`} className="product-name-link">
                            {product.name.length > 50 ? `${product.name.substring(0, 50)}...` : product.name}
                          </Link>
                          {product.description && (
                            <div className="product-description-small">
                              {product.description.length > 80 ? `${product.description.substring(0, 80)}...` : product.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{product.brand.length > 20 ? `${product.brand.substring(0, 20)}...` : product.brand}</td>
                      <td>
                        <span className={`category-badge category-${product.category}`}>
                          {product.category}
                        </span>
                      </td>
                      <td className="price-cell">
                        <span className="price-value">{displayPrice}</span>
                      </td>
                      <td>
                        <div className="retailer-info">
                          <div className="retailer-name">
                            {typeof displayRetailer.retailerId === 'object' ? (
                              displayRetailer.retailerId.name.length > 15 
                                ? `${displayRetailer.retailerId.name.substring(0, 15)}...` 
                                : displayRetailer.retailerId.name
                            ) : (
                              displayRetailer.retailerName || 'Unknown Retailer'
                            )}
                          </div>
                          {inStockRetailers.length > 1 && (
                            <div className="retailer-count">
                              +{inStockRetailers.length - 1} more in stock
                            </div>
                          )}
                          {product.retailers.length > inStockRetailers.length && inStockRetailers.length === 0 && (
                            <div className="retailer-count">
                              +{product.retailers.length - 1} more retailers
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`availability-badge availability-${displayRetailer.availability}`}>
                          {displayRetailer.availability.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <Link to={`/product/${product._id}`} className="btn btn-primary btn-small">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data?.pagination && data.pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}