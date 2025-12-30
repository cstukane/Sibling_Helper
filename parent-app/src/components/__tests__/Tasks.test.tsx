import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Tasks from '../../pages/Tasks';

// Mock the useQuests hook
vi.mock('../../state/quests', () => ({
  useQuests: () => ({
    quests: [
      {
        id: '1',
        title: 'Help with dishes',
        points: 10,
        active: true,
        created_at: '2023-01-01T10:00:00Z',
        updated_at: '2023-01-01T10:00:00Z'
      },
      {
        id: '2',
        title: 'Make bed',
        points: 5,
        active: true,
        recurrence: { type: 'daily' },
        created_at: '2023-01-01T09:00:00Z',
        updated_at: '2023-01-01T11:00:00Z'
      }
    ],
    addQuest: vi.fn(),
    updateQuest: vi.fn(),
    deleteQuest: vi.fn()
  })
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

// Mock QuestForm component
vi.mock('../QuestForm', () => ({
  default: ({ onSave, onCancel }: any) => (
    <div data-testid="quest-form">
      <button onClick={() => onSave({ title: 'Test Quest', points: 10 })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}));

describe('Tasks Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render tasks list', () => {
    render(<Tasks isDarkMode={false} />);
    
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Help with dishes')).toBeInTheDocument();
    expect(screen.getByText('Make bed')).toBeInTheDocument();
  });

  it('should show "Add Task" button', () => {
    render(<Tasks isDarkMode={false} />);
    
    expect(screen.getByText('Add Task')).toBeInTheDocument();
  });

  it('should show filter buttons', () => {
    render(<Tasks isDarkMode={false} />);
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Quests')).toBeInTheDocument();
    expect(screen.getByText('Chores')).toBeInTheDocument();
  });

  it('should show sort dropdown', () => {
    render(<Tasks isDarkMode={false} />);
    
    const sortSelect = screen.getByRole('combobox');
    expect(sortSelect).toBeInTheDocument();
  });

  it('should show search input', () => {
    render(<Tasks isDarkMode={false} />);
    
    const searchInput = screen.getByPlaceholderText('Search tasks');
    expect(searchInput).toBeInTheDocument();
  });

  it('should open add task modal when "Add Task" button is clicked', () => {
    render(<Tasks isDarkMode={false} />);
    
    fireEvent.click(screen.getByText('Add Task'));
    
    expect(screen.getByTestId('quest-form')).toBeInTheDocument();
  });

  it('should show task type badges', () => {
    render(<Tasks isDarkMode={false} />);
    
    // "Help with dishes" has no recurrence, so should be labeled as Quest
    expect(screen.getByText('Quest')).toBeInTheDocument();
    
    // "Make bed" has daily recurrence, so should be labeled as Chore
    expect(screen.getByText('Chore')).toBeInTheDocument();
  });

  it('should show points for each task', () => {
    render(<Tasks isDarkMode={false} />);
    
    expect(screen.getByText('+10 pts')).toBeInTheDocument();
    expect(screen.getByText('+5 pts')).toBeInTheDocument();
  });
});
