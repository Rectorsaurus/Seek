import React from 'react';
import { Product } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';

interface PriceComparisonProps {
  product: Product;
}

export function PriceComparison({ product }: PriceComparisonProps) {
  const { trackRetailerClick, trackPriceComparison } = useAnalytics();
  
  // Use allRetailers if available (from product detail page), otherwise use retailers
  const retailers = product.allRetailers || product.retailers;
  
  const sortedRetailers = [...retailers].sort((a, b) => {
    // Prioritize in-stock items first, then by price
    if (a.availability === 'in_stock' && b.availability !== 'in_stock') return -1;
    if (a.availability !== 'in_stock' && b.availability === 'in_stock') return 1;
    return a.currentPrice - b.currentPrice;
  });

  // Track price comparison view
  React.useEffect(() => {
    if (sortedRetailers.length > 0) {
      trackPriceComparison(product._id, sortedRetailers.length);
    }
  }, [product._id, sortedRetailers.length, trackPriceComparison]);

  const handleRetailerClick = (retailerProduct: any) => {
    trackRetailerClick({
      productId: product._id,
      productName: product.name,
      retailerName: typeof retailerProduct.retailerId === 'object' ? retailerProduct.retailerId.name : retailerProduct.retailerName || 'Unknown Retailer',
      retailerUrl: retailerProduct.productUrl,
      price: retailerProduct.currentPrice,
      availability: retailerProduct.availability
    });
  };


  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'in_stock':
        return 'In Stock';
      case 'limited':
        return 'Limited Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      case 'discontinued':
        return 'Discontinued';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="price-comparison" data-testid="price-comparison">
      <h3 data-testid="price-comparison-title">Price Comparison</h3>
      {product.allRetailers && (
        <p className="comparison-note">
          Showing all retailers for products matching "{product.name}" by {product.brand}
        </p>
      )}
      
      {sortedRetailers.length === 0 ? (
        <div className="no-retailers">
          <p>No retailers found for this product.</p>
        </div>
      ) : (
        <div className="retailers-table-container">
          <table className="retailers-table">
            <thead>
              <tr>
                <th>Retailer</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRetailers.map((retailerProduct, index) => (
                <tr key={`${retailerProduct.retailerId}-${index}`}>
                  <td className="retailer-name-cell">
                    <div className="retailer-name">
                      {typeof retailerProduct.retailerId === 'object' ? retailerProduct.retailerId.name : retailerProduct.retailerName || 'Unknown Retailer'}
                    </div>
                  </td>
                  <td className="price-cell">
                    <span className="price">${retailerProduct.currentPrice.toFixed(2)}</span>
                  </td>
                  <td className="availability-cell">
                    <span className={`availability-badge availability-${retailerProduct.availability}`}>
                      {getAvailabilityText(retailerProduct.availability)}
                    </span>
                  </td>
                  <td className="updated-cell">
                    {new Date(retailerProduct.lastScraped).toLocaleDateString()}
                  </td>
                  <td className="actions-cell">
                    <a
                      href={retailerProduct.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn btn-small ${
                        retailerProduct.availability === 'in_stock' 
                          ? 'btn-primary' 
                          : 'btn-secondary'
                      }`}
                      data-testid={`retailer-link-${index}`}
                      aria-label={`${retailerProduct.availability === 'in_stock' ? 'Buy' : 'View'} product at ${typeof retailerProduct.retailerId === 'object' ? retailerProduct.retailerId.name : retailerProduct.retailerName || 'retailer'}`}
                      onClick={() => handleRetailerClick(retailerProduct)}
                    >
                      {retailerProduct.availability === 'in_stock' ? 'Buy Now' : 'View'}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sortedRetailers.length > 1 && (
        <div className="price-summary">
          <div className="price-stats">
            <div className="stat">
              <span className="label">Lowest Price:</span>
              <span className="value">
                ${Math.min(...sortedRetailers.map(r => r.currentPrice)).toFixed(2)}
              </span>
            </div>
            <div className="stat">
              <span className="label">Highest Price:</span>
              <span className="value">
                ${Math.max(...sortedRetailers.map(r => r.currentPrice)).toFixed(2)}
              </span>
            </div>
            <div className="stat">
              <span className="label">Available at:</span>
              <span className="value">
                {sortedRetailers.filter(r => r.availability === 'in_stock').length} / {sortedRetailers.length} retailers
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}