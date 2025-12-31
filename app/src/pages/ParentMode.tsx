import React, { useState } from 'react';
import { useHero } from '@state/hero';
import { useQuests } from '@state/quests';
import { useRewards } from '@state/rewards';
import QuestForm from '@components/QuestForm';
import RewardForm from '@components/RewardForm';
import { pinManager } from '@state/pinManager';
import { isValidPin, sanitizePinInput, sanitizeText } from '../utils/sanitize';
import { LoadingIndicator, useTheme } from '@sibling-helper/shared';

const ParentMode: React.FC = () => {
  const { hero, updateHero, loading: heroLoading } = useHero();
  const { quests, addQuest, updateQuest, deleteQuest } = useQuests();
  const { rewards, addReward, updateReward, deleteReward } = useRewards();
  const [activeTab, setActiveTab] = useState<'profile' | 'quests' | 'chores' | 'rewards' | 'settings'>('profile');
  const [editingQuest, setEditingQuest] = useState<string | null>(null);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [newName, setNewName] = useState(hero?.name || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const { isDark, setMode } = useTheme();
  
  // Settings state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');

  // Update when hero loads
  React.useEffect(() => {
    if (hero) {
      setNewName(hero.name);
    }
  }, [hero]);

  const handleEditQuest = (id: string) => {
    setEditingQuest(id);
  };

  const handleEditReward = (id: string) => {
    setEditingReward(id);
  };

  const handleCancelEdit = () => {
    setEditingQuest(null);
    setEditingReward(null);
  };

  const handleSaveProfile = async () => {
    if (!hero) return;
    
    try {
      const safeName = sanitizeText(newName, 60);
      if (!safeName) return;
      setNewName(safeName);
      const updates: Partial<{ name: string; avatarUrl?: string }> = { name: safeName };
      
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  if (heroLoading) {
    return (
      <div style={{ padding: 16 }}>
        <LoadingIndicator label="Loading parent mode..." />
      </div>
    );
  }

  return (
    <div>
      <h1>Parent Mode</h1>
      
      {/* Scrollable header with tabs */}
      <div style={{ 
        display: 'flex',
        overflowX: 'auto',
        gap: 16,
        marginBottom: 24,
        borderBottom: '1px solid #ddd',
        paddingBottom: 8,
        scrollbarWidth: 'none' // Hide scrollbar for Firefox
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
            borderBottom: activeTab === 'profile' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          style={{
            padding: '8px 16px',
            borderBottom: activeTab === 'quests' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Quests
        </button>
        <button
          onClick={() => setActiveTab('chores')}
          style={{
            padding: '8px 16px',
            borderBottom: activeTab === 'chores' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Chores
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          style={{
            padding: '8px 16px',
            borderBottom: activeTab === 'rewards' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Rewards
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '8px 16px',
            borderBottom: activeTab === 'settings' ? '2px solid #0ea5e9' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          Settings
        </button>
      </div>

      {activeTab === 'profile' && (
        <section>
          <h2>Child Profile</h2>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 16,
            padding: 24,
            border: '1px solid #ddd',
            borderRadius: 8,
            marginBottom: 24
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
                ✏️
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
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Child&#39;s Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter child&#39;s name"
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: 16
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
            backgroundColor: '#f0f9ff', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid #bae6fd'
          }}>
            <h3>Profile Tips</h3>
            <ul>
              <li>Use a friendly nickname that the child likes</li>
              <li>Choose a clear photo that shows the child&#39;s face</li>
              <li>The profile will be displayed in Kid Mode</li>
            </ul>
          </div>
        </section>
      )}

      {activeTab === 'quests' && (
        <section>
          <h2>Manage Quests</h2>
          <p>Quests are one-time tasks that help develop good habits.</p>
          
          {editingQuest ? (
            <QuestForm 
              quest={quests.find(q => q.id === editingQuest)}
              onSave={async (questData) => {
                if (editingQuest) {
                  await updateQuest(editingQuest, questData);
                } else {
                  await addQuest(questData);
                }
                handleCancelEdit();
              }}
              onCancel={handleCancelEdit}
            />
          ) : (
            <QuestForm 
              onSave={async (questData) => {
                await addQuest(questData);
                handleCancelEdit();
              }}
              onCancel={handleCancelEdit}
            />
          )}
          
          <div style={{ marginTop: 32 }}>
            <h3>Existing Quests</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {quests.filter(q => q.category !== 'chores').map(quest => (
                <div 
                  key={quest.id} 
                  style={{ 
                    padding: 12, 
                    border: '1px solid #ddd', 
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{quest.title}</strong>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      +{quest.points} pts • {quest.category}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEditQuest(quest.id)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #0ea5e9',
                        background: 'white',
                        color: '#0ea5e9',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuest(quest.id)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ef4444',
                        background: 'white',
                        color: '#ef4444',
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
          </div>
        </section>
      )}

      {activeTab === 'chores' && (
        <section>
          <h2>Manage Chores</h2>
          <p>Chores are recurring tasks that can be assigned daily or weekly.</p>
          
          {editingQuest ? (
            <QuestForm 
              quest={quests.find(q => q.id === editingQuest)}
              onSave={async (questData) => {
                // Add chore-specific category
                const choreData = {
                  ...questData,
                  category: 'chores' as const
                };
                
                if (editingQuest) {
                  await updateQuest(editingQuest, choreData);
                } else {
                  await addQuest(choreData);
                }
                handleCancelEdit();
              }}
              onCancel={handleCancelEdit}
              isChore={true}
            />
          ) : (
            <QuestForm 
              onSave={async (questData) => {
                // Add chore-specific category
                const choreData = {
                  ...questData,
                  category: 'chores' as const
                };
                
                await addQuest(choreData);
                handleCancelEdit();
              }}
              onCancel={handleCancelEdit}
              isChore={true}
            />
          )}
          
          <div style={{ marginTop: 32 }}>
            <h3>Existing Chores</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {quests.filter(q => q.category === 'chores').map(quest => (
                <div 
                  key={quest.id} 
                  style={{ 
                    padding: 12, 
                    border: '1px solid #ddd', 
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{quest.title}</strong>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      +{quest.points} pts • {quest.recurrence ? `Recurring (${quest.recurrence})` : 'One-time'} Chore
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEditQuest(quest.id)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #0ea5e9',
                        background: 'white',
                        color: '#0ea5e9',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteQuest(quest.id)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #ef4444',
                        background: 'white',
                        color: '#ef4444',
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
          </div>
        </section>
      )}

      {activeTab === 'rewards' && (
        <section>
          <h2>Manage Rewards</h2>
          
          {editingReward ? (
            <RewardForm 
              reward={rewards.find(r => r.id === editingReward)}
              onSave={async (rewardData) => {
                if (editingReward) {
                  await updateReward(editingReward, rewardData);
                } else {
                  await addReward(rewardData);
                }
                handleCancelEdit();
              }}
              onCancel={handleCancelEdit}
            />
          ) : (
            <RewardForm 
              onSave={async (rewardData) => {
                await addReward(rewardData);
                handleCancelEdit();
              }}
              onCancel={handleCancelEdit}
            />
          )}
          
          <div style={{ marginTop: 32 }}>
            <h3>Existing Rewards</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {rewards.map(reward => (
                <div 
                  key={reward.id} 
                  style={{ 
                    padding: 12, 
                    border: '1px solid #ddd', 
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong>{reward.title}</strong>
                    <div style={{ opacity: 0.8, marginTop: 4 }}>
                      Cost: {reward.cost} pts
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleEditReward(reward.id)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid #0ea5e9',
                        background: 'white',
                        color: '#0ea5e9',
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
                        border: '1px solid #ef4444',
                        background: 'white',
                        color: '#ef4444',
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
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <section>
          <h2>Settings</h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: 24,
            maxWidth: 600
          }}>
            
            {/* Theme Settings */}
            <div style={{ 
              padding: 20, 
              border: '1px solid #ddd', 
              borderRadius: 8 
            }}>
              <h3>Appearance</h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Dark Mode</div>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>
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
            </div>
            
            {/* PIN Settings */}
            <div style={{ 
              padding: 20, 
              border: '1px solid #ddd', 
              borderRadius: 8 
            }}>
              <h3>Security</h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
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
                    padding: 12,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 16
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
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
                    padding: 12,
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    fontSize: 16
                  }}
                />
              </div>
              
              {pinMessage && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: 12, 
                  backgroundColor: pinMessage.includes('successfully') ? '#dcfce7' : '#fee2e2', 
                  border: `1px solid ${pinMessage.includes('successfully') ? '#bbf7d0' : '#fecaca'}`, 
                  borderRadius: 8,
                  color: pinMessage.includes('successfully') ? '#166534' : '#991b1b'
                }}>
                  {pinMessage}
                </div>
              )}
              
              <button
                onClick={handleChangePin}
                style={{
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
                Change PIN
              </button>
            </div>
            
            {/* Reset Data */}
            <div style={{ 
              padding: 20, 
              border: '1px solid #ddd', 
              borderRadius: 8 
            }}>
              <h3>Danger Zone</h3>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>Reset All Data</div>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>
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
    </div>
  );
};

export default ParentMode;
