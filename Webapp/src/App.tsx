import React, { useState, useEffect } from 'react';
import { FarmerVerificationPage } from './components/FarmerVerificationPage';
import { HomePage } from './components/pages/HomePage';
import { CreateCardPage } from './components/pages/CreateCardPage';
import { TermsPage } from './components/pages/TermsPage';
import { PrivacyPage } from './components/pages/PrivacyPage';
import { ContactPage } from './components/pages/ContactPage';
import { DisclaimerPage } from './components/pages/DisclaimerPage';
import { AppPage, getPageFromUrl, navigateToPage } from './lib/navigation';
import { DEFAULT_CARD_TEMPLATE_ID, getCardTemplateById } from './lib/cardTemplates';
import {
  getSavedSelectedTemplateId,
  hydrateCustomCardTemplates,
  persistSelectedTemplateId,
} from './lib/customTemplatesStorage';
import {
  isVerificationMode,
  extractVerificationDataFromUrl,
  FarmerVerificationData,
} from './lib/verificationUrl';

export const App: React.FC = () => {
  // Navigation & Page routing state
  const [currentPage, setCurrentPage] = useState<AppPage>(() => getPageFromUrl());

  // Selected card template persists across Home showcase, Create Card studio, and reloads
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    () => getSavedSelectedTemplateId() || DEFAULT_CARD_TEMPLATE_ID
  );

  useEffect(() => {
    let active = true;
    hydrateCustomCardTemplates().then(() => {
      if (!active) return;
      setSelectedTemplateId((currentId) => {
        if (currentId && getCardTemplateById(currentId)) {
          return currentId;
        }
        return DEFAULT_CARD_TEMPLATE_ID;
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    persistSelectedTemplateId(templateId);
  };

  // Disclaimer state for accessing the Card Maker Studio
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

  const handleLaunchCreateCard = (templateId?: string) => {
    if (templateId) {
      handleSelectTemplate(templateId);
    }
    handleNavigate('create-card');
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

  // Create Card Page (Card Maker Studio)
  if (currentPage === 'create-card') {
    return (
      <CreateCardPage
        hasAcceptedDisclaimer={hasAcceptedDisclaimer}
        onAcceptDisclaimer={() => setHasAcceptedDisclaimer(true)}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={handleSelectTemplate}
        onNavigate={handleNavigate}
      />
    );
  }

  // Default Home Page (Showcase & Overview)
  return (
    <HomePage
      selectedTemplateId={selectedTemplateId}
      onSelectTemplate={handleSelectTemplate}
      onLaunchCreateCard={handleLaunchCreateCard}
      onNavigate={handleNavigate}
    />
  );
};

export default App;
