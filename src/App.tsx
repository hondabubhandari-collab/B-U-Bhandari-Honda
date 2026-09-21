import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { Step1Experience } from './components/Step1Experience';
import { Step2Rating } from './components/Step2Rating';
import { Step3ReviewDetails } from './components/Step3ReviewDetails';
import { Step4ReviewResult } from './components/Step4ReviewResult';
import { AdminLogin } from './components/AdminLogin';
import { AdminReviewAnalytics } from './components/AdminReviewAnalytics';
import { ExperienceType, RatingType, ReviewFormData } from './types';
import { generateLocalReview } from './utils/localReviewGenerator';
import { addAiGeneratedReview, isAdminAuthenticated, logoutAdmin } from './utils/adminReviewStore';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ReviewFormData>({
    experienceType: null,
    rating: null,
    employeeName: '',
    teamName: '',
    selectedAspects: [],
    vehicleModel: '',
    additionalComments: '',
    language: 'Auto',
  });

  const [reviewText, setReviewText] = useState<string>('');
  const [reviewHistory, setReviewHistory] = useState<string[]>([]);
  const [currentLogEntryId, setCurrentLogEntryId] = useState<string | null>(null);
  const [sheetSyncStatus, setSheetSyncStatus] = useState<'synced' | 'failed' | 'pending' | 'idle'>('idle');
  const [sheetSyncMessage, setSheetSyncMessage] = useState<string>('');

  // Private Admin Route & Authentication
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      return search.includes('admin') || hash.includes('admin');
    }
    return false;
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return isAdminAuthenticated();
  });

  useEffect(() => {
    const handleUrlState = () => {
      const search = window.location.search || '';
      const hash = window.location.hash || '';
      const hasAdmin = search.includes('admin') || hash.includes('admin');
      setIsAdminRoute(hasAdmin);
      if (hasAdmin) {
        setIsAdminLoggedIn(isAdminAuthenticated());
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret Admin Hotkey: Ctrl+Shift+A or Alt+A opens Admin Portal
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setIsAdminRoute(true);
        setIsAdminLoggedIn(isAdminAuthenticated());
        window.history.pushState({}, '', '?admin=1');
      }
    };

    window.addEventListener('popstate', handleUrlState);
    window.addEventListener('hashchange', handleUrlState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handleUrlState);
      window.removeEventListener('hashchange', handleUrlState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleExitAdmin = () => {
    setIsAdminRoute(false);
    if (typeof window !== 'undefined' && window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      url.hash = '';
      const newQuery = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';
      window.history.pushState({}, '', url.pathname + newQuery);
    }
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setIsAdminLoggedIn(false);
    handleExitAdmin();
  };

  const handleOpenAdmin = () => {
    setIsAdminRoute(true);
    setIsAdminLoggedIn(isAdminAuthenticated());
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '?admin=1');
    }
  };

  const stepLabels = [
    'Experience Type',
    'Rating',
    'Review Details',
    'Your Review',
  ];

  const handleUpdateFormData = (data: Partial<ReviewFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  // Instant Unique Review Generation with Duplicate Prevention & Session History
  const handleGenerateReview = () => {
    const generated = generateLocalReview(formData, {
      history: reviewHistory,
      forceLanguage: formData.language,
    });
    setReviewHistory((prev) => [...prev, generated]);
    setReviewText(generated);
    setCurrentStep(4);

    // Automatically track in private Admin Review History as AI App Generated with Pending status
    addAiGeneratedReview(generated, {
      experienceType: formData.experienceType || undefined,
      rating: formData.rating || undefined,
      employeeName: formData.employeeName || undefined,
      teamName: formData.teamName || undefined,
    });

    // Asynchronously log review activity to backend / Google Sheet as a new row (Columns A through I)
    setSheetSyncStatus('pending');
    setSheetSyncMessage('Connecting to Google Sheet...');
    try {
      fetch('/api/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceType: formData.experienceType,
          rating: formData.rating,
          employeeName: formData.employeeName,
          teamName: formData.teamName,
          aiImprovement: 'Natural Generator',
          aiStatus: 'Ready to Post',
          reviewGenerated: generated,
          vehicleModel: formData.vehicleModel,
          selectedAspects: formData.selectedAspects,
          additionalComments: formData.additionalComments,
          googleReviewOpened: 'No',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.entryId) {
            setCurrentLogEntryId(data.entryId);
          }
          if (data && data.sheetSyncStatus) {
            setSheetSyncStatus(data.sheetSyncStatus);
            setSheetSyncMessage(data.sheetSyncMessage || '');
          } else {
            setSheetSyncStatus('synced');
          }
        })
        .catch((err) => {
          console.warn('Background activity logging:', err);
          setSheetSyncStatus('failed');
          setSheetSyncMessage('Failed to reach backend sync');
        });
    } catch (e) {
      setSheetSyncStatus('failed');
      setSheetSyncMessage('Failed to trigger sync');
    }
  };

  const handleRetrySheetSync = () => {
    if (!reviewText) return;
    setSheetSyncStatus('pending');
    setSheetSyncMessage('Retrying Google Sheet sync...');
    fetch('/api/log-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentLogEntryId || undefined,
        experienceType: formData.experienceType,
        rating: formData.rating,
        employeeName: formData.employeeName,
        teamName: formData.teamName,
        aiImprovement: 'Natural Generator',
        aiStatus: 'Ready to Post',
        reviewGenerated: reviewText,
        vehicleModel: formData.vehicleModel,
        selectedAspects: formData.selectedAspects,
        additionalComments: formData.additionalComments,
        googleReviewOpened: 'No',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.entryId) setCurrentLogEntryId(data.entryId);
        if (data && data.sheetSyncStatus) {
          setSheetSyncStatus(data.sheetSyncStatus);
          setSheetSyncMessage(data.sheetSyncMessage || '');
        } else {
          setSheetSyncStatus('synced');
        }
      })
      .catch((err) => {
        setSheetSyncStatus('failed');
        setSheetSyncMessage(err.message || 'Retry failed');
      });
  };

  // Rotate local variation instantly with duplicate prevention & history
  const handleRegenerateVariation = () => {
    const newVariation = generateLocalReview(formData, {
      history: reviewHistory,
      forceLanguage: formData.language,
    });
    setReviewHistory((prev) => [...prev, newVariation]);
    setReviewText(newVariation);

    // Track variation in private Admin Review History
    addAiGeneratedReview(newVariation, {
      experienceType: formData.experienceType || undefined,
      rating: formData.rating || undefined,
      employeeName: formData.employeeName || undefined,
      teamName: formData.teamName || undefined,
    });

    if (currentLogEntryId) {
      fetch('/api/update-log-ai-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: currentLogEntryId,
          aiImprovement: 'Natural Variation',
          aiStatus: 'Ready to Post',
          reviewGenerated: newVariation,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.sheetSyncStatus) {
            setSheetSyncStatus(data.sheetSyncStatus);
            setSheetSyncMessage(data.sheetSyncMessage || '');
          }
        })
        .catch((e) => console.warn('Variation update log error:', e));
    }
  };

  const handleLogAiStatus = (status: 'Success' | 'Timeout / Fallback' | 'Failed', improvedReview?: string) => {
    if (improvedReview) {
      addAiGeneratedReview(improvedReview, {
        experienceType: formData.experienceType || undefined,
        rating: formData.rating || undefined,
        employeeName: formData.employeeName || undefined,
        teamName: formData.teamName || undefined,
      });
    }

    if (currentLogEntryId) {
      fetch('/api/update-log-ai-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: currentLogEntryId,
          aiImprovement: status === 'Success' ? 'Refined with AI' : 'Natural Generator',
          aiStatus: status,
          reviewGenerated: improvedReview || reviewText,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.sheetSyncStatus) {
            setSheetSyncStatus(data.sheetSyncStatus);
            setSheetSyncMessage(data.sheetSyncMessage || '');
          }
        })
        .catch((e) => console.warn('AI status update error:', e));
    }
  };

  const handleLogGoogleReviewOpened = () => {
    if (currentLogEntryId) {
      fetch('/api/log-google-review-opened', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: currentLogEntryId,
        }),
      }).catch((e) => console.warn('Google review click logging error:', e));
    }
  };

  const handleRestart = () => {
    setFormData({
      experienceType: null,
      rating: null,
      employeeName: '',
      teamName: '',
      selectedAspects: [],
      vehicleModel: '',
      additionalComments: '',
      language: 'Auto',
    });
    setReviewText('');
    setCurrentLogEntryId(null);
    setSheetSyncStatus('idle');
    setSheetSyncMessage('');
    setCurrentStep(1);
  };

  // If Admin URL / view was requested, enforce protection
  if (isAdminRoute) {
    if (isAdminLoggedIn) {
      return (
        <AdminReviewAnalytics
          onBackToApp={handleExitAdmin}
          onLogout={handleAdminLogout}
        />
      );
    } else {
      return (
        <AdminLogin
          onSuccess={() => setIsAdminLoggedIn(true)}
          onRedirectToPublic={handleExitAdmin}
        />
      );
    }
  }

  // Normal Public Customer View (Admin features completely hidden from public customers)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans antialiased text-slate-900 selection:bg-red-100 selection:text-red-900">
      <div>
        {/* Header with B.U. Bhandari Honda branding (No admin controls or reports visible to public) */}
        <Header onAdminSecretTrigger={handleOpenAdmin} />

        {/* Step Progress Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={stepLabels}
        />

        {/* Main Content Area */}
        <main className="w-full pb-12">
          {currentStep === 1 && (
            <Step1Experience
              selectedExperience={formData.experienceType}
              onSelect={(type: ExperienceType) => {
                handleUpdateFormData({ experienceType: type });
              }}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2Rating
              selectedRating={formData.rating}
              onSelect={(rating: RatingType) => {
                handleUpdateFormData({ rating });
              }}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3ReviewDetails
              formData={formData}
              onChange={handleUpdateFormData}
              onGenerateReview={handleGenerateReview}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4ReviewResult
              formData={formData}
              reviewText={reviewText}
              history={reviewHistory}
              sheetSyncStatus={sheetSyncStatus}
              sheetSyncMessage={sheetSyncMessage}
              onRetrySheetSync={handleRetrySheetSync}
              onUpdateReview={(text) => {
                setReviewText(text);
                setReviewHistory((prev) => [...prev, text]);
                addAiGeneratedReview(text, {
                  experienceType: formData.experienceType || undefined,
                  rating: formData.rating || undefined,
                  employeeName: formData.employeeName || undefined,
                  teamName: formData.teamName || undefined,
                });
              }}
              onRegenerateVariation={handleRegenerateVariation}
              onEdit={() => setCurrentStep(3)}
              onRestart={handleRestart}
              onLogAiStatus={handleLogAiStatus}
              onLogGoogleReviewOpened={handleLogGoogleReviewOpened}
            />
          )}
        </main>
      </div>

      {/* Footer strictly adhering to branding guidelines (No admin buttons or reporting links visible to public) */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-xl mx-auto space-y-2">
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-700">
            <span>B.U. Bhandari Honda</span>
            <span>•</span>
            <span>Genuine Customer Feedback</span>
          </div>
          <p className="text-slate-400">
            Authorized Honda Cars & Honda 2-Wheelers • Pune
          </p>
        </div>
      </footer>
    </div>
  );
}
