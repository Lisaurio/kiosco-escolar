const firebaseConfig = {
  apiKey: "AIzaSyBtSqDTbHLpf5sQTa9HFiaruA9EKSmPvkE",
  authDomain: "kiosco-503cd.firebaseapp.com",
  projectId: "kiosco-503cd",
  storageBucket: "kiosco-503cd.firebasestorage.app",
  messagingSenderId: "1071022516934",
  appId: "1:1071022516934:web:4e6d3f149437fbb67285c7"
};
try { firebase.initializeApp(firebaseConfig); } catch (e) { console.error('Firebase init error:', e); }

try {
  firebase.firestore().enablePersistence({ synchronizeTabs: true });
} catch (e) {
  if (e.code !== 'failed-precondition' && e.code !== 'unimplemented') {
    console.error('Firestore persistence error:', e);
  }
}
