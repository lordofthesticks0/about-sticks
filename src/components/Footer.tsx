import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="site-footer">
            <div className="site-footer__content">
                <p className="site-footer__text">
                    thanks <a href="https://github.com/better-lyrics/kawarp" target="_blank" rel="noreferrer" className="site-footer__link">kawarp</a> and <a href="https://github.com/better-lyrics/better-lyrics" target="_blank" rel="noreferrer" className="site-footer__link">better lyrics</a> for the animations and <a href="https://github.com/catppuccin/catppuccin" target="_blank" rel="noreferrer" className="site-footer__link">catppuccin</a> for the colors!
                </p>
            </div>
        </footer>
    );
};

export default Footer;
