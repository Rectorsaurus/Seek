import { useState } from 'react';
import { DateRange } from '../../services/analyticsApi';

interface DateRangeFilterProps {
  onDateRangeChange: (dateRange: DateRange) => void;
  initialDateRange?: DateRange;
}

export function DateRangeFilter({ onDateRangeChange, initialDateRange }: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState(initialDateRange?.startDate || '');
  const [endDate, setEndDate] = useState(initialDateRange?.endDate || '');

  const handleApply = () => {
    onDateRangeChange({
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  const handlePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    setStartDate(startStr);
    setEndDate(endStr);

    onDateRangeChange({
      startDate: startStr,
      endDate: endStr
    });
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onDateRangeChange({});
  };

  return (
    <div className="date-range-filter" data-testid="date-range-filter">
      <div className="filter-header">
        <h3>Date Range</h3>
      </div>

      <div className="preset-buttons">
        <button 
          type="button"
          className="btn btn-small btn-secondary"
          onClick={() => handlePreset(7)}
        >
          Last 7 days
        </button>
        <button 
          type="button"
          className="btn btn-small btn-secondary"
          onClick={() => handlePreset(30)}
        >
          Last 30 days
        </button>
        <button 
          type="button"
          className="btn btn-small btn-secondary"
          onClick={() => handlePreset(90)}
        >
          Last 90 days
        </button>
      </div>

      <div className="custom-range">
        <div className="date-inputs">
          <div className="input-group">
            <label htmlFor="start-date">Start Date:</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              data-testid="start-date-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="end-date">End Date:</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              data-testid="end-date-input"
            />
          </div>
        </div>

        <div className="filter-actions">
          <button 
            type="button"
            className="btn btn-small btn-primary"
            onClick={handleApply}
            data-testid="apply-date-filter"
          >
            Apply
          </button>
          <button 
            type="button"
            className="btn btn-small btn-secondary"
            onClick={handleClear}
            data-testid="clear-date-filter"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}