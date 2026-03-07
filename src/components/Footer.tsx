import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="site-footer">
            <div className="site-footer__content">
                <p className="site-footer__text">
                    thanks <a href="https://github.com/catppuccin/catppuccin" target="_blank" rel="noreferrer" className="site-footer__link">catppuccin frappé</a> for the colours!
                </p>
            </div>
        </footer>
    );
};

export default Footer;
