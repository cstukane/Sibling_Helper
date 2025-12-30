import { useState, useEffect } from 'react';
import { useHero } from '@state/hero';
import { useQuests } from '@state/quests';
import { useBoard } from '@state/board';
import QuestCard from '@components/QuestCard';
import ProgressBar from '@components/ProgressBar';
import { pointRequestService } from '@sibling-helper/shared';
import HamburgerMenu from '@components/Navigation/HamburgerMenu';
import ConfirmSubmitModal from '@components/ConfirmSubmitModal';
import ApprovalToast from '@components/ApprovalToast';
import analyticsService from '@services/analytics';
import { taskAssignmentService } from '@sibling-helper/shared';
import type { AssignedTask } from '@sibling-helper/shared';

type HomeProps = {
  onNavigateToRewards: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPending?: () => void;
};

const Home = ({ onNavigateToRewards, onNavigateToSettings, onNavigateToPending }: HomeProps) => {
  const { hero, loading: heroLoading } = useHero();
  const { quests, loading: questsLoading } = useQuests();
  
  // For now, we'll use today's date and a default hero ID
  // In a real app, we would get these from context or props
  const today = new Date().toISOString().slice(0, 10);
  const heroId = hero?.id || 'hero-1';
  const { boardItems, loading: boardLoading } = useBoard(heroId, today);
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<{title: string, points: number, id: string} | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [showApprovalToast, setShowApprovalToast] = useState(false);
  const [assigned, setAssigned] = useState<AssignedTask[]>([]);
  const [assignedError, setAssignedError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!hero) return;
      try {
        const list = await taskAssignmentService.listForChild(hero.id);
        setAssigned(list);
      } catch (e: any) {
        setAssignedError(e?.message || 'Failed to load assignments');
      }
    };
    load();
    const id = window.setInterval(load, 10000);
    return () => window.clearInterval(id);
  }, [hero?.id]);

  if (heroLoading || questsLoading || boardLoading) {
    return <div>Loading...</div>;
  }

  // Calculate progression level (every 10 progression points for now)
  const progressionLevel = Math.floor((hero?.progressionPoints || 0) / 10) + 1;
  const pointsInCurrentLevel = (hero?.progressionPoints || 0) % 10;

  const handleQuestClick = (questTitle: string, points: number, questId: string) => {
    setSelectedQuest({ title: questTitle, points, id: questId });
    setShowCompletionModal(true);
  };

  const handleConfirmCompletion = async () => {
    if (selectedQuest) {
      try {
        // Create a point request instead of directly completing the quest
        await pointRequestService.createPointRequest({
          heroId: heroId,
          questId: selectedQuest.id,
          title: selectedQuest.title,
          points: selectedQuest.points
        });
        
        // Log submission creation
        analyticsService.logSubmissionCreated(
          selectedQuest.id, 
          selectedQuest.points, 
          !navigator.onLine
        );
        
        // Show confirmation
        setRequestSubmitted(true);
        setShowCompletionModal(false);
        
        // Show approval toast for first submission
        const isFirstSubmission = !localStorage.getItem('first_submission_made');
        if (isFirstSubmission) {
          setShowApprovalToast(true);
          localStorage.setItem('first_submission_made', 'true');
        }
        
        // Hide confirmation after 2 seconds
        setTimeout(() => {
          setRequestSubmitted(false);
        }, 2000);
      } catch (error) {
        console.error('Error creating point request:', error);
      }
    }
  };

  // Define menu items for the hamburger menu
  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠', onClick: () => {} },
    { id: 'tasks', label: 'Quests', icon: '✅', onClick: () => {} },
    { id: 'pending', label: 'Pending Submissions', icon: '⏳', onClick: () => { if (onNavigateToPending) onNavigateToPending(); } },
    { id: 'settings', label: 'Settings', icon: '⚙️', onClick: () => { if (onNavigateToSettings) onNavigateToSettings(); } },
    { id: 'help', label: 'Help', icon: '❓', onClick: () => {} },
    { id: 'logout', label: 'Log out', icon: '🚪', onClick: () => {} }
  ];

  return (
    <section>
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HamburgerMenu menuItems={menuItems} />
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold'
          }}>
            {hero?.avatarUrl ? (
              <img 
                src={hero.avatarUrl} 
                alt={hero.name} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%',
                  objectFit: 'cover'
                }} 
              />
            ) : (
              hero?.name.charAt(0)
            )}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, color: 'var(--text-primary)' }}>{hero?.name}</h1>
            <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Level {progressionLevel - 1}</div>
          </div>
        </div>
        
        <div style={{ marginTop: 16 }}>
          <ProgressBar 
            current={pointsInCurrentLevel} 
            max={10} 
            label={`XP to Level ${progressionLevel}`} 
          />
        </div>
        
        <div style={{ 
          marginTop: 8, 
          fontSize: 14,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>Total XP: {hero?.progressionPoints || 0}</span>
          <span style={{ color: 'var(--text-secondary)' }}>Reward Points: {hero?.rewardPoints || 0}</span>
          <button 
            onClick={onNavigateToRewards}
            style={{ 
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '500'
            }}
          >
            Reward Shop →
          </button>
        </div>
      </header>
      
      <h2 style={{ color: 'var(--text-primary)' }}>Today's Quests</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {boardItems.map((item) => (
          <QuestCard 
            key={item.id}
            title={item.quest?.title || 'Unknown Quest'}
            points={item.quest?.points || 0}
            completed={!!item.completedAt}
            onComplete={() => handleQuestClick(
              item.quest?.title || 'Unknown Quest', 
              item.quest?.points || 0, 
              item.quest?.id || ''
            )}
          />
        ))}
      </div>

      {/* Assigned Quests & Chores from Parent */}
      <h2 style={{ color: 'var(--text-primary)', marginTop: 24 }}>Assigned Quests & Chores</h2>
      {assignedError && (
        <div style={{ color: 'var(--state-error)', marginBottom: 8 }}>{assignedError}</div>
      )}
      {assigned.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)' }}>No Quests or Chores assigned yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {assigned.map((a) => {
            const q = quests.find((q) => q.id === a.questId);
            const title = a.title || q?.title || 'Task';
            const pts = typeof a.points === 'number' ? a.points : (q?.points || 0);
            const questId = q?.id || a.questId;
            return (
              <QuestCard
                key={a.id}
                title={title}
                points={pts}
                completed={false}
                onComplete={() => handleQuestClick(title, pts, questId)}
              />
            );
          })}
        </div>
      )}
      
      {showCompletionModal && selectedQuest && (
        <ConfirmSubmitModal
          taskName={selectedQuest.title}
          points={selectedQuest.points}
          onConfirm={handleConfirmCompletion}
          onCancel={() => setShowCompletionModal(false)}
        />
      )}
      
      {requestSubmitted && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--state-success)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 8,
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          Request submitted! Waiting for parent approval.
        </div>
      )}
      
      <ApprovalToast 
        isVisible={showApprovalToast} 
        onDismiss={() => setShowApprovalToast(false)} 
      />
    </section>
  );
};

export default Home;
