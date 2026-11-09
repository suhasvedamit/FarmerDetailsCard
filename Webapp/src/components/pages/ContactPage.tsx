import React, { useState } from 'react';
import { PageLayout } from '../PageLayout';
import { AppPage } from '../../lib/navigation';
import {
  Mail,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  FileText,
  CreditCard,
  Printer
} from 'lucide-react';

interface ContactPageProps {
  onNavigate?: (page: AppPage) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const supportEmail = 'support@farmercard.org';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenEmail = () => {
    const subject = encodeURIComponent('Farmer Details Card - Support Inquiry');
    const body = encodeURIComponent(
      'Hello Support Team,\n\nI have an inquiry regarding:\n[ ] PDF upload / extraction\n[ ] Photo cropping\n[ ] Card printing\n[ ] Other\n\nDetails:\n\n--\nSent from Farmer Details Card Maker web app'
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <PageLayout
      currentPage="contact"
      title="Contact Us & Support"
      subtitle="Have questions about extracting your PDF, editing photos, or printing your card? Reach out to our technical team."
      marathiSubtitle="संपर्क व मदत केंद्र (Contact & Help Center)"
      lastUpdated="नोव्हेंबर २०२६ / November 2026"
      onNavigate={onNavigate}
    >
      <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Email Channel Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Mail className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Primary Channel
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                Email Support
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                For technical issues, bug reports, and data inquiries.
              </p>
            </div>

            <div className="pt-1 space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 transition truncate"
                >
                  {supportEmail}
                </a>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1.5 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition shrink-0"
                  title="Copy email address"
                  aria-label="Copy email address"
                >
                  {copiedEmail ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {copiedEmail && (
                <p className="text-[11px] text-emerald-700 font-semibold text-center">
                  Email address copied to clipboard!
                </p>
              )}
            </div>
          </div>

          {/* Response Time Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100/80 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Turnaround Time
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">
                Support Hours & Timing
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Our team reviews tickets Monday through Saturday.
              </p>
            </div>

            <div className="space-y-2 pt-1 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-800 font-semibold">
                  <span>Mon – Fri:</span>
                  <span>9:00 AM – 6:00 PM IST</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Sat - Sun:</span>
                  <span>Closed</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                ⚡ Typical reply time: <strong>Within 7 to 14 days</strong>
              </p>
            </div>
          </div>

        </div>

      </div>
    </PageLayout>
  );
};
