import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useHero } from '@state/hero';
import { useQuests } from '@state/quests';
import { useRewards } from '@state/rewards';
import { useLinkedChildren } from '@state/linkedChildren';
import RewardForm from '@components/RewardForm';
import Tasks from './Tasks';
import { pinManager } from '@state/pinManager';
import { LoadingIndicator, PointRequestApprovalPanel, linkingService, taskAssignmentService, useTheme } from '@sibling-helper/shared';
import type { Link } from '@sibling-helper/shared';
import LinkRequestToast from '@components/LinkRequestToast';
import { isValidPin, sanitizePinInput, sanitizeText } from '../utils/sanitize';
import type { Assignment } from '@sibling-helper/shared';

const ParentMode = () => {
  const { hero, updateHero, loading: heroLoading, error: heroError, refreshHero } = useHero();
  const { quests, error: questsError, refreshQuests } = useQuests();
  const { rewards, addReward, updateReward, deleteReward, error: rewardsError, refreshRewards } = useRewards();
  const { linkedChildren, linkChild, unlinkChild, updateChild } = useLinkedChildren();
  const [activeTab, setActiveTab] = useState<'profile' | 'tasks' | 'rewards' | 'requests' | 'settings'>('profile');
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [showLinkChildModal, setShowLinkChildModal] = useState(false);
  const [newName, setNewName] = useState(hero?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkRefresh, setLinkRefresh] = useState(0);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ childId: string; name: string } | null>(null);
  const [toastQueue, setToastQueue] = useState<Link[]>([]);
  const [currentToast, setCurrentToast] = useState<Link | null>(null);
  const seenLinkIdsRef = useRef<Set<string>>(new Set());
  const [assignmentsOpen, setAssignmentsOpen] = useState<Record<string, boolean>>({});
  const [assignmentsByChild, setAssignmentsByChild] = useState<Record<string, Assignment[]>>({});
  const [assignmentsLoading, setAssignmentsLoading] = useState<Record<string, boolean>>({});
  const [assignmentsError, setAssignmentsError] = useState<Record<string, string>>({});
  const [manageOpenByChild, setManageOpenByChild] = useState<Record<string, boolean>>({});
  const [pendingLinks, setPendingLinks] = useState<Link[]>([]);
  const dataErrors = [heroError, questsError, rewardsError].filter(Boolean) as string[];
  const { isDark, setMode } = useTheme();

  const handleRetryData = async () => {
    await refreshHero();
    await refreshQuests();
    await refreshRewards();
  };

  useEffect(() => {
    const load = async () => {
      if (!hero) return;
      try {
        const pending = (await linkingService.getPendingForParentRemote(hero.id)) as Link[];
        setPendingLinks(pending);

        // Detect new pending links for toast notifications
        const seen = seenLinkIdsRef.current;
        const newOnes = pending.filter((l) => !seen.has(l.id));
        if (newOnes.length > 0) {
          newOnes.forEach((l) => seen.add(l.id));
          setToastQueue((q) => [...q, ...newOnes]);
        }
      } catch (e: unknown) {
        // Fallback to local if remote fails
        console.error('Error loading pending links:', e);
        setPendingLinks(linkingService.getPendingForParent(hero.id));
      }
    };
    load();
  }, [hero, linkRefresh]);

  // Update document title with pending count badge
  useEffect(() => {
    const base = 'Big Sibling Helper';
    if (pendingLinks.length > 0) {
      document.title = `(${pendingLinks.length}) ${base}`;
    } else {
      document.title = base;
    }
  }, [pendingLinks.length]);

  // Poll for new link requests every 5 seconds when on parent mode
  useEffect(() => {
    const id = window.setInterval(() => setLinkRefresh((x) => x + 1), 5000);
    return () => window.clearInterval(id);
  }, []);

  // Pop next toast when queue changes
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      setCurrentToast(toastQueue[0]);
      setToastQueue((q) => q.slice(1));
    }
  }, [toastQueue, currentToast]);

  const closeCurrentToast = () => setCurrentToast(null);
  const loadAssignmentsForChild = async (childId: string) => {
    if (!hero) return;
    setAssignmentsLoading((s) => ({ ...s, [childId]: true }));
    try {
      const items = await taskAssignmentService.listForParentChild(hero.id, childId);
      setAssignmentsByChild((m) => ({ ...m, [childId]: items }));
      setAssignmentsError((e) => ({ ...e, [childId]: '' }));
    } catch (e: unknown) {
      setAssignmentsError((er) => ({ ...er, [childId]: (e as Error)?.message || 'Failed to load assignments' }));
    } finally {
      setAssignmentsLoading((s) => ({ ...s, [childId]: false }));
    }
  };
  
  // Settings state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  // Handle route redirects
  useEffect(() => {
    const hash = window.location.hash;
    
    // Redirect legacy routes
    if (hash === '#/quests') {
      setActiveTab('tasks');
      // Replace the URL without reloading
      window.history.replaceState(null, '', '#/tasks');
    } else if (hash === '#/chores') {
      setActiveTab('tasks');
      // Replace the URL without reloading and add view parameter
      window.history.replaceState(null, '', '#/tasks?view=recurring');
    }
  }, []);

  // Update when hero loads
  useEffect(() => {
    if (hero) {
      setNewName(hero.name);
    }
  }, [hero]);

  const handleSaveProfile = async () => {
    if (!hero) return;
    
    try {
      const safeName = sanitizeText(newName, 60);
      if (!safeName) return;
      setNewName(safeName);
      const updates: Partial<Hero> = { name: safeName };
      
      // If there's a new avatar, convert it to a data URL
      if (selectedAvatar) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const avatarUrl = e.target?.result as string;
          await updateHero({ ...updates, avatarUrl });
        };
        reader.readAsDataURL(selectedAvatar);
      } else {
        await updateHero(updates);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedAvatar(file);
      
      // Preview the avatar
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeChange = (nextDark: boolean) => {
    setMode(nextDark ? 'dark' : 'light');
  };

  const handleChangePin = async () => {
    if (!newPin || !confirmPin) {
      setPinMessage('Please fill in all fields');
      return;
    }
    
    if (newPin !== confirmPin) {
      setPinMessage('New PINs do not match');
      return;
    }
    
    if (!isValidPin(newPin)) {
      setPinMessage('PIN must be 4 digits');
      return;
    }
    
    // Change PIN
    const didSet = await pinManager.setPin(newPin);
    if (!didSet) {
      setPinMessage('PIN must be 4 digits');
      return;
    }
    setPinMessage('PIN changed successfully!');
    
    // Clear form
    setNewPin('');
    setConfirmPin('');
  };

  const handleGenerateLinkCode = async () => {
    if (!hero) return;
    try {
      const { code } = await linkingService.generateCodeForParentAsync(hero.id);
      setGeneratedCode(code);
      setLinkError('');
      setLinkMessage('Share this code with your child. It expires in ~15 minutes.');
    } catch (e: unknown) {
      setLinkError((e as Error)?.message || 'Unable to generate code');
      setLinkMessage('');
    }
  };

  const approvePendingLink = async (linkId: string) => {
    if (!hero) return;
    const res = await linkingService.approveLinkAsParentAsync(hero.id, linkId);
    if (!res.success) {
      setLinkError(res.error || 'Failed to approve link');
    } else {
      setLinkError('');
      // Also create a local linked child entry if not present
      try {
        const refreshed = await (linkingService.getActiveForParentRemote(hero.id) as Promise<Link[]>);
        const link = refreshed.find((l: Link) => l.id === linkId);
        if (link) {
          await linkChild({
            childId: link.childId,
            name: `Child ${linkedChildren.length + 1}`,
            currentPoints: 0,
            pin: '******'
          });
        }
      } catch {
        const link = linkingService.getLink(linkId);
        if (link) {
        await linkChild({
          childId: link.childId,
          name: `Child ${linkedChildren.length + 1}`,
          currentPoints: 0,
          pin: '******'
        });
        }
      }
    }
    setLinkRefresh((x) => x + 1);
  };

  const declinePendingLink = async (linkId: string) => {
    try {
      await linkingService.declineLinkAsync(linkId);
    } finally {
      setLinkRefresh((x) => x + 1);
    }
  };

  const handleLinkChildSubmit = async () => {
    // This flow is deprecated. Codes should be generated here and entered on the child device,
    // then approved under Requests.
    setPinError('Please generate a code in Settings and have your child enter it. Approve the request under Requests.');
  };

  if (heroLoading) {
    return (
      <div style={{ padding: 16 }}>
        <LoadingIndicator label="Loading parent mode..." />
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#000000',
      minHeight: '100vh',
      // Ensure edge-to-edge coverage
      margin: 0,
      padding: 0,
      width: '100%',
      // Add frame border that uses CSS variable
      border: '1px solid var(--frame-border)'
    }}>
      <h1 style={{ 
        margin: 0, 
        color: isDark ? '#f8fafc' : '#000000',
        backgroundColor: isDark ? '#0f172a' : '#ffffff'
      }}>
        Parent Mode
      </h1>

      {dataErrors.length > 0 && (
        <div role="alert" style={{ 
          border: '1px solid #ef4444',
          backgroundColor: '#fee2e2',
          color: '#7f1d1d',
          padding: 12,
          borderRadius: 8,
          margin: '12px 16px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>We ran into a data error</div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            Try again, and if this keeps happening consider refreshing the app.
          </div>
          <div style={{ marginBottom: 12 }}>
            {dataErrors.map((message, index) => (
              <div key={`${message}-${index}`}>{message}</div>
            ))}
          </div>
          <button
            onClick={handleRetryData}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #ef4444',
              background: '#ef4444',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Retry loading
          </button>
        </div>
      )}
      
      {/* Scrollable header with tabs */}
      <div style={{ 
        display: 'flex',
        overflowX: 'auto',
        gap: 16,
        marginBottom: 24,
        borderBottom: isDark ? '1px solid #334155' : '1px solid #ddd',
        paddingBottom: 8,
        scrollbarWidth: 'none', // Hide scrollbar for Firefox
        backgroundColor: isDark ? '#0f172a' : '#ffffff'
      }}>
        <style>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '8px 16px',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            color: isDark ? '#f8fafc' : '#000000'
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '8px 16px',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'tasks' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            color: isDark ? '#f8fafc' : '#000000'
          }}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          style={{
            padding: '8px 16px',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'rewards' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            color: isDark ? '#f8fafc' : '#000000'
          }}
        >
          Rewards
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            position: 'relative',
            padding: '8px 16px',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'requests' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            color: isDark ? '#f8fafc' : '#000000'
          }}
        >
          <span role="img" aria-label="Requests" style={{ marginRight: 6 }}>!</span>
          Requests
          {pendingLinks.length > 0 && (
            <span
              aria-label={`${pendingLinks.length} pending link requests`}
              style={{
                position: 'absolute',
                top: 2,
                right: 4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 18,
                height: 18,
                padding: '0 6px',
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 700,
                background: '#ef4444',
                color: 'white'
              }}
            >
              {pendingLinks.length > 9 ? '9+' : pendingLinks.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '8px 16px',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            color: isDark ? '#f8fafc' : '#000000'
          }}
        >
          Settings
        </button>
      </div>

      {activeTab === 'profile' && (
        <section>
          <h2 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Child Profile</h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 16,
            padding: 24,
            border: isDark ? '1px solid #334155' : '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 24,
            backgroundColor: isDark ? '#1e293b' : 'white'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 48,
                fontWeight: 'bold'
              }}>
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Preview" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }} 
                  />
                ) : hero?.avatarUrl ? (
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
              
              <label 
                htmlFor="avatar-upload" 
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#0ea5e9',
                  color: 'white',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid white'
                }}
              >
                Edit
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
            
            <div style={{ width: '100%', maxWidth: 300 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: isDark ? '#f8fafc' : '#000000' }}>
                Child&apos;s Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter child's name"
                style={{
                  width: '100%',
                  padding: 12,
                  border: isDark ? '1px solid #334155' : '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 16,
                  backgroundColor: isDark ? '#0f172a' : 'white',
                  color: isDark ? '#f8fafc' : '#000000'
                }}
              />
              
              <button
                onClick={handleSaveProfile}
                style={{
                  marginTop: 16,
                  padding: '12px 24px',
                  background: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16,
                  width: '100%'
                }}
              >
                Save Profile
              </button>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: isDark ? '#1e293b' : '#f0f9ff', 
            padding: 16, 
            borderRadius: 8,
            border: isDark ? '1px solid #334155' : '1px solid #bae6fd'
          }}>
            <h3 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Profile Tips</h3>
            <ul style={{ color: isDark ? '#cbd5e1' : '#000000' }}>
              <li>Use a friendly nickname that the child likes</li>
              <li>Choose a clear photo that shows the child&apos;s face</li>
              <li>The profile will be displayed in Kid Mode</li>
            </ul>
            {/* Link Child App (moved to bottom) */}
            <div style={{ 
              padding: 20, 
              border: isDark ? '1px solid #334155' : '1px solid #ddd', 
              borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : 'white'
            }}>
              <h3 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Link Child App</h3>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Generate a 6-digit code and have your child enter it on their device. You will still need to approve the request here.</p>
              {generatedCode && (
                <div style={{
                  padding: 12,
                  border: '1px dashed #0ea5e9',
                  borderRadius: 8,
                  marginBottom: 8,
                  background: isDark ? '#0b1220' : '#f0f9ff'
                }}>
                  <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#0369a1' }}>Share this code</div>
                  <div style={{ fontSize: 28, letterSpacing: 6, fontWeight: 700 }}>{generatedCode}</div>
                </div>
              )}
              {linkMessage && (
                <div style={{ marginBottom: 8, fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>{linkMessage}</div>
              )}
              {linkError && (
                <div style={{
                  marginBottom: 12,
                  padding: 12,
                  border: '1px solid #ef4444',
                  color: isDark ? '#fca5a5' : '#991b1b',
                  background: isDark ? '#7f1d1d' : '#fee2e2',
                  borderRadius: 8
                }}>{linkError}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleGenerateLinkCode}
                  style={{
                    padding: '10px 16px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >Generate Linking Code</button>
              </div>
            </div>

            {/* Assignment Tools (moved to bottom) */}
            <div style={{ 
              padding: 20, 
              border: isDark ? '1px solid #334155' : '1px solid #ddd', 
              borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : 'white'
            }}>
              <h3 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Assignment Tools</h3>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 0 }}>Backfill missing assignment details (title/points) for older assignments.</p>
              <button
                onClick={async () => {
                  try {
                    const map = Object.fromEntries(quests.map(q => [q.id, { title: q.title, points: q.points }]));
                    const res = await taskAssignmentService.migrateSnapshots(map, true);
                    alert(`Updated ${res.updated} assignment(s).`);
                    setLinkRefresh(x => x + 1);
                  } catch (e: unknown) {
                    alert((e as Error)?.message || 'Migration failed');
                  }
                }}
                style={{ padding: '8px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
              >
                Backfill Assignment Details
              </button>
            </div>

          </div>
        </section>
      )}

      {activeTab === 'tasks' && (
        <Tasks isDarkMode={isDark} />
      )}

      {activeTab === 'rewards' && (
        <section>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 24
          }}>
            <h2 style={{ color: isDark ? '#f8fafc' : '#000000', margin: 0 }}>
              Rewards
            </h2>
            <button
              onClick={() => setShowAddRewardModal(true)}
              style={{
                padding: '8px 16px',
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 14
              }}
            >
              Add Reward
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {rewards.map(reward => (
              <div 
                key={reward.id} 
                style={{ 
                  padding: 16, 
                  border: isDark ? '1px solid #334155' : '1px solid #ddd', 
                  borderRadius: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#1e293b' : 'white'
                }}
              >
                <div>
                  <strong style={{ color: isDark ? '#f8fafc' : '#000000' }}>{reward.title}</strong>
                  <div style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 4 }}>
                    Cost: {reward.cost} pts
                  </div>
                  {reward.description && (
                    <div style={{ color: isDark ? '#cbd5e1' : '#334155', marginTop: 4, fontSize: 14 }}>
                      {reward.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      setEditingReward(reward.id);
                      setShowAddRewardModal(true);
                    }}
                    style={{
                      padding: '4px 8px',
                      border: isDark ? '1px solid #0ea5e9' : '1px solid #0ea5e9',
                      background: isDark ? '#0f172a' : 'white',
                      color: isDark ? '#38bdf8' : '#0ea5e9',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteReward(reward.id)}
                    style={{
                      padding: '4px 8px',
                      border: isDark ? '1px solid #ef4444' : '1px solid #ef4444',
                      background: isDark ? '#0f172a' : 'white',
                      color: isDark ? '#f87171' : '#ef4444',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Reward Modal */}
          {showAddRewardModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: isDark ? '#0f172a' : 'white',
                padding: 24,
                borderRadius: 8,
                maxWidth: 500,
                width: '90%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}>
                <h3 style={{ 
                  marginTop: 0, 
                  color: isDark ? '#f8fafc' : '#000000',
                  marginBottom: 20
                }}>
                  {editingReward ? 'Edit Reward' : 'Add Reward'}
                </h3>
                
                <RewardForm 
                  reward={editingReward ? rewards.find(r => r.id === editingReward) : undefined}
                  onSave={async (rewardData) => {
                    if (editingReward) {
                      await updateReward(editingReward, rewardData);
                    } else {
                      await addReward(rewardData);
                    }
                    setEditingReward(null);
                    setShowAddRewardModal(false);
                  }}
                  onCancel={() => {
                    setEditingReward(null);
                    setShowAddRewardModal(false);
                  }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'requests' && (
        <section>
          <h2 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Point Requests</h2>
          <p>Review and approve point requests from your child.</p>
      <PointRequestApprovalPanel />

          <div style={{ marginTop: 32, paddingTop: 16, borderTop: isDark ? '1px solid #334155' : '1px solid #ddd' }}>
            <h2 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Link Requests</h2>
            <p>Approve or decline pending link requests from a child device.</p>
            {linkError && (
              <div style={{
                marginBottom: 12,
                padding: 12,
                border: '1px solid #ef4444',
                color: isDark ? '#fca5a5' : '#991b1b',
                background: isDark ? '#7f1d1d' : '#fee2e2',
                borderRadius: 8
              }}>{linkError}</div>
            )}
            {pendingLinks.length === 0 ? (
              <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>No pending link requests.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {pendingLinks.map((l) => (
                  <div key={l.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    border: isDark ? '1px solid #334155' : '1px solid #ddd',
                    borderRadius: 8,
                    background: isDark ? '#0f172a' : '#fff'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Child request</div>
                      <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>childId: {l.childId}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => approvePendingLink(l.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #16a34a', color: '#16a34a', background: 'transparent' }}>Approve</button>
                      <button onClick={() => declinePendingLink(l.id)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ef4444', color: '#ef4444', background: 'transparent' }}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <section>
          <h2 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Settings</h2>
            
            {/* Theme Settings */}
            <div style={{ 
              padding: 20, 
              border: isDark ? '1px solid #334155' : '1px solid #ddd', 
              borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : 'white',
              display: 'none'
            }}>
              <h3 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Link Child App</h3>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Generate a 6-digit code and have your child enter it on their device. You will still need to approve the request here.</p>
              {generatedCode && (
                <div style={{
                  padding: 12,
                  border: '1px dashed #0ea5e9',
                  borderRadius: 8,
                  marginBottom: 8,
                  background: isDark ? '#0b1220' : '#f0f9ff'
                }}>
                  <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#0369a1' }}>Share this code</div>
                  <div style={{ fontSize: 28, letterSpacing: 6, fontWeight: 700 }}>{generatedCode}</div>
                </div>
              )}
              {linkMessage && (
                <div style={{ marginBottom: 8, fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>{linkMessage}</div>
              )}
              {linkError && (
                <div style={{
                  marginBottom: 12,
                  padding: 12,
                  border: '1px solid #ef4444',
                  color: isDark ? '#fca5a5' : '#991b1b',
                  background: isDark ? '#7f1d1d' : '#fee2e2',
                  borderRadius: 8
                }}>{linkError}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleGenerateLinkCode}
                  style={{
                    padding: '10px 16px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >Generate Linking Code</button>
              </div>
            </div>

            {/* Appearance */}
            <div style={{ 
              padding: 20, 
              border: isDark ? '1px solid #334155' : '1px solid #ddd', 
              borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : 'white',
              display: 'none'
            }}>
              <h3 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Assignment Tools</h3>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 0 }}>Backfill missing assignment details (title/points) for older assignments.</p>
              <button
                onClick={async () => {
                  try {
                    const map = Object.fromEntries(quests.map(q => [q.id, { title: q.title, points: q.points }]));
                    const res = await taskAssignmentService.migrateSnapshots(map, true);
                    alert(`Updated ${res.updated} assignment(s).`);
                    setLinkRefresh(x => x + 1);
                  } catch (e: unknown) {
                    alert((e as Error)?.message || 'Migration failed');
                  }
                }}
                style={{ padding: '8px 12px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, marginBottom: 12 }}
              >
                Backfill Assignment Details
              </button>
            </div>

            <div style={{ 
              padding: 20, 
              border: isDark ? '1px solid #334155' : '1px solid #ddd', 
              borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : 'white'
            }}>
              <h3 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Appearance</h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: isDark ? '#f8fafc' : '#000000' }}>Dark Mode</div>
                  <div style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }}>
                    Enable dark theme for better nighttime viewing
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 60, height: 34 }}>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={(e) => handleThemeChange(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isDark ? '#0ea5e9' : '#ccc',
                    transition: '.4s',
                    borderRadius: 34
                  }}></span>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: 26,
                    width: 26,
                    left: 4,
                    bottom: 4,
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%',
                    transform: isDark ? 'translateX(26px)' : 'translateX(0)'
                  }}></span>
                </label>
              </div>
              
              {/* Border Color Setting */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: isDark ? '#f8fafc' : '#000000' }}>Border Color</div>
                  <div style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }}>
                    Customize the outer frame border color
                  </div>
                </div>
                <select
                  value={localStorage.getItem('borderColor') || 'system'}
                  onChange={(e) => {
                    localStorage.setItem('borderColor', e.target.value);
                    // Apply border color change
                    const borderColor = e.target.value === 'system' 
                      ? (isDark ? '#000000' : '#ffffff')
                      : e.target.value;
                    document.documentElement.style.setProperty('--frame-border', borderColor);
                  }}
                  style={{
                    padding: '6px 12px',
                    border: isDark ? '1px solid #334155' : '1px solid #ddd',
                    borderRadius: 6,
                    background: isDark ? '#0f172a' : 'white',
                    color: isDark ? '#f8fafc' : '#000000'
                  }}
                >
                  <option value="system">System default</option>
                  <option value="#000000">Slate</option>
                  <option value="#374151">Graphite</option>
                  <option value="#312e81">Indigo</option>
                  <option value="#065f46">Emerald</option>
                  <option value="#991b1b">Rose</option>
                </select>
              </div>
            </div>
            
            {/* Linked Children */}
            <div style={{ 
              padding: 20, 
              border: isDark ? '1px solid #334155' : '1px solid #ddd', 
              borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : 'white',
              marginTop: 24
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <h3 style={{ color: isDark ? '#f8fafc' : '#000000', margin: 0 }}>Linked Children</h3>
                <button
                  onClick={() => setShowLinkChildModal(true)}
                  style={{
                    padding: '6px 12px',
                    background: '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  Link New Child
                </button>
              </div>
              
              {linkedChildren.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 24,
          color: isDark ? '#94a3b8' : '#64748b'
        }}>
          No linked children yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {linkedChildren.map((child) => {
            const manageOpen = !!manageOpenByChild[child.childId];
            const assignmentsVisible = !!assignmentsOpen[child.childId];
            const assignments = assignmentsByChild[child.childId] || [];

            return (
              <div
                key={child.childId}
                style={{
                  padding: 12,
                  border: isDark ? '1px solid #334155' : '1px solid #ddd',
                  borderRadius: 6,
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#0ea5e9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    >
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 'bold',
                          color: isDark ? '#f8fafc' : '#000000'
                        }}
                      >
                        {child.name}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: isDark ? '#94a3b8' : '#64748b'
                        }}
                      >
                        {child.currentPoints} points
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => {
                        const open = !manageOpenByChild[child.childId];
                        setManageOpenByChild((m) => ({ ...m, [child.childId]: open }));
                      }}
                      style={{
                        padding: '6px 10px',
                        border: isDark ? '1px solid #334155' : '1px solid #ddd',
                        background: isDark ? '#0f172a' : 'white',
                        color: isDark ? '#cbd5e1' : '#374151',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        minWidth: 88
                      }}
                    >
                      {manageOpen ? 'Close' : 'Manage'}
                    </button>
                  </div>
                </div>

                {manageOpen && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8
                    }}
                  >
                    <button
                      onClick={() => {
                        const newName = prompt('Enter new name:', child.name);
                        const safeName = newName ? sanitizeText(newName, 60) : '';
                        if (safeName && safeName !== child.name) {
                          updateChild(child.childId, { name: safeName });
                        }
                      }}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #0ea5e9',
                        background: isDark ? '#0f172a' : 'white',
                        color: isDark ? '#38bdf8' : '#0ea5e9',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Rename
                    </button>
                    <button
                      onClick={async () => {
                        const open = !assignmentsOpen[child.childId];
                        setAssignmentsOpen((m) => ({ ...m, [child.childId]: open }));
                        if (open) await loadAssignmentsForChild(child.childId);
                      }}
                      style={{
                        padding: '6px 10px',
                        border: isDark ? '1px solid #334155' : '1px solid #ddd',
                        background: isDark ? '#0f172a' : 'white',
                        color: isDark ? '#cbd5e1' : '#374151',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      {assignmentsVisible ? 'Hide Assignments' : 'View Assignments'}
                    </button>
                    <button
                      onClick={() => {
                        setUnlinkTarget({ childId: child.childId, name: child.name });
                        setShowUnlinkModal(true);
                      }}
                      style={{
                        padding: '6px 10px',
                        border: '1px solid #ef4444',
                        background: isDark ? '#0f172a' : 'white',
                        color: isDark ? '#f87171' : '#ef4444',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Unlink
                    </button>
                  </div>
                )}

                {assignmentsVisible && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 8,
                      border: isDark ? '1px solid #334155' : '1px solid #ddd',
                      borderRadius: 6
                    }}
                  >
                    {assignmentsLoading[child.childId] ? (
                      <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Loading...</div>
                    ) : assignmentsError[child.childId] ? (
                      <div style={{ color: isDark ? '#fca5a5' : '#991b1b' }}>{assignmentsError[child.childId]}</div>
                    ) : assignments.length === 0 ? (
                      <div style={{ color: isDark ? '#94a3b8' : '#64748b' }}>No active assignments.</div>
                    ) : (
                      <div style={{ display: 'grid', gap: 6 }}>
                        {assignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <span style={{ color: isDark ? '#f8fafc' : '#000000' }}>
                              {assignment.title || 'Task'}{' '}
                              <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>+{assignment.points || 0} pts</span>
                            </span>
                            <button
                              onClick={async () => {
                                await taskAssignmentService.unassign(assignment.id);
                                await loadAssignmentsForChild(child.childId);
                              }}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #ef4444',
                                color: '#ef4444',
                                background: 'transparent',
                                borderRadius: 4,
                                cursor: 'pointer',
                                fontSize: 12
                              }}
                            >
                              Unassign
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* PIN Settings */}
            <div style={{ 
              padding: 20, 
              border: isDark ? '1px solid #334155' : '1px solid #ddd', 
              borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : 'white'
            }}>
              <h3 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Security</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: isDark ? '#f8fafc' : '#000000' }}>
                  New PIN
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(sanitizePinInput(e.target.value))}
                  placeholder="Enter new 4-digit PIN"
                  maxLength={4}
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    padding: 12,
                    border: isDark ? '1px solid #334155' : '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 16,
                    backgroundColor: isDark ? '#0f172a' : 'white',
                    color: isDark ? '#f8fafc' : '#000000',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', color: isDark ? '#f8fafc' : '#000000' }}>
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(sanitizePinInput(e.target.value))}
                  placeholder="Confirm new PIN"
                  maxLength={4}
                  style={{
                    width: '100%',
                    maxWidth: 200,
                    padding: 12,
                    border: isDark ? '1px solid #334155' : '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 16,
                    backgroundColor: isDark ? '#0f172a' : 'white',
                    color: isDark ? '#f8fafc' : '#000000',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              {pinMessage && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: 12, 
                  backgroundColor: pinMessage.includes('successfully') ? (isDark ? '#065f46' : '#dcfce7') : (isDark ? '#7f1d1d' : '#fee2e2'), 
                  border: `1px solid ${pinMessage.includes('successfully') ? (isDark ? '#047857' : '#bbf7d0') : (isDark ? '#b91c1c' : '#fecaca')}`, 
                  borderRadius: 8,
                  color: pinMessage.includes('successfully') ? (isDark ? '#6ee7b7' : '#166534') : (isDark ? '#fca5a5' : '#991b1b')
                }}>
                  {pinMessage}
                </div>
              )}
              
              <button
                onClick={handleChangePin}
                style={{
                  padding: '12px 24px',
                  background: isDark ? '#0ea5e9' : '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16,
                  width: '100%'
                }}
              >
                Change PIN
              </button>
            </div>
            
            {/* Reset Data */}
            <div style={{ 
              padding: 20, 
              border: isDark ? '1px solid #334155' : '1px solid #ddd', 
              borderRadius: 8,
              backgroundColor: isDark ? '#1e293b' : 'white'
            }}>
              <h3 style={{ color: isDark ? '#f8fafc' : '#000000' }}>Danger Zone</h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: isDark ? '#f8fafc' : '#000000' }}>Reset All Data</div>
                  <div style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b' }}>
                    Permanently delete all quests, rewards, and progress
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
                      localStorage.clear();
                      // Clear IndexedDB databases
                      indexedDB.databases().then(dbs => {
                        dbs.forEach(db => {
                          if (db.name) {
                            indexedDB.deleteDatabase(db.name);
                          }
                        });
                      });
                      window.location.reload();
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Link Child Modal */}
      {showLinkChildModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: isDark ? '#0f172a' : 'white',
            padding: 24,
            borderRadius: 8,
            maxWidth: 400,
            width: '90%'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              color: isDark ? '#f8fafc' : '#000000',
              marginBottom: 20
            }}>
              Link Child App
            </h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 8, 
                fontWeight: 'bold',
                color: isDark ? '#f8fafc' : '#000000'
              }}>
                Enter 6-digit PIN
              </label>
              <input
                type="text"
                value={pinInput}
                onChange={(e) => {
                  // Only allow digits and limit to 6 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPinInput(value);
                }}
                placeholder="Enter 6-digit PIN"
                style={{
                  width: '100%',
                  padding: 12,
                  border: isDark ? '1px solid #334155' : '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 16,
                  backgroundColor: isDark ? '#1e293b' : 'white',
                  color: isDark ? '#f8fafc' : '#000000',
                  boxSizing: 'border-box'
                }}
              />
              {pinError && (
                <div style={{ 
                  color: '#ef4444', 
                  fontSize: 14, 
                  marginTop: 8 
                }}>
                  {pinError}
                </div>
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: 12,
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowLinkChildModal(false);
                  setPinInput('');
                  setPinError('');
                }}
                style={{
                  padding: '8px 16px',
                  background: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#334155',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLinkChildSubmit}
                style={{
                  padding: '8px 16px',
                  background: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Confirmation Modal */}
      {showUnlinkModal && unlinkTarget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: isDark ? '#0f172a' : 'white',
            padding: 24,
            borderRadius: 8,
            maxWidth: 420,
            width: '90%',
            border: isDark ? '1px solid #334155' : '1px solid #e5e7eb'
          }}>
            <h3 style={{ marginTop: 0, color: isDark ? '#f8fafc' : '#000000' }}>Unlink Child?</h3>
            <p style={{ marginTop: 8, color: isDark ? '#cbd5e1' : '#374151' }}>
              Are you sure you want to unlink <strong>{unlinkTarget.name}</strong>? You can re-link later with a new code.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  setShowUnlinkModal(false);
                  setUnlinkTarget(null);
                }}
                style={{
                  padding: '8px 12px',
                  background: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#111827',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (unlinkTarget) {
                    try {
                      if (hero) {
                        await linkingService.unlinkAsync(hero.id, unlinkTarget.childId);
                      }
                      await unlinkChild(unlinkTarget.childId);
                    } finally {
                      setShowUnlinkModal(false);
                      setUnlinkTarget(null);
                      setLinkRefresh((x) => x + 1);
                    }
                  }
                }}
                style={{
                  padding: '8px 12px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                Unlink
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Request Toast */}
      {currentToast && (
        <LinkRequestToast
          childId={currentToast.childId}
          onApprove={async () => {
            await approvePendingLink(currentToast.id);
            setCurrentToast(null);
          }}
          onDecline={async () => {
            await declinePendingLink(currentToast.id);
            setCurrentToast(null);
          }}
          onClose={closeCurrentToast}
          isDarkMode={isDark}
        />
      )}
    </div>
  );
};

export default ParentMode;

