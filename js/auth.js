// auth.js - Authentication & Route Guarding Logic

// Listen for auth state changes
firebaseAuth.onAuthStateChanged((user) => {
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');
  const isProtectedPage = currentPath.includes('dashboard.html') || currentPath.includes('admin.html');
  const isAdminPage = currentPath.includes('admin.html');

  if (user) {
    // User is logged in
    
    // Fetch user role
    firebaseDb.collection('users').doc(user.uid).get().then((doc) => {
      if (doc.exists) {
        const userData = doc.data();
        const role = userData.role;

        // Redirect from auth pages if logged in
        if (isAuthPage) {
          if (role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }

        // Protect admin page
        if (isAdminPage && role !== 'admin') {
          window.location.href = 'dashboard.html';
        }
        
        // Update UI if on a page with navbar
        updateNavbarUI(user, userData);
        
        // Dispatch custom event for pages that need user data
        const event = new CustomEvent('authStateReady', { detail: { user, userData } });
        window.dispatchEvent(event);

      } else {
        console.error("No user data found in Firestore");
        // Handle case where auth exists but no firestore doc (shouldn't happen with our flow)
        if(isProtectedPage) window.location.href = 'index.html';
      }
    }).catch(error => {
      console.error("Error fetching user data:", error);
    });

  } else {
    // User is logged out
    if (isProtectedPage) {
      window.location.href = 'login.html';
    }
    updateNavbarUI(null, null);
    
    const event = new CustomEvent('authStateReady', { detail: { user: null, userData: null } });
    window.dispatchEvent(event);
  }
});

// Update Navbar UI based on auth state
function updateNavbarUI(user, userData) {
  const authLinks = document.getElementById('nav-auth-links');
  if (!authLinks) return;

  if (user && userData) {
    const dashboardLink = userData.role === 'admin' ? 'admin.html' : 'dashboard.html';
    authLinks.innerHTML = `
      <a href="${dashboardLink}" class="btn btn-outline btn-sm">Portal</a>
      <button onclick="logout()" class="btn btn-primary btn-sm">Logout</button>
    `;
  } else {
    authLinks.innerHTML = `
      <a href="login.html" class="btn btn-outline btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

// Logout function
window.logout = function() {
  firebaseAuth.signOut().then(() => {
    window.location.href = 'index.html';
  }).catch((error) => {
    console.error('Logout error:', error);
  });
};
