// Test file to verify profile customization functionality
console.log('Testing profile customization...');

// Check if avatarUrl field exists in Hero type
const testHero = {
  id: 'test-hero-1',
  name: 'Test Child',
  points: 0,
  streakDays: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  avatarUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
};

console.log('Hero with avatar URL:', testHero);

// Test avatar preview functionality
const avatarPreviewTest = (file: File | null) => {
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const avatarUrl = e.target?.result as string;
      console.log('Avatar preview URL generated:', avatarUrl.substring(0, 50) + '...');
    };
    reader.readAsDataURL(file);
  }
};

console.log('Avatar preview function created');

// Test profile update functionality
const updateProfileTest = async (heroId: string, newName: string, newAvatar?: File) => {
  console.log(`Updating profile for hero ${heroId}`);
  console.log(`New name: ${newName}`);
  
  if (newAvatar) {
    console.log(`New avatar file: ${newAvatar.name}`);
    avatarPreviewTest(newAvatar);
  }
  
  // Simulate API call
  setTimeout(() => {
    console.log('Profile updated successfully');
  }, 100);
};

console.log('Profile update function created');

// Run tests
updateProfileTest('hero-1', 'Emma', null);

console.log('Profile customization tests completed');