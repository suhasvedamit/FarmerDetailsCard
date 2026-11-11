import React from 'react';
import {
  FileText,
  ShieldCheck,
  Mail,
  AlertTriangle,
  Home,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AppPage, getPageUrl } from '../lib/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageLayoutProps {
  currentPage: AppPage;
  title: string;
  subtitle: string;
  marathiSubtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
  onNavigate?: (page: AppPage) => void;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  currentPage,
  title,
  subtitle,
  marathiSubtitle,
  lastUpdated = 'नोव्हेंबर २०२६ / November 2026',
  children,
  onNavigate,
}) => {
  const subNavItems: { page: AppPage; label: string; icon: React.ReactNode }[] = [
    { page: 'terms', label: 'Terms & Conditions', icon: <FileText className="w-3.5 h-3.5" /> },
    { page: 'privacy', label: 'Privacy Policy', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { page: 'disclaimer', label: 'Legal Disclaimer', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { page: 'contact', label: 'Contact Us', icon: <Mail className="w-3.5 h-3.5" /> },
  ];

  const handleNavigate = (page: AppPage) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      window.history.pushState({}, '', getPageUrl(page));
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: AppPage) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    handleNavigate(page);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Unified Site Header */}
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb + Sub-page Pill Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
          <nav className="flex items-center space-x-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
            <a
              href={getPageUrl('home')}
              onClick={(e) => handleLinkClick(e, 'home')}
              className="hover:text-emerald-700 transition flex items-center space-x-1 font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </a>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 font-semibold">{title}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-1.5">
            {subNavItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <a
                  key={item.page}
                  href={getPageUrl(item.page)}
                  onClick={(e) => handleLinkClick(e, item.page)}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 border border-slate-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Page Title & Subtitle Banner */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50/70 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Information &amp; Guidelines
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Last Updated: {lastUpdated}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>

            {marathiSubtitle && (
              <p className="text-sm font-medium text-emerald-700">
                {marathiSubtitle}
              </p>
            )}

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl pt-1">
              {subtitle}
            </p>
          </div>
        </section>

        {/* Page Body Content */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          {children}
        </div>

        {/* Quick Link Navigation Box */}
        <section className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-slate-900">
              Ready to create your Farmer Summary Card?
            </h3>
            <p className="text-xs text-slate-600">
              Upload your PM-Kisan or AgriStack PDF document to extract details and generate front &amp; back printable cards instantly.
            </p>
          </div>
          <a
            href={getPageUrl('create-card')}
            onClick={(e) => handleLinkClick(e, 'create-card')}
            className="shrink-0 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <span>Open Card Maker</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} openInSameTab={true} />
    </div>
  );
};
