import React from 'react';
import { PageLayout } from '../PageLayout';
import { AppPage } from '../../lib/navigation';
import {
  ShieldCheck,
  Lock,
  Cpu,
  EyeOff,
  Database,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Mail,
  ExternalLink
} from 'lucide-react';

interface PrivacyPageProps {
  onNavigate?: (page: AppPage) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      currentPage="privacy"
      title="Privacy Policy"
      subtitle="We believe farmer data is private and confidential. Learn how your documents and personal details are protected using client-side processing."
      marathiSubtitle="गोपनीयता धोरण (Privacy Policy & Data Security)"
      lastUpdated="नोव्हेंबर २०२६ / November 2026"
      onNavigate={onNavigate}
    >
      <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
        {/* Highlight Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <h2 className="text-base font-bold">Our Core Privacy Commitment</h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-950">
            <strong>Zero Data Monetization. Zero Third-Party Advertising. Zero Document Harvesting.</strong>{' '}
            Your uploaded PDF certificates and farmer personal details belong entirely to you. Our architecture is designed to parse documents <strong>locally inside your browser</strong> whenever possible.
          </p>
        </div>

        {/* 1. Client-Side In-Browser Processing */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Cpu className="w-5 h-5 text-emerald-700" />
            <h3>1. Client-Side In-Browser Architecture (ब्राउझरमध्येच प्रक्रिया)</h3>
          </div>
          <p>
            Unlike traditional web tools that send your entire PDF document to remote cloud servers for processing:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Local PDF Text & Photo Extraction</span>
              </span>
              <p className="text-slate-600">
                PDF text reading and photo detection are executed right inside your computer or smartphone browser using <strong>PDF.js</strong> and client-side JavaScript.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Local Card Rendering</span>
              </span>
              <p className="text-slate-600">
                Card templates (Front and Back) are composited directly onto an HTML5 Canvas on your device, ensuring maximum speed, confidentiality, and offline resilience.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Information Handled */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <EyeOff className="w-5 h-5 text-emerald-700" />
            <h3>2. Information We Handle (प्रक्रिया केली जाणारी माहिती)</h3>
          </div>
          <p>
            When you upload an official document, the tool automatically reads specific fields necessary to format your summary card:
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-2">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 list-disc pl-5">
              <li>Farmer Full Name (शेतकऱ्याचे नाव)</li>
              <li>Father / Husband Name (पालकाचे नाव)</li>
              <li>Farmer ID / PM Kisan Registration Number</li>
              <li>Date of Birth & Age (जन्मतारीख व वय)</li>
              <li>Gender & Caste Category (लिंग व वर्ग)</li>
              <li>Mobile Number (मोबाईल नंबर)</li>
              <li>Address, Village, Taluka, District, State</li>
              <li>Land Survey / Gat Numbers & Total Area</li>
              <li>Bank Name, Account & IFSC Code</li>
              <li>Profile Photo from the certificate</li>
            </ul>
          </div>
          <p className="text-xs text-slate-500 italic">
            Note: Sensitive numbers (such as Aadhaar) are masked or not stored in unencrypted plain-text format.
          </p>
        </section>

        {/* 3. QR Code & Verification Data */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Database className="w-5 h-5 text-emerald-700" />
            <h3>3. QR Code & Online Verification Link (क्यूआर कोड कार्यप्रणाली)</h3>
          </div>
          <p>
            The generated card features a QR code on the back side. When scanned:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>
              The QR code encodes a compressed payload or verification URL that opens the <strong>Farmer Verification Summary Page</strong>.
            </li>
            <li>
              This allows anyone scanning the card (such as a cooperative supervisor, fertilizer store, or family member) to quickly verify that the printed details match the digital summary.
            </li>
            <li>
              The verification data is encoded safely and contains only the summary information visible on the physical card.
            </li>
          </ul>
        </section>

        {/* 4. No Third-Party Data Sharing */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Lock className="w-5 h-5 text-emerald-700" />
            <h3>4. Zero Third-Party Sharing (माहिती सुरक्षितता)</h3>
          </div>
          <p>
            We adhere to strict data privacy principles:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>
              <strong>No Sale of Data:</strong> We never sell, rent, or trade farmer records to any telemarketers, credit bureaus, insurance agents, or commercial entities.
            </li>
            <li>
              <strong>No Advertising Trackers:</strong> We do not host ad network trackers (like Google Ads, Meta Pixel) that monitor your personal browsing habits.
            </li>
            <li>
              <strong>No Unsolicited Messages:</strong> We will never send marketing SMS, automated calls, or spam emails to the phone numbers extracted from your documents.
            </li>
          </ul>
        </section>

        {/* 5. User Rights & Data Deletion */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <Trash2 className="w-5 h-5 text-emerald-700" />
            <h3>5. User Rights & Data Deletion (माहिती हटवण्याचा अधिकार)</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            As a user, you retain complete authority over your personal information:
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs sm:text-sm">
            <p>
              If at any time you wish to have your session logs or card verification record deleted from our database, simply send an email to <strong className="text-slate-900">support@farmercard.org</strong> with your Farmer ID or session identifier. We will permanently purge the record within 72 business hours.
            </p>
          </div>
        </section>

        {/* 6. Security Standards */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h3>6. Security Measures (सुरक्षा उपाययोजना)</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            All data transmitted between your browser and our servers is protected by industry-standard <strong>HTTPS with TLS 1.3 / 256-bit encryption</strong>. Our hosting environment follows modern cloud hardening and isolation practices.
          </p>
        </section>

        {/* Contact Footer */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Questions or concerns about privacy? Contact our Privacy Officer at <span className="font-semibold text-slate-700">support@farmercard.org</span>.
          </p>
          <button
            onClick={() => onNavigate ? onNavigate('contact') : undefined}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
          >
            <span>Contact Privacy Support</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

