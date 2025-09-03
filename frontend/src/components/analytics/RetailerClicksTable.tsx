import { RetailerClickStats } from '../../services/analyticsApi';

interface RetailerClicksTableProps {
  data: RetailerClickStats[];
  isLoading?: boolean;
  onExport?: () => void;
}

export function RetailerClicksTable({ data, isLoading, onExport }: RetailerClicksTableProps) {
  if (isLoading) {
    return (
      <div className="retailer-clicks-table loading" data-testid="retailer-clicks-loading">
        <div className="table-header">
          <h3>Retailer Click-Through Analytics</h3>
          <div className="loading-line short"></div>
        </div>
        <div className="table-loading">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="loading-row">
              <div className="loading-line medium"></div>
              <div className="loading-line short"></div>
              <div className="loading-line long"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="retailer-clicks-table" data-testid="retailer-clicks-table">
      <div className="table-header">
        <h3>Retailer Click-Through Analytics</h3>
        {onExport && (
          <button 
            className="btn btn-small btn-secondary"
            onClick={onExport}
            data-testid="export-retailer-data"
          >
            Export CSV
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="no-data">
          <p>No retailer click data found for the selected period.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Retailer</th>
                <th>Total Clicks</th>
                <th>Top Products</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {data.map((retailer, index) => (
                <tr key={retailer.retailer} data-testid={`retailer-row-${index}`}>
                  <td className="retailer-name">
                    <strong>{retailer.retailer}</strong>
                  </td>
                  <td className="click-count">
                    <span className="number">{formatNumber(retailer.clicks)}</span>
                  </td>
                  <td className="top-products">
                    <div className="product-list">
                      {retailer.products.slice(0, 3).map((product) => (
                        <div key={product.productId} className="product-item">
                          <span className="product-name">{product.productName}</span>
                          <span className="product-clicks">({formatNumber(product.clicks)} clicks)</span>
                        </div>
                      ))}
                      {retailer.products.length > 3 && (
                        <div className="more-products">
                          +{retailer.products.length - 3} more
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="performance">
                    <div className="performance-bar">
                      <div 
                        className="performance-fill"
                        style={{ 
                          width: `${Math.min((retailer.clicks / Math.max(...data.map(r => r.clicks))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.length > 0 && (
        <div className="table-summary">
          <div className="summary-stats">
            <span>Total Retailers: {data.length}</span>
            <span>Total Clicks: {formatNumber(data.reduce((sum, r) => sum + r.clicks, 0))}</span>
            <span>
              Top Performer: {data[0]?.retailer} ({formatNumber(data[0]?.clicks || 0)} clicks)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}