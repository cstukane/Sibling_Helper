import React, { useEffect, useState } from 'react';
import { boardRepository } from '@data/repositories/boardRepository';
import { questRepository } from '@data/repositories/questRepository';
import analyticsService from '@services/analytics';
import type { DailyBoardItem } from '@state/boardTypes';
import type { Quest } from '@state/questTypes';
import { LoadingIndicator } from '@sibling-helper/shared';

interface Submission {
  id: string;
  taskName: string;
  points: number | null;
  status: 'pending' | 'approved' | 'denied';
  submittedAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
}

const PendingSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Log when component is opened
  useEffect(() => {
    analyticsService.logPendingOpened();
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      // Fetch board items (completed tasks) from the database
      const boardItems: DailyBoardItem[] = await boardRepository.getAll();
      
      // Convert board items to submissions with quest information
      const submissionPromises = boardItems.map(async (item) => {
        // Get the quest details for this board item
        const quest: Quest | undefined = await questRepository.getById(item.questId);
        
        // Determine status based on completion
        const status: 'approved' | 'pending' = item.completedAt ? 'approved' : 'pending';
        
        return {
          id: item.id,
          taskName: quest?.title || 'Unknown Task',
          points: quest?.points || null,
          status,
          submittedAt: item.completedAt || item.date, // Use completed date if available, otherwise use date
        };
      });
      
      const submissionsData = await Promise.all(submissionPromises);
      setSubmissions(submissionsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: Submission['status']) => {
    const statusStyles: Record<string, React.CSSProperties> = {
      pending: { backgroundColor: '#fef3c7', color: '#92400e' },
      approved: { backgroundColor: '#d1fae5', color: '#065f46' },
      denied: { backgroundColor: '#fee2e2', color: '#991b1b' }
    };
    
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      approved: 'Approved',
      denied: 'Denied'
    };
    
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: 20,
        fontSize: '12px',
        fontWeight: 'bold',
        ...statusStyles[status]
      }}>
        {statusLabels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <section style={{ padding: 16 }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ 
            margin: 0,
            color: 'var(--text-primary)'
          }}>Pending Submissions</h1>
        </header>
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          padding: '48px 16px',
          color: 'var(--text-secondary)'
        }}>
          <LoadingIndicator label="Loading submissions..." />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section style={{ padding: 16 }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ 
            margin: 0,
            color: 'var(--text-primary)'
          }}>Pending Submissions</h1>
        </header>
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 16px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: 16 }}>⚠️</div>
          <h3>Error loading submissions</h3>
          <p>{error}</p>
          <button 
            onClick={loadSubmissions}
            style={{
              padding: '8px 16px',
              background: '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: 16 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ 
          margin: 0,
          color: 'var(--text-primary)'
        }}>Pending Submissions</h1>
      </header>
      
      {submissions.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 16px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: 16 }}>📋</div>
          <h3>Nothing here yet</h3>
          <p>Complete a Quest or Chore to see it show up!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {submissions.map((submission) => (
            <div 
              key={submission.id}
              style={{
                padding: 16,
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                backgroundColor: 'var(--bg-surface-elevated)'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: 8
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: 18,
                  color: 'var(--text-primary)'
                }}>{submission.taskName}</h3>
                {getStatusChip(submission.status)}
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                fontSize: 14,
                color: 'var(--text-secondary)'
              }}>
                <span>{formatDate(submission.submittedAt)}</span>
                {submission.points && <span>{submission.points} points</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      
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
          Submissions need approval before points are added to your account.
        </p>
      </div>
    </section>
  );
};

export default PendingSubmissions;
