import React, { useState, useEffect } from 'react';
import { FarmerVerificationPage } from './components/FarmerVerificationPage';
import { HomePage } from './components/pages/HomePage';
import { ProductWorkspace } from './components/ProductWorkspace';
import { TermsPage } from './components/pages/TermsPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { ContactPage } from './components/pages/ContactPage';
import { DisclaimerPage } from './components/pages/DisclaimerPage';
import { AppPage, getPageFromUrl, navigateToPage } from './lib/navigation';
import { DEFAULT_CARD_TEMPLATE_ID } from './lib/cardTemplates';
import {
  isVerificationMode,
  extractVerificationDataFromUrl,
  FarmerVerificationData,
} from './lib/verificationUrl';

export const App: React.FC = () => {
  // Navigation & Page routing state
  const [currentPage, setCurrentPage] = useState<AppPage>(() => getPageFromUrl());

  // Selected card template persists across Home showcase & Product workspace
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_CARD_TEMPLATE_ID);

  // Disclaimer state for accessing the Card Maker product tool
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);

  // Check if page opened via QR code scan (or verification URL parameter)
  const [isVerifying, setIsVerifying] = useState<boolean>(
    () => isVerificationMode() || getPageFromUrl() === 'verify'
  );
  const [verificationData, setVerificationData] = useState<FarmerVerificationData | null>(() =>
    isVerificationMode() || getPageFromUrl() === 'verify'
      ? extractVerificationDataFromUrl()
      : null
  );

  useEffect(() => {
    const handleLocationChange = () => {
      const page = getPageFromUrl();
      setCurrentPage(page);
      const verifying = isVerificationMode() || page === 'verify';
      setIsVerifying(verifying);
      if (verifying) {
        setVerificationData(extractVerificationDataFromUrl());
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleNavigate = (page: AppPage) => {
    navigateToPage(page, false);
    setCurrentPage(page);
    if (page === 'verify') {
      setIsVerifying(true);
      setVerificationData(extractVerificationDataFromUrl());
    } else {
      setIsVerifying(false);
    }
  };

  const handleLaunchProduct = (templateId?: string) => {
    if (templateId) {
      setSelectedTemplateId(templateId);
    }
    handleNavigate('product');
  };

  const handleNavigateHome = () => {
    handleNavigate('home');
  };

  // Dedicated Informational & Policy Pages
  if (currentPage === 'terms') {
    return <TermsPage onNavigate={handleNavigate} />;
  }
  if (currentPage === 'privacy') {
    return <PrivacyPage onNavigate={handleNavigate} />;
  }
  if (currentPage === 'contact') {
    return <ContactPage onNavigate={handleNavigate} />;
  }
  if (currentPage === 'disclaimer') {
    return <DisclaimerPage onNavigate={handleNavigate} />;
  }

  // QR Verification Page
  if (isVerifying || currentPage === 'verify') {
    return (
      <FarmerVerificationPage
        data={verificationData}
        onNavigateHome={handleNavigateHome}
        onNavigate={handleNavigate}
      />
    );
  }

  // Product Page (Card Maker Studio)
  if (currentPage === 'product') {
    return (
      <ProductWorkspace
        hasAcceptedDisclaimer={hasAcceptedDisclaimer}
        onAcceptDisclaimer={() => setHasAcceptedDisclaimer(true)}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={setSelectedTemplateId}
        onNavigate={handleNavigate}
      />
    );
  }

  // Default Home Page (Product Branding & Showcase)
  return (
    <HomePage
      selectedTemplateId={selectedTemplateId}
      onSelectTemplate={setSelectedTemplateId}
      onLaunchProduct={handleLaunchProduct}
      onNavigate={handleNavigate}
    />
  );
};

export default App;
