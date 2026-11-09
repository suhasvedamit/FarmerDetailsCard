import React from 'react';
import {
  FileText,
  ShieldCheck,
  Mail,
  AlertTriangle,
  CreditCard,
  QrCode,
  ShieldAlert,
  ExternalLink,
  Printer,
  Sparkles,
  Lock
} from 'lucide-react';
import { AppPage, getPageUrl } from '../lib/navigation';
import logoImg from '../assets/logo.png';

interface FooterProps {
  onNavigate?: (page: AppPage) => void;
  openInSameTab?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, openInSameTab = false }) => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: AppPage) => {
    if (openInSameTab && onNavigate) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      onNavigate(page);
    }
  };

  const linkTarget = openInSameTab ? undefined : '_blank';
  const linkRel = openInSameTab ? undefined : 'noopener noreferrer';

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs mt-auto print:hidden">
      {/* Main Footer Links & Information Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

          {/* Column 1: Brand & About (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <strong className="text-slate-300">Important Disclaimer:</strong> This web utility is provided solely for informational and personal convenience formatting. The cards produced are unofficial summary cards and do NOT hold statutory, official, or legal validity. They cannot be used as government-issued identity cards, official agricultural certifications, or statutory proof in legal proceedings. All respective official marks and portal names belong strictly to their governmental authorities.
          </div>

          {/* Column 2: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Legal & Policies</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={getPageUrl('terms')}
                  target={linkTarget}
                  rel={linkRel}
                  onClick={(e) => handleLinkClick(e, 'terms')}
                  className="hover:text-emerald-400 transition flex items-center justify-between group py-0.5"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Terms and Conditions</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href={getPageUrl('privacy')}
                  target={linkTarget}
                  rel={linkRel}
                  onClick={(e) => handleLinkClick(e, 'privacy')}
                  className="hover:text-emerald-400 transition flex items-center justify-between group py-0.5"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Privacy Policy</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href={getPageUrl('disclaimer')}
                  target={linkTarget}
                  rel={linkRel}
                  onClick={(e) => handleLinkClick(e, 'disclaimer')}
                  className="hover:text-emerald-400 transition flex items-center justify-between group py-0.5"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">Legal Disclaimer & Notice</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact Us</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={getPageUrl('contact')}
                  target={linkTarget}
                  rel={linkRel}
                  onClick={(e) => handleLinkClick(e, 'contact')}
                  className="hover:text-emerald-400 transition flex items-center justify-between group py-0.5"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform font-medium text-emerald-300">
                    Contact Us / Feedback
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href={getPageUrl('contact')}
                  target={linkTarget}
                  rel={linkRel}
                  onClick={(e) => handleLinkClick(e, 'contact')}
                  className="hover:text-emerald-400 transition flex items-center justify-between group py-0.5"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    Report an Issue / Bug
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Support: <span className="text-slate-300">support@farmercard.org</span>
              </li>
            </ul>
          </div>

        </div>


        {/* Bottom Copyright & Credit Bar */}
        <div className="mt-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>
            © {currentYear} Farmer ID Card Utility Project. All rights reserved.
          </p>

          <div className="flex items-center space-x-1.5 text-slate-400">
            <span>Built with care for Indian Farmers</span>
            <span role="img" aria-label="Indian Flag">🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
