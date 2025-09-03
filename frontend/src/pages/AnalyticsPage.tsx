import { useState } from 'react';
import { DateRange, analyticsApi } from '../services/analyticsApi';
import { 
  useOverviewStats, 
  useRetailerClickThroughs, 
  useProductAnalytics, 
  useSearchAnalytics 
} from '../hooks/useAnalyticsData';
import { DateRangeFilter } from '../components/analytics/DateRangeFilter';
import { OverviewStats } from '../components/analytics/OverviewStats';
import { RetailerClicksTable } from '../components/analytics/RetailerClicksTable';

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'retailers' | 'products' | 'search'>('overview');

  const { data: overviewStats, isLoading: overviewLoading } = useOverviewStats(dateRange);
  const { data: retailerData, isLoading: retailerLoading } = useRetailerClickThroughs(dateRange);
  const { data: productData, isLoading: productLoading } = useProductAnalytics(dateRange);
  const { data: searchData, isLoading: searchLoading } = useSearchAnalytics(dateRange);

  const handleExportRetailerData = async () => {
    try {
      const blob = await analyticsApi.exportAnalyticsData('retailer_clicks', 'csv', dateRange);
      analyticsApi.downloadExport(blob, 'retailer_clicks', 'retailer_clicks');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportProductData = async () => {
    try {
      const blob = await analyticsApi.exportAnalyticsData('product_analytics', 'csv', dateRange);
      analyticsApi.downloadExport(blob, 'product_analytics', 'product_analytics');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportSearchData = async () => {
    try {
      const blob = await analyticsApi.exportAnalyticsData('search_analytics', 'csv', dateRange);
      analyticsApi.downloadExport(blob, 'search_analytics', 'search_analytics');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="analytics-page full-style">
      <div className="container">
        <div className="page-header">
          <h1>Analytics Dashboard</h1>
          <p>Track user engagement and retailer click-through performance</p>
        </div>

        <div className="analytics-content">
          <div className="sidebar">
            <DateRangeFilter 
              onDateRangeChange={setDateRange}
              initialDateRange={dateRange}
            />
          </div>

          <div className="main-section">
            <div className="tab-navigation">
              <button 
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
                data-testid="overview-tab"
              >
                Overview
              </button>
              <button 
                className={`tab ${activeTab === 'retailers' ? 'active' : ''}`}
                onClick={() => setActiveTab('retailers')}
                data-testid="retailers-tab"
              >
                Retailer Performance
              </button>
              <button 
                className={`tab ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
                data-testid="products-tab"
              >
                Product Analytics
              </button>
              <button 
                className={`tab ${activeTab === 'search' ? 'active' : ''}`}
                onClick={() => setActiveTab('search')}
                data-testid="search-tab"
              >
                Search Analytics
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'overview' && (
                <OverviewStats 
                  stats={overviewStats || { totalViews: 0, retailerClicks: 0, productViews: 0, searches: 0, conversionRate: '0.00' }}
                  isLoading={overviewLoading}
                />
              )}

              {activeTab === 'retailers' && (
                <RetailerClicksTable 
                  data={retailerData || []}
                  isLoading={retailerLoading}
                  onExport={handleExportRetailerData}
                />
              )}

              {activeTab === 'products' && (
                <div className="product-analytics" data-testid="product-analytics">
                  <div className="section-header">
                    <h3>Product Performance</h3>
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={handleExportProductData}
                      data-testid="export-product-data"
                    >
                      Export CSV
                    </button>
                  </div>

                  {productLoading ? (
                    <div className="loading-state">Loading product analytics...</div>
                  ) : (
                    <div className="table-container">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Brand</th>
                            <th>Views</th>
                            <th>Clicks</th>
                            <th>Click Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(productData || []).map((product, index) => (
                            <tr key={product.productId} data-testid={`product-row-${index}`}>
                              <td className="product-name">{product.productName}</td>
                              <td className="brand">{product.brand}</td>
                              <td className="views">{product.views.toLocaleString()}</td>
                              <td className="clicks">{product.clicks.toLocaleString()}</td>
                              <td className="click-rate">
                                {product.views > 0 ? ((product.clicks / product.views) * 100).toFixed(2) : '0.00'}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'search' && (
                <div className="search-analytics" data-testid="search-analytics">
                  <div className="section-header">
                    <h3>Search Query Analytics</h3>
                    <button 
                      className="btn btn-small btn-secondary"
                      onClick={handleExportSearchData}
                      data-testid="export-search-data"
                    >
                      Export CSV
                    </button>
                  </div>

                  {searchLoading ? (
                    <div className="loading-state">Loading search analytics...</div>
                  ) : (
                    <div className="table-container">
                      <table className="analytics-table">
                        <thead>
                          <tr>
                            <th>Search Query</th>
                            <th>Total Searches</th>
                            <th>Last Searched</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(searchData || []).map((search, index) => (
                            <tr key={search.query} data-testid={`search-row-${index}`}>
                              <td className="search-query">
                                <code>{search.query}</code>
                              </td>
                              <td className="search-count">{search.searches.toLocaleString()}</td>
                              <td className="last-searched">
                                {new Date(search.lastSearched).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}