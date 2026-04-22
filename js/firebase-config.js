// firebase-config.js

// Firebase Configuration
// Replace these placeholders with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyByqdjj5bvo6j2MGy5MKIFYFmd5i2yjWjw",
  authDomain: "almighty-419f8.firebaseapp.com",
  projectId: "almighty-419f8",
  storageBucket: "almighty-419f8.firebasestorage.app",
  messagingSenderId: "997256844655",
  appId: "1:997256844655:web:c9a6e1ea738cbdca8a449a"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Export for other files if needed (though they are global in compat mode)
window.firebaseAuth = auth;
window.firebaseDb = db;
