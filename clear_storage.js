// Clear localStorage
localStorage.clear();

// Clear IndexedDB databases
indexedDB.databases().then(dbs => {
  dbs.forEach(db => {
    if (db.name) {
      indexedDB.deleteDatabase(db.name);
    }
  });
});

console.log('Cleared localStorage and IndexedDB databases');