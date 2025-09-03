import { OverviewStats as OverviewStatsType } from '../../services/analyticsApi';

interface OverviewStatsProps {
  stats: OverviewStatsType;
  isLoading?: boolean;
}

export function OverviewStats({ stats, isLoading }: OverviewStatsProps) {
  if (isLoading) {
    return (
      <div className="overview-stats loading" data-testid="overview-stats-loading">
        <div className="stats-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="stat-card loading">
              <div className="loading-line short"></div>
              <div className="loading-line medium"></div>
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
    <div className="overview-stats" data-testid="overview-stats">
      <h2>Analytics Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card" data-testid="total-views-stat">
          <div className="stat-value">{formatNumber(stats.totalViews)}</div>
          <div className="stat-label">Total Page Views</div>
        </div>

        <div className="stat-card" data-testid="retailer-clicks-stat">
          <div className="stat-value">{formatNumber(stats.retailerClicks)}</div>
          <div className="stat-label">Retailer Clicks</div>
        </div>

        <div className="stat-card" data-testid="product-views-stat">
          <div className="stat-value">{formatNumber(stats.productViews)}</div>
          <div className="stat-label">Product Views</div>
        </div>

        <div className="stat-card" data-testid="searches-stat">
          <div className="stat-value">{formatNumber(stats.searches)}</div>
          <div className="stat-label">Searches</div>
        </div>

        <div className="stat-card conversion-rate" data-testid="conversion-rate-stat">
          <div className="stat-value">{stats.conversionRate}%</div>
          <div className="stat-label">Conversion Rate</div>
          <div className="stat-note">Clicks to Total Views</div>
        </div>
      </div>
    </div>
  );
}