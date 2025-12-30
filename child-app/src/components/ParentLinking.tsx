import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import analyticsService from '@services/analytics';
import { linkingService } from '@sibling-helper/shared';
import { useHero } from '../state/hero';

type ParentLinkingProps = {
  onLinkSuccess?: (parentId: string) => void;
  onBack?: () => void;
};

const ParentLinking = ({ onLinkSuccess, onBack }: ParentLinkingProps) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { hero } = useHero();

  // Validate code format (6 digits)
  const isValidCode = (value: string) => {
    return /^\d{6}$/.test(value);
  };

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Debounced code validation
  const debouncedValidate = (value: string) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      // Log telemetry event
      analyticsService.logLinkParentAttempt(value.length, 'settings');
    }, 500);
    
    setDebounceTimer(timer);
  };

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
    
    if (value.length === 6) {
      debouncedValidate(value);
    }
  };

  // Submit code via offline-first linking service
  const linkParentAPI = async (
    code: string
  ): Promise<{ success: boolean; parentId?: string; error?: string }> => {
    if (!hero) return { success: false, error: 'Profile not ready. Try again.' };
    if (!/^\d{6}$/.test(code)) return { success: false, error: 'Please enter a valid 6-digit code' };
    const res = await linkingService.enterCodeAsChild(hero.id, code);
    if (res.pending) return { success: true, parentId: 'pending-parent-approval' };
    return { success: false, error: res.error || 'Invalid or expired code' };
  };

  // Process queued requests when online
  const processQueuedRequests = async () => {
    const offlineRequests = JSON.parse(localStorage.getItem('offline_link_requests') || '[]');
    
    if (offlineRequests.length === 0) return;
    
    // Process each request
    const updatedRequests = [];
    for (const request of offlineRequests) {
      try {
        const result = await linkParentAPI(request.code);
        
        if (result.success && result.parentId) {
          // Success - notify parent component
          if (onLinkSuccess) onLinkSuccess(result.parentId);
          
          // Log telemetry
          analyticsService.logLinkParentSuccess(result.parentId);
        } else {
          // Failure - increment retries or remove if too many
          if (request.retries < 3) {
            updatedRequests.push({
              ...request,
              retries: request.retries + 1
            });
          }
          
          // Log telemetry
          analyticsService.logLinkParentFailure(result.error || 'Unknown error');
        }
      } catch (err) {
        // Network error - keep in queue
        if (request.retries < 3) {
          updatedRequests.push({
            ...request,
            retries: request.retries + 1
          });
        }
      }
    }
    
    // Save updated queue
    localStorage.setItem('offline_link_requests', JSON.stringify(updatedRequests));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isValidCode(code)) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setIsOffline(false);
    
    try {
      // Log attempt telemetry
      analyticsService.logLinkParentAttempt(code.length, 'settings');

      // Make local linking call
      const result = await linkParentAPI(code);

      if (result.success && result.parentId) {
        // Success
        if (onLinkSuccess) onLinkSuccess(result.parentId);
        
        // Log success telemetry
        analyticsService.logLinkParentSuccess(result.parentId);
      } else {
        // Failure
        setError(result.error || "That code didn't work. Check with your parent and try again.");
        
        // Log failure telemetry
        analyticsService.logLinkParentFailure(result.error || 'Unknown error');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      
      // Log error telemetry
      analyticsService.logLinkParentFailure('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check for offline requests when coming online
  useEffect(() => {
    const handleOnline = () => {
      processQueuedRequests();
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <header style={{ marginBottom: 24 }}>
        <button 
          onClick={onBack}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: 24, 
            cursor: 'pointer',
            padding: 0,
            marginRight: 16,
            color: 'var(--text-primary)'
          }}
        >
          ←
        </button>
        <h1 style={{ 
          margin: 0, 
          display: 'inline',
          color: 'var(--text-primary)'
        }}>Link to Parent</h1>
      </header>
      
      <p style={{ 
        color: 'var(--text-secondary)', 
        marginBottom: 24 
      }}>
        Enter the 6-digit code provided by your parent to link your account.
      </p>
      
      {isOffline && (
        <div style={{ 
          backgroundColor: 'var(--bg-surface-overlay)', 
          border: '1px solid var(--state-warn)', 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 24 
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 8 }}>⚠️</span>
            <span>You're offline. We'll try again automatically.</span>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} role="form">
        <div style={{ marginBottom: 24 }}>
          <label htmlFor="link-code" style={{ 
            display: 'block', 
            marginBottom: 8, 
            fontWeight: 'bold',
            color: 'var(--text-primary)'
          }}>
            Enter 6-digit code
          </label>
          <input
            ref={inputRef}
            id="link-code"
            type="text"
            inputMode="numeric"
            value={code}
            onChange={handleCodeChange}
            placeholder="123456"
            maxLength={6}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              textAlign: 'center',
              letterSpacing: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)'
            }}
          />
        </div>
        
        {error && (
          <div style={{ 
            color: 'var(--state-error)', 
            marginBottom: 16, 
            padding: '12px', 
            backgroundColor: 'var(--bg-surface-overlay)', 
            border: '1px solid var(--state-error)', 
            borderRadius: 8 
          }}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting || !isValidCode(code)}
          className="themed-button primary"
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: 8,
            cursor: isValidCode(code) ? 'pointer' : 'not-allowed'
          }}
        >
          {isSubmitting ? 'Linking...' : 'Link'}
        </button>
      </form>
      
      <div style={{ 
        marginTop: 32, 
        padding: '16px', 
        backgroundColor: 'var(--bg-surface-overlay)', 
        borderRadius: 8,
        textAlign: 'center'
      }}>
        <p style={{ 
          margin: 0, 
          fontSize: '14px', 
          color: 'var(--text-secondary)'
        }}>
          Ask your parent to generate a linking code in their app under Settings &#62; Child Management.
        </p>
      </div>
    </div>
  );
};

export default ParentLinking;
