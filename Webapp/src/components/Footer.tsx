import React from 'react';
import {
  FileText,
  Mail,
  ExternalLink,
  CreditCard,
  ShieldAlert,
} from 'lucide-react';
import { AppPage, getPageUrl } from '../lib/navigation';
import { useLanguage } from '../i18n';

interface FooterProps {
  onNavigate?: (page: AppPage) => void;
  openInSameTab?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, openInSameTab = true }) => {
  const { t, format } = useLanguage();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Column 1: Disclaimer (Spans 2 cols on lg) */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-[11px] leading-relaxed text-slate-400">
              <div className="flex items-center space-x-1.5 text-amber-400 font-semibold mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{t.footer.disclaimerTitle}</span>
              </div>
              <p>
                {t.footer.disclaimerBodyStart}{' '}
                <strong className="text-slate-300">{t.footer.disclaimerBodyNot}</strong>
                {t.footer.disclaimerBodyEnd.startsWith('.') ? t.footer.disclaimerBodyEnd : ` ${t.footer.disclaimerBodyEnd}`}
              </p>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.footer.productTitle}</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={getPageUrl('home')}
                  target={linkTarget}
                  rel={linkRel}
                  onClick={(e) => handleLinkClick(e, 'home')}
                  className="hover:text-emerald-400 transition flex items-center justify-between group py-0.5"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {t.footer.homeOverview}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href={getPageUrl('create-card')}
                  target={linkTarget}
                  rel={linkRel}
                  onClick={(e) => handleLinkClick(e, 'create-card')}
                  className="hover:text-emerald-400 transition flex items-center justify-between group py-0.5 font-medium text-emerald-300"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {t.footer.cardMakerStudio}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href={getPageUrl('pvc-makers')}
                  target={linkTarget}
                  rel={linkRel}
                  onClick={(e) => handleLinkClick(e, 'pvc-makers')}
                  className="hover:text-emerald-400 transition flex items-center justify-between group py-0.5 font-medium text-amber-300"
                >
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {t.footer.orderPvcCard}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.footer.legalPoliciesTitle}</span>
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
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {t.footer.termsAndConditions}
                  </span>
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
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {t.footer.privacyPolicy}
                  </span>
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
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {t.footer.legalDisclaimerNotice}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.footer.contactSupportTitle}</span>
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
                    {t.footer.contactFeedback}
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
                    {t.footer.reportIssue}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </a>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                {t.footer.supportLabel} <span className="text-slate-300">sairajservice7@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Credit Bar */}
        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>{format(t.footer.copyright, { year: currentYear })}</p>

          <p className="text-slate-400 text-center sm:text-right">
            {t.footer.designedBy}{' '}
            <a
              href="https://vedamit.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline-offset-2 hover:underline transition"
            >
              {t.footer.developerName}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
