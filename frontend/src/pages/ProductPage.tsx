import { useParams, Link } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts';
import { PriceComparison } from '../components/PriceComparison';

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useProduct(id!);

  if (isLoading) {
    return (
      <div className="product-page full-style">
        <div className="container">
          <div className="loading-state">
            <div className="loading-product">
              <div className="loading-image large"></div>
              <div className="loading-content">
                <div className="loading-line long"></div>
                <div className="loading-line medium"></div>
                <div className="loading-line short"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="product-page full-style">
        <div className="container">
          <div className="error-message">
            <h2>Product not found</h2>
            <p>The product you're looking for doesn't exist.</p>
            <Link to="/search" className="btn btn-primary">
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const product = data.data;

  return (
    <div className="product-page full-style">
      {/* Breadcrumb Section */}
      <section className="breadcrumb-section">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb navigation">
            <Link to="/search" data-testid="breadcrumb-search">Search</Link>
            <span>/</span>
            <span data-testid="breadcrumb-product">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Main Product Section */}
      <div className="main-content">
        <div className="container">
          <div className="product-details">
            <div className="product-image" data-testid="product-image-container">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  data-testid="product-image"
                />
              ) : (
                <div className="placeholder-image" data-testid="product-image-placeholder">
                  <span>No Image Available</span>
                </div>
              )}
            </div>
            
            <div className="product-info" data-testid="product-info">
              <h1 className="product-name" data-testid="product-name">{product.name}</h1>
              <div className="product-meta" data-testid="product-meta">
                <p className="brand" data-testid="product-brand">
                  <span className="label">Brand:</span>
                  <span className="value">{product.brand}</span>
                </p>
                <p className="category" data-testid="product-category">
                  <span className="label">Category:</span>
                  <span className={`category-badge category-${product.category}`}>
                    {product.category}
                  </span>
                </p>
                {product.tobaccoType.length > 0 && (
                  <p className="tobacco-type" data-testid="product-tobacco-type">
                    <span className="label">Tobacco Type:</span>
                    <span className="value">{product.tobaccoType.join(', ')}</span>
                  </p>
                )}
              </div>
              
              {product.description && (
                <div className="description" data-testid="product-description">
                  <h3>Description</h3>
                  <p>{product.description}</p>
                </div>
              )}
            </div>
          </div>
          
          <div data-testid="price-comparison-section">
            <PriceComparison product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}