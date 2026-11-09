import React from 'react';
import {
  FileText,
  ShieldCheck,
  Mail,
  AlertTriangle,
  Home,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Printer,
  Share2,
  Check
} from 'lucide-react';
import { AppPage, getPageUrl } from '../lib/navigation';
import logoImg from '../assets/logo.png';
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
  const [copied, setCopied] = React.useState(false);

  const navItems: { page: AppPage; label: string; icon: React.ReactNode }[] = [
    { page: 'terms', label: 'Terms & Conditions', icon: <FileText className="w-4 h-4" /> },
    { page: 'privacy', label: 'Privacy Policy', icon: <ShieldCheck className="w-4 h-4" /> },
    { page: 'disclaimer', label: 'Legal Disclaimer', icon: <AlertTriangle className="w-4 h-4" /> },
    { page: 'contact', label: 'Contact Us', icon: <Mail className="w-4 h-4" /> },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: AppPage) => {
    // If user clicked with Ctrl/Cmd or shift or middle click, allow native new tab
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) {
      return;
    }
    e.preventDefault();
    if (onNavigate) {
      onNavigate(page);
    } else {
      window.history.pushState({}, '', getPageUrl(page));
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} - Farmer Details Card`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Ignore user cancellation
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Logo and Brand */}
          <a
            href={getPageUrl('home')}
            onClick={(e) => handleLinkClick(e, 'home')}
            className="flex items-center space-x-3 group cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center p-1 shadow-sm bg-white/10 group-hover:bg-white/20 transition">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-emerald-100 transition">
                  Farmer Details Card
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 hidden md:block">
                Summary card formatting utility for farmer documents
              </p>
            </div>
          </a>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <a
              href={getPageUrl('home')}
              onClick={(e) => handleLinkClick(e, 'home')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Card Maker</span>
            </a>
          </div>
        </div>

        {/* Secondary Subnav Strip for Mobile & Desktop */}
        <div className="bg-emerald-900/90 border-t border-emerald-700/60 overflow-x-auto scrollbar-thin">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 py-1.5">
            {navItems.map((item) => {
              const isActive = currentPage === item.page;
              return (
                <a
                  key={item.page}
                  href={getPageUrl(item.page)}
                  onClick={(e) => handleLinkClick(e, item.page)}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${isActive
                      ? 'bg-white text-emerald-900 shadow-sm font-semibold'
                      : 'text-emerald-100/90 hover:text-white hover:bg-emerald-800/80'
                    }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Utilities */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-b border-slate-200 pb-3 print:hidden">
          <nav className="flex items-center space-x-1.5" aria-label="Breadcrumb">
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

          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-medium transition flex items-center space-x-1 text-xs"
              title="Share or copy page link"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Share</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-medium transition flex items-center space-x-1 text-xs"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>
            <a
              href={getPageUrl('home')}
              onClick={(e) => handleLinkClick(e, 'home')}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-bold transition flex items-center space-x-1 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Maker</span>
            </a>
          </div>
        </div>

        {/* Page Title & Subtitle Banner */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50/70 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Official Information & Guidelines
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
              Upload your PM-Kisan or AgriStack PDF document to extract details and generate front & back printable cards instantly.
            </p>
          </div>
          <a
            href={getPageUrl('home')}
            onClick={(e) => handleLinkClick(e, 'home')}
            className="shrink-0 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <span>Open Card Generator</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

