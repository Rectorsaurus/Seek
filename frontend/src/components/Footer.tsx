import { useAgeVerification } from '../hooks/useAgeVerification';
import './Footer.css';

export function Footer() {
  const { resetVerification } = useAgeVerification();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Legal Disclaimer</h4>
            <p>
              <strong>Warning:</strong> Tobacco products contain nicotine. Nicotine is an addictive chemical.
              You must be 21 years of age or older to view tobacco product information.
            </p>
            <p>
              This website does not sell tobacco products directly. We provide price comparison 
              information and link to authorized retailers. All purchases are made through 
              third-party retailers who are responsible for age verification and compliance 
              with applicable laws.
            </p>
          </div>

          <div className="footer-section">
            <h4>About Seek</h4>
            <p>
              Seek is a price comparison platform for pipe tobacco enthusiasts. We aggregate 
              product information and pricing from authorized online retailers to help you 
              find the best deals on your favorite tobacco blends.
            </p>
          </div>

          <div className="footer-section">
            <h4>Resources</h4>
            <ul>
              <li>
                <a 
                  href="https://www.cdc.gov/tobacco/basic_information/health_effects/index.htm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Health Effects of Tobacco Use
                </a>
              </li>
              <li>
                <a 
                  href="https://www.smokefree.gov/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Smokefree.gov
                </a>
              </li>
              <li>
                <button 
                  type="button"
                  className="age-verification-reset"
                  onClick={resetVerification}
                  aria-label="Reset age verification"
                >
                  Reset Age Verification
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Seek. This website is for informational purposes only.</p>
          <p>
            All trademarks and product names are the property of their respective owners. 
            We are not affiliated with any tobacco manufacturer or retailer.
          </p>
        </div>
      </div>
    </footer>
  );
}