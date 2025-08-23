import { Link } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = product.retailers.reduce((min, retailer) => 
    retailer.availability === 'in_stock' && retailer.currentPrice < min ? retailer.currentPrice : min, 
    Infinity
  );

  const availableRetailers = product.retailers.filter(r => r.availability === 'in_stock');
  const displayPrice = lowestPrice === Infinity ? 'N/A' : `$${lowestPrice.toFixed(2)}`;

  return (
    <div className="product-card">
      <div className="product-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="placeholder-image">
            <span>No Image</span>
          </div>
        )}
      </div>
      
      <div className="product-info">
        <div className="product-header">
          <h3 className="product-name">
            <Link to={`/product/${product._id}`}>
              {product.name}
            </Link>
          </h3>
          <span className="product-brand">{product.brand}</span>
        </div>
        
        <div className="product-category">
          <span className={`category-badge category-${product.category}`}>
            {product.category}
          </span>
        </div>
        
        <div className="product-pricing">
          <div className="best-price">
            <span className="price-label">Best Price:</span>
            <span className="price-value">{displayPrice}</span>
          </div>
          
          <div className="retailer-count">
            {availableRetailers.length} retailer{availableRetailers.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {product.description && (
          <p className="product-description">
            {product.description.substring(0, 100)}
            {product.description.length > 100 ? '...' : ''}
          </p>
        )}
        
        <div className="product-actions">
          <Link to={`/product/${product._id}`} className="btn btn-primary">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}