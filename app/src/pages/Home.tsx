import { useHero } from '@state/hero';
import { useQuests } from '@state/quests';
import { useBoard } from '@state/board';
import QuestCard from '@components/QuestCard';
import ProgressBar from '@components/ProgressBar';

type HomeProps = {
  onNavigateToRewards: () => void;
};

const Home = ({ onNavigateToRewards }: HomeProps) => {
  const { hero, loading: heroLoading, error: heroError, refreshHero } = useHero();
  const { loading: questsLoading, error: questsError, refreshQuests } = useQuests();
  
  // For now, we'll use today's date and a default hero ID
  // In a real app, we would get these from context or props
  const today = new Date().toISOString().slice(0, 10);
  const heroId = hero?.id || 'hero-1';
  const { boardItems, loading: boardLoading, error: boardError, completeQuest, refreshBoard } = useBoard(heroId, today);

  const errorMessages = [heroError, questsError, boardError].filter(Boolean) as string[];
  const handleRetry = async () => {
    await refreshHero();
    await refreshQuests();
    await refreshBoard(hero?.id || heroId, today);
  };

  if (heroLoading || questsLoading || boardLoading) {
    return <div>Loading...</div>;
  }

  // Calculate progression level (every 10 progression points for now)
  const progressionLevel = Math.floor((hero?.progressionPoints || 0) / 10) + 1;
  const pointsInCurrentLevel = (hero?.progressionPoints || 0) % 10;

  return (
    <section>
      {errorMessages.length > 0 && (
        <div style={{ 
          border: '1px solid #ef4444',
          backgroundColor: '#fee2e2',
          color: '#7f1d1d',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>We ran into a data error</div>
          <div style={{ marginBottom: 12 }}>
            {errorMessages.map((message, index) => (
              <div key={`${message}-${index}`}>{message}</div>
            ))}
          </div>
          <button
            onClick={handleRetry}
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
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#0ea5e9',
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
            <h1 style={{ margin: 0, fontSize: 24 }}>{hero?.name}</h1>
            <div style={{ fontSize: 14, opacity: 0.8 }}>Level {progressionLevel - 1}</div>
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
          <span>Total XP: {hero?.progressionPoints || 0}</span>
          <span>Reward Points: {hero?.rewardPoints || 0}</span>
          <button 
            onClick={onNavigateToRewards}
            style={{ 
              background: document.body.classList.contains('dark') ? '#1e293b' : 'none', 
              border: document.body.classList.contains('dark') ? '1px solid #334155' : 'none', 
              color: '#0ea5e9', 
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
      
      <h2>Today's Quests</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {boardItems.map((item) => (
          <QuestCard 
            key={item.id}
            title={item.quest?.title || 'Unknown Quest'}
            points={item.quest?.points || 0}
            completed={!!item.completedAt}
            onComplete={() => completeQuest(item.id)}
          />
        ))}
      </div>
    </section>
  );
};

export default Home;
