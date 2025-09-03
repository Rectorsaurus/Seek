import { Link } from 'react-router-dom';
import { useFeaturedProducts } from '../hooks/useProducts';
import { useRetailers } from '../hooks/useRetailers';
import { SearchBar } from '../components/SearchBar';

export function HomePage() {
  const { data: featuredData } = useFeaturedProducts();
  const { data: retailersData } = useRetailers();
  
  const featuredProducts = featuredData?.data || [];
  const retailers = retailersData?.data || [];

  const tobaccoCategories = [
    { name: 'English Blends', slug: 'english', icon: '🌿' },
    { name: 'Aromatic', slug: 'aromatic', icon: '🍯' },
    { name: 'Virginia', slug: 'virginia', icon: '🌾' },
    { name: 'Burley', slug: 'burley', icon: '🌰' },
    { name: 'Latakia', slug: 'latakia', icon: '🔥' },
    { name: 'Bulk Tobacco', slug: 'bulk', icon: '📦' }
  ];

  return (
    <div className="home-page full-style">
      {/* Top Stats Bar */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-number">{retailers.length}</span>
              <span className="stat-label">Retailers Indexed</span>
            </div>
            <div className="stat">
              <span className="stat-number">15,000+</span>
              <span className="stat-label">Products Tracked</span>
            </div>
            <div className="stat">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Price Updates</span>
            </div>
            <div className="stat">
              <span className="stat-number">$$$</span>
              <span className="stat-label">Money Saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Search Section */}
      <section className="search-section">
        <div className="container">
          <div className="search-header">
            <h1>Pipe Tobacco Price Search</h1>
            <p>Find the best prices across {retailers.length} tobacco retailers</p>
          </div>
          
          <SearchBar className="main-search" />
        </div>
      </section>

      {/* Quick Seek Categories */}
      <section className="quick-seek">
        <div className="container">
          <h2>Quick Seek by Category</h2>
          <div className="categories-grid">
            {tobaccoCategories.map((category) => (
              <Link
                key={category.slug}
                to={`/search?category=${category.slug}`}
                className="category-card"
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="main-content">
        <div className="container">
          <div className="content-grid">
            
            {/* Left Column - Popular Categories */}
            <div className="sidebar">
              <div className="sidebar-section">
                <h3>Popular Categories</h3>
                <ul className="category-list">
                  <li><Link to="/search?category=aromatic">Aromatic (35%)</Link></li>
                  <li><Link to="/search?category=english">English (28%)</Link></li>
                  <li><Link to="/search?category=virginia">Virginia (18%)</Link></li>
                  <li><Link to="/search?category=burley">Burley (12%)</Link></li>
                  <li><Link to="/search?category=bulk">Bulk Tobacco (7%)</Link></li>
                </ul>
              </div>

              <div className="sidebar-section">
                <h3>Top Retailers</h3>
                <ul className="retailer-list">
                  {retailers.slice(0, 5).map((retailer) => (
                    <li key={retailer._id}>
                      <Link to={`/search?retailers=${retailer._id}`}>
                        {retailer.name}
                        <span className="retailer-rating">★★★★☆</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Column - Recent Updates & Deals */}
            <div className="main-section">
              <div className="updates-section">
                <h3>Recent Price Updates</h3>
                <div className="update-stats">
                  <div className="update-item">
                    <span className="update-time">Last 24 hours:</span>
                    <span className="update-count">2,847 price updates</span>
                  </div>
                  <div className="update-item">
                    <span className="update-time">This week:</span>
                    <span className="update-count">18,392 new products</span>
                  </div>
                </div>
              </div>

              {featuredProducts.length > 0 && (
                <div className="featured-section">
                  <h3>Featured Tobacco Deals</h3>
                  <div className="deals-grid">
                    {featuredProducts.slice(0, 4).map(product => (
                      <div key={product._id} className="deal-card">
                        <Link to={`/product/${product._id}`}>
                          <h4>{product.name}</h4>
                          <p className="brand">{product.brand}</p>
                          <div className="price-info">
                            <span className="price">
                              ${Math.min(...product.retailers.map(r => r.currentPrice)).toFixed(2)}
                            </span>
                            <span className="retailer-count">
                              {product.retailers.length} retailers
                            </span>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}