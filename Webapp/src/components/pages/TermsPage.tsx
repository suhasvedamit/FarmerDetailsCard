import React from 'react';
import { PageLayout } from '../PageLayout';
import { AppPage } from '../../lib/navigation';
import {
  ShieldAlert,
  FileCheck,
  Ban,
  Scale,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';

interface TermsPageProps {
  onNavigate?: (page: AppPage) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <PageLayout
      currentPage="terms"
      title="Terms and Conditions"
      subtitle="Please read these terms and conditions carefully before using the Farmer Details Card formatting service. By accessing this tool, you agree to comply with all terms stated herein."
      marathiSubtitle="वापराचे नियम व अटी (Terms of Service)"
      lastUpdated="नोव्हेंबर २०२६ / November 2026"
      onNavigate={onNavigate}
    >
      <div className="space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
        {/* Important Warning Callout */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl space-y-2">
          <div className="flex items-center space-x-2 text-amber-800 font-bold">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-bold">Crucial Non-Government Notice</h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-900 leading-normal">
            This web application is an <strong>independent, third-party utility tool</strong>. It is <strong>NOT affiliated with, authorized, maintained, or endorsed</strong> by the Government of India, the Ministry of Agriculture & Farmers Welfare, PM-KISAN, AgriStack, or any other government authority. Cards generated have <strong>no official or legal validity</strong>.
          </p>
        </div>

        {/* 1. Acceptance of Terms */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">1</span>
            <h3>Acceptance of Terms (नियम मान्य करणे)</h3>
          </div>
          <p>
            By accessing, uploading any document to, or generating a card from the <strong>Farmer Details Card Maker</strong> ("we", "our", or "the Service"), you acknowledge that you have read, understood, and unconditionally agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must immediately refrain from using this website.
          </p>
        </section>

        {/* 2. Nature and Scope of Service */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">2</span>
            <h3>Nature and Scope of Service (सेवेचे स्वरूप)</h3>
          </div>
          <p>
            The Service operates strictly as an automated text parsing and layout formatting utility:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>
              It allows users to upload PDF certificates or registration slips they lawfully hold from official agricultural portals.
            </li>
            <li>
              It extracts textual information (e.g., Name, Farmer ID, Village, Land summary) and photos locally in the user's browser.
            </li>
            <li>
              It renders this information onto a standard CR-80 card template (Front and Back) for convenient printing on PVC cards, photo paper, or laminated sheets.
            </li>
            <li>
              It does <strong>not issue</strong> farmer IDs, does not register farmers in government portals, and does not alter official agricultural records.
            </li>
          </ul>
        </section>

        {/* 3. Strict Non-Government Affiliation */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">3</span>
            <h3>Strict Non-Government Affiliation (शासकीय संबंध नसणे)</h3>
          </div>
          <p>
            You explicitly acknowledge and agree that:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
              <strong className="text-slate-900 block mb-1">No Official Status:</strong>
              This application has zero official status and is not an agency or contractor for any central, state, or local government department.
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
              <strong className="text-slate-900 block mb-1">No Statutory Validity:</strong>
              Cards generated cannot replace official identity documents such as Aadhaar, Voter ID, PAN card, or certified Revenue 7/12 extracts.
            </div>
          </div>
        </section>

        {/* 4. Permitted and Authorized Use */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">4</span>
            <h3>Permitted and Authorized Use (अधिकृत वापर)</h3>
          </div>
          <p>
            You agree to use this Service only for lawful, legitimate, and ethical purposes. Permitted use cases include:
          </p>
          <div className="space-y-2">
            <div className="flex items-start space-x-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>An individual farmer converting their own official registration document into a pocket card.</span>
            </div>
            <div className="flex items-start space-x-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>A family member helping an elder farmer generate a convenient summary card for local reference.</span>
            </div>
            <div className="flex items-start space-x-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>A Village Level Entrepreneur (VLE), CSC operator, or cyber cafe providing legitimate document formatting assistance with the explicit permission of the farmer.</span>
            </div>
          </div>
        </section>

        {/* 5. Strictly Prohibited Uses */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center text-xs font-bold">5</span>
            <h3 className="text-red-900">Strictly Prohibited Uses (प्रतिबंधित वापर)</h3>
          </div>
          <p>
            You are strictly forbidden from engaging in any of the following activities:
          </p>
          <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 space-y-2.5 text-xs sm:text-sm text-red-950">
            <div className="flex items-start space-x-2">
              <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>Uploading documents that do not belong to you or for which you lack explicit authorization.</span>
            </div>
            <div className="flex items-start space-x-2">
              <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>Creating fake, forged, altered, or counterfeit cards to mislead financial institutions, government officers, or local markets.</span>
            </div>
            <div className="flex items-start space-x-2">
              <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>Misrepresenting the generated card as an "Official Government ID" or selling cards under false government pretenses.</span>
            </div>
            <div className="flex items-start space-x-2">
              <Ban className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>Attempting to reverse engineer, disrupt, overload, or inject malicious code into the application infrastructure.</span>
            </div>
          </div>
        </section>

        {/* 6. User Responsibility for Accuracy */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">6</span>
            <h3>User Responsibility for Accuracy (माहितीची अचूकता)</h3>
          </div>
          <p>
            Automated optical character recognition (OCR) and text parsing are subject to variance depending on the quality and format of the source PDF.
          </p>
          <p className="text-xs sm:text-sm text-slate-600">
            <strong>You are solely responsible</strong> for reviewing, editing, and verifying all names, ID numbers, mobile numbers, land records, and bank information in the built-in form editor <strong>before</strong> generating, downloading, or printing any card. We assume no responsibility for errors, typos, or inaccuracies printed on the card.
          </p>
        </section>

        {/* 7. Disclaimer of Warranties & Limitation of Liability */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">7</span>
            <h3>Limitation of Liability (दायित्वाची मर्यादा)</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            The Service is provided on an <strong>"AS IS" and "AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied. Under no circumstances shall the developers, contributors, or host platform be held liable for any direct, indirect, incidental, special, punitive, or consequential damages resulting from the use or inability to use this service, or any reliance placed upon generated outputs.
          </p>
        </section>

        {/* 8. Intellectual Property & Fair Use */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">8</span>
            <h3>Intellectual Property & Trademarks (बौद्धिक संपदा)</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            All government marks, logos, portal designations (e.g., PM-KISAN, AgriStack) and official emblems referenced in documentation or sample cards belong exclusively to the Government of India and their respective authorities. They are referenced strictly under <strong>nominative fair use</strong> to identify the type of source document being processed.
          </p>
        </section>

        {/* 9. Governing Law */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2.5 text-slate-900 font-bold text-lg border-b border-slate-200 pb-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">9</span>
            <h3>Governing Law and Jurisdiction (लागू कायदा)</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            These Terms and Conditions shall be governed by and interpreted in accordance with the laws of the Republic of India. Any legal dispute or proceeding arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
          </p>
        </section>

        {/* Contact Strip */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Have questions regarding these terms? Contact our legal team at <span className="font-semibold text-slate-700">support@farmercard.org</span>.
          </p>
          <button
            onClick={() => onNavigate ? onNavigate('contact') : undefined}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1"
          >
            <span>Go to Contact Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

