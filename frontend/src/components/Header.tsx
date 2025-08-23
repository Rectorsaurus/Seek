import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>Seek</h1>
          <span className="tagline">Pipe Tobacco Price Comparison</span>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/search" className="nav-link">Search</Link>
        </nav>
      </div>
    </header>
  );
}