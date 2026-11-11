import React, { useState } from 'react';
import { Menu, X, CreditCard, ArrowRight, Home, Mail } from 'lucide-react';
import logoImg from '../assets/logo.png';
import { AppPage, getPageUrl } from '../lib/navigation';
import { useLanguage } from '../i18n';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navItems: { page: AppPage; label: string; icon: React.ReactNode }[] = [
    { page: 'home', label: t.common.home, icon: <Home className="w-4 h-4" /> },
    { page: 'contact', label: t.common.contact, icon: <Mail className="w-4 h-4" /> },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, page: AppPage) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    setMobileMenuOpen(false);
    onNavigate(page);
  };

  return (
    <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-800 text-white shadow-md sticky top-0 z-40 border-b border-emerald-700/60 print:hidden">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Logo & Brand */}
        <a
          href={getPageUrl('home')}
          onClick={(e) => handleNavClick(e, 'home')}
          className="flex items-center space-x-2.5 sm:space-x-3 group focus:outline-none min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center p-1 shadow-sm border border-emerald-500/40 bg-white/95 group-hover:scale-105 transition-transform shrink-0">
            <img src={logoImg} alt={t.common.appName} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-emerald-100 transition truncate">
                {t.common.appName}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 hidden lg:block truncate">
              {t.header.brandSubtitle}
            </p>
          </div>
        </a>

        {/* Right: Desktop Navigation + Language Switcher + Action Button */}
        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          <nav className="hidden md:flex items-center space-x-1" aria-label={t.header.mainNavAria}>
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <a
                  key={item.page}
                  href={getPageUrl(item.page)}
                  onClick={(e) => handleNavClick(e, item.page)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-emerald-950/70 text-white border border-emerald-500/40 shadow-sm'
                      : 'text-emerald-100/90 hover:text-white hover:bg-emerald-700/60 border border-transparent'
                  }`}
                >
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <LanguageSelector variant="header" />

          <a
            href={getPageUrl('create-card')}
            onClick={(e) => handleNavClick(e, 'create-card')}
            className={`px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5 whitespace-nowrap ${
              currentPage === 'create-card'
                ? 'bg-emerald-100 text-emerald-950 ring-2 ring-emerald-300/60'
                : 'bg-white hover:bg-emerald-50 text-emerald-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{t.common.createCard}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700 hidden sm:inline shrink-0" />
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700/60 transition focus:outline-none"
            aria-label={mobileMenuOpen ? t.header.closeMenuAria : t.header.openMenuAria}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-emerald-900/95 border-t border-emerald-700/60 px-4 py-3 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <a
                  key={item.page}
                  href={getPageUrl(item.page)}
                  onClick={(e) => handleNavClick(e, item.page)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-sm'
                      : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
