import './AgeVerificationModal.css';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerify: () => void;
  onReject: () => void;
}

export function AgeVerificationModal({ isOpen, onVerify, onReject }: AgeVerificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="age-verification-overlay" role="dialog" aria-labelledby="age-verification-title" aria-modal="true">
      <div className="age-verification-modal">
        <div className="age-verification-content">
          <h2 id="age-verification-title">Age Verification Required</h2>
          
          <div className="age-verification-text">
            <p>This website contains information about tobacco products.</p>
            <p>You must be <strong>21 years of age or older</strong> to view this content.</p>
            <p className="disclaimer">
              <strong>Warning:</strong> This product contains nicotine. Nicotine is an addictive chemical.
            </p>
          </div>

          <div className="age-verification-buttons">
            <button 
              type="button"
              className="btn-verify"
              onClick={onVerify}
              aria-label="I am 21 or older"
            >
              I am 21 or older
            </button>
            <button 
              type="button"
              className="btn-reject"
              onClick={onReject}
              aria-label="I am under 21"
            >
              I am under 21
            </button>
          </div>

          <div className="legal-notice">
            <p>This website does not sell tobacco products directly. We provide price comparison information and link to authorized retailers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}