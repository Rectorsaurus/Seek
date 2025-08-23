import { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Search by tobacco name, brand, or blend...",
  initialValue = "",
  className = ""
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(initialValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        // Default behavior - navigate to search page
        window.location.href = `/search?query=${encodeURIComponent(searchQuery.trim())}`;
      }
    }
  };

  return (
    <form onSubmit={handleSearch} className={`search-bar ${className}`}>
      <div className="search-input-group">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        <button type="submit" className="search-button">
          Seek
        </button>
      </div>
    </form>
  );
}