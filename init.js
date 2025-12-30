// Initialize shared module and both apps
const { execSync } = require('child_process');
const path = require('path');

console.log('Initializing shared module...');
try {
  process.chdir(path.join(__dirname, 'shared'));
  execSync('npm install', { stdio: 'inherit' });
  console.log('Shared module initialized successfully!');
} catch (error) {
  console.error('Failed to initialize shared module:', error.message);
  process.exit(1);
}

console.log('Initializing child app...');
try {
  process.chdir(path.join(__dirname, 'child-app'));
  execSync('npm install', { stdio: 'inherit' });
  console.log('Child app initialized successfully!');
} catch (error) {
  console.error('Failed to initialize child app:', error.message);
  process.exit(1);
}

console.log('Initializing parent app...');
try {
  process.chdir(path.join(__dirname, 'parent-app'));
  execSync('npm install', { stdio: 'inherit' });
  console.log('Parent app initialized successfully!');
} catch (error) {
  console.error('Failed to initialize parent app:', error.message);
  process.exit(1);
}

console.log('All apps initialized successfully!');