import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagination } from './Pagination';
import { Product, SearchFilters } from '../types';
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
          <p>Try adjusting your search criteria or filters.</p>
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
                  const lowestPriceRetailer = product.retailers.reduce((min, retailer) => 
                    retailer.availability === 'in_stock' && retailer.currentPrice < min.currentPrice ? retailer : min,
                    product.retailers[0]
                  );
                  
                  const availableRetailers = product.retailers.filter(r => r.availability === 'in_stock');
                  const displayPrice = lowestPriceRetailer.availability === 'in_stock' 
                    ? `$${lowestPriceRetailer.currentPrice.toFixed(2)}`
                    : 'N/A';

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
                            {lowestPriceRetailer.retailerId.name.length > 15 
                              ? `${lowestPriceRetailer.retailerId.name.substring(0, 15)}...` 
                              : lowestPriceRetailer.retailerId.name}
                          </div>
                          {availableRetailers.length > 1 && (
                            <div className="retailer-count">
                              +{availableRetailers.length - 1} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`availability-badge availability-${lowestPriceRetailer.availability}`}>
                          {lowestPriceRetailer.availability.replace('_', ' ')}
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