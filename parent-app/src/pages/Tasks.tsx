import { useState, useMemo } from 'react';
import { useQuests } from '@state/quests';
import { useHero } from '@state/hero';
import { useLinkedChildren } from '@state/linkedChildren';
import { taskAssignmentService } from '@sibling-helper/shared';
import QuestForm from '@components/QuestForm';
import type { Quest } from '@state/questTypes';

const Tasks = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const { quests, addQuest, updateQuest, deleteQuest } = useQuests();
  const { hero } = useHero();
  const { linkedChildren } = useLinkedChildren();
  const [editingQuest, setEditingQuest] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'quests' | 'chores'>('all');
  const [sort, setSort] = useState<'recent' | 'points' | 'az' | 'za'>('recent');
  const [search, setSearch] = useState('');
  const [assignQuestId, setAssignQuestId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState('');

  // Filter and sort quests
  const filteredAndSortedQuests = useMemo(() => {
    let result = [...quests];
    
    // Apply filter
    if (filter === 'quests') {
      result = result.filter(q => !q.recurrence || q.recurrence.type === 'none');
    } else if (filter === 'chores') {
      result = result.filter(q => q.recurrence && q.recurrence.type !== 'none');
    }
    
    // Apply search
    if (search) {
      const searchTerm = search.toLowerCase();
      result = result.filter(q => 
        q.title.toLowerCase().includes(searchTerm) || 
        (q.description && q.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply sort
    result.sort((a, b) => {
      if (sort === 'points') {
        return b.points - a.points;
      } else if (sort === 'az') {
        return a.title.localeCompare(b.title);
      } else if (sort === 'za') {
        return b.title.localeCompare(a.title);
      } else {
        // recent (default) - sort by updated_at, newest first
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });
    
    return result;
  }, [quests, filter, sort, search]);

  const handleEditQuest = (id: string) => {
    setEditingQuest(id);
    setShowAddModal(true);
  };

  const handleCancelEdit = () => {
    setEditingQuest(null);
    setShowAddModal(false);
  };

  const taskType = (quest: Quest): 'quest' | 'chore' => {
    return quest.recurrence && quest.recurrence.type !== 'none' ? 'chore' : 'quest';
  };

  return (
    <section>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24
      }}>
        <h2 style={{ color: isDarkMode ? '#f8fafc' : '#000000', margin: 0 }}>
          Tasks
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
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
          Add Task
        </button>
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 24,
        flexWrap: 'wrap'
      }}>
        {/* Filter */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 12px',
              background: filter === 'all' ? '#0ea5e9' : (isDarkMode ? '#334155' : '#e2e8f0'),
              color: filter === 'all' ? 'white' : (isDarkMode ? '#cbd5e1' : '#334155'),
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('quests')}
            style={{
              padding: '6px 12px',
              background: filter === 'quests' ? '#0ea5e9' : (isDarkMode ? '#334155' : '#e2e8f0'),
              color: filter === 'quests' ? 'white' : (isDarkMode ? '#cbd5e1' : '#334155'),
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Quests
          </button>
          <button
            onClick={() => setFilter('chores')}
            style={{
              padding: '6px 12px',
              background: filter === 'chores' ? '#0ea5e9' : (isDarkMode ? '#334155' : '#e2e8f0'),
              color: filter === 'chores' ? 'white' : (isDarkMode ? '#cbd5e1' : '#334155'),
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Chores
          </button>
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          style={{
            padding: '6px 12px',
            border: isDarkMode ? '1px solid #334155' : '1px solid #ddd',
            borderRadius: 6,
            background: isDarkMode ? '#0f172a' : 'white',
            color: isDarkMode ? '#f8fafc' : '#000000'
          }}
        >
          <option value="recent">Recently updated</option>
          <option value="points">Points</option>
          <option value="az">A-Z</option>
          <option value="za">Z-A</option>
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search tasks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '6px 12px',
            border: isDarkMode ? '1px solid #334155' : '1px solid #ddd',
            borderRadius: 6,
            background: isDarkMode ? '#0f172a' : 'white',
            color: isDarkMode ? '#f8fafc' : '#000000',
            minWidth: 150
          }}
        />
      </div>

      {/* Task List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {filteredAndSortedQuests.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: 32, 
            color: isDarkMode ? '#94a3b8' : '#64748b' 
          }}>
            No tasks yet. Create your first one.
          </div>
        ) : (
          filteredAndSortedQuests.map(quest => (
            <div 
              key={quest.id} 
              style={{ 
                padding: 16, 
                border: isDarkMode ? '1px solid #334155' : '1px solid #ddd', 
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isDarkMode ? '#1e293b' : 'white'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ color: isDarkMode ? '#f8fafc' : '#000000' }}>
                    {quest.title}
                  </strong>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold',
                    backgroundColor: taskType(quest) === 'chore' ? '#f0f9ff' : '#f0fdf4',
                    color: taskType(quest) === 'chore' ? '#0ea5e9' : '#16a34a',
                    border: `1px solid ${taskType(quest) === 'chore' ? '#bae6fd' : '#bbf7d0'}`
                  }}>
                    {taskType(quest) === 'chore' ? 'Chore' : 'Quest'}
                  </span>
                </div>
                <div style={{ color: isDarkMode ? '#94a3b8' : '#64748b', marginTop: 4 }}>
                  +{quest.points} pts
                  {quest.recurrence && quest.recurrence.type !== 'none' && (
                    <span> - Recurring ({quest.recurrence.type})</span>
                  )}
                  {quest.category && (
                    <span> - {quest.category}</span>
                  )}
                </div>
                {quest.description && (
                  <div style={{ color: isDarkMode ? '#cbd5e1' : '#334155', marginTop: 4, fontSize: 14 }}>
                    {quest.description}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleEditQuest(quest.id)}
                  style={{
                    padding: '4px 8px',
                    border: isDarkMode ? '1px solid #0ea5e9' : '1px solid #0ea5e9',
                    background: isDarkMode ? '#0f172a' : 'white',
                    color: isDarkMode ? '#38bdf8' : '#0ea5e9',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => { setAssignQuestId(quest.id); setAssignError(''); }}
                  style={{
                    padding: '4px 8px',
                    border: isDarkMode ? '1px solid #16a34a' : '1px solid #16a34a',
                    background: isDarkMode ? '#0f172a' : 'white',
                    color: isDarkMode ? '#86efac' : '#16a34a',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Assign
                </button>
                <button
                  onClick={() => deleteQuest(quest.id)}
                  style={{
                    padding: '4px 8px',
                    border: isDarkMode ? '1px solid #ef4444' : '1px solid #ef4444',
                    background: isDarkMode ? '#0f172a' : 'white',
                    color: isDarkMode ? '#f87171' : '#ef4444',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingQuest) && (
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
            backgroundColor: isDarkMode ? '#0f172a' : 'white',
            padding: 24,
            borderRadius: 8,
            maxWidth: 500,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ 
              marginTop: 0, 
              color: isDarkMode ? '#f8fafc' : '#000000',
              marginBottom: 20
            }}>
              {editingQuest ? 'Edit Task' : 'Add Task'}
            </h3>
            
            <QuestForm 
              quest={editingQuest ? quests.find(q => q.id === editingQuest) : undefined}
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
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignQuestId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: isDarkMode ? '#0f172a' : 'white', padding: 24, borderRadius: 8, width: '90%', maxWidth: 420,
            border: isDarkMode ? '1px solid #334155' : '1px solid #ddd'
          }}>
            <h3 style={{ marginTop: 0, color: isDarkMode ? '#f8fafc' : '#000000' }}>Assign Task</h3>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#374151' }}>Choose a child to assign this task to.</p>
            {assignError && (
              <div style={{ marginBottom: 8, color: isDarkMode ? '#fca5a5' : '#991b1b' }}>{assignError}</div>
            )}
            <div style={{ display: 'grid', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
              {linkedChildren.length === 0 && (
                <div style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>No linked children. Link a child in Settings.</div>
              )}
              {linkedChildren.map((c) => (
                <button key={c.childId}
                  onClick={async () => {
                    try {
                      setAssignError('');
                      if (!hero) throw new Error('Parent profile not ready');
                      const q = quests.find(q => q.id === assignQuestId);
                      await taskAssignmentService.assign({
                        parentId: hero.id,
                        childId: c.childId,
                        questId: assignQuestId!,
                        title: q?.title || 'Task',
                        points: q?.points || 0,
                      });
                      setAssignQuestId(null);
                    } catch (e: any) {
                      setAssignError(e?.message || 'Failed to assign');
                    }
                  }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', borderRadius: 8,
                    border: isDarkMode ? '1px solid #334155' : '1px solid #ddd',
                    background: isDarkMode ? '#1e293b' : 'white', cursor: 'pointer'
                  }}
                >
                  <span style={{ color: isDarkMode ? '#f8fafc' : '#000000' }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>Tap to assign</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={() => setAssignQuestId(null)}
                style={{ padding: '8px 12px', background: isDarkMode ? '#334155' : '#e2e8f0', color: isDarkMode ? '#f8fafc' : '#111827', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Tasks;
