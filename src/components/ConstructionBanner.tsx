import React from 'react';
import './ConstructionBanner.css';

const ConstructionBanner: React.FC = () => {
    return (
        <div className="construction-banner">
            <span className="construction-banner__icon" role="img" aria-label="construction">🚧</span>
            <p className="construction-banner__text">
                still working on this site!! bear with me ok :)
            </p>
            <span className="construction-banner__icon" role="img" aria-label="construction">🚧</span>
        </div>
    );
};

export default ConstructionBanner;
