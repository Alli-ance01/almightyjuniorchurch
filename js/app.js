// app.js - Public Facing Logic

document.addEventListener('DOMContentLoaded', () => {
  // Load initial data
  loadEvents();
  loadSermons();

  // Setup form listeners
  const prayerForm = document.getElementById('prayer-form');
  if (prayerForm) {
    prayerForm.addEventListener('submit', handlePrayerSubmit);
  }

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  // Theme Toggle Logic
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
    if (currentTheme) {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
    
    themeToggle.addEventListener('click', () => {
      let theme = document.documentElement.getAttribute('data-theme');
      if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      }
    });
  }

  // Scroll Animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    observer.observe(el);
  });
});

// Load Announcements/Events
function loadEvents() {
  const eventsGrid = document.getElementById('events-grid');
  if (!eventsGrid) return;

  firebaseDb.collection('announcements').orderBy('createdAt', 'desc').limit(3).get()
    .then((snapshot) => {
      if (snapshot.empty) {
        eventsGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; color: var(--text-muted);">No upcoming events at the moment.</p>';
        return;
      }
      
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        // RSVP Logic
        let rsvpBtn = '';
        // If user is logged in (auth state is handled globally, we can check if window.currentUser exists or provide a generic "Please login to RSVP" click)
        rsvpBtn = `<button onclick="handleRSVP('${doc.id}', '${data.title.replace(/'/g, "\\'")}')" class="btn btn-sm btn-outline" style="margin-top: 1rem; width: 100%;">RSVP</button>`;

        html += `
          <div class="card">
            <div class="card-body">
              <div class="card-meta">${data.date}</div>
              <h3 class="card-title">${data.title}</h3>
              <p class="card-text">${data.description}</p>
              ${rsvpBtn}
            </div>
          </div>
        `;
      });
      eventsGrid.innerHTML = html;
    })
    .catch(error => {
      console.error("Error loading events:", error);
      eventsGrid.innerHTML = '<p style="text-align: center; color: red; grid-column: 1/-1;">Error loading events.</p>';
    });
}

// Load Sermons
function loadSermons() {
  const sermonsGrid = document.getElementById('sermons-grid');
  if (!sermonsGrid) return;

  firebaseDb.collection('sermons').orderBy('createdAt', 'desc').limit(3).get()
    .then((snapshot) => {
      if (snapshot.empty) {
        sermonsGrid.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; color: var(--text-muted);">No sermons posted yet.</p>';
        return;
      }
      
      let html = '';
      snapshot.forEach(doc => {
        const data = doc.data();
        let mediaHtml = '';
        
        // Handle YouTube embed if present
        if (data.youtubeLink) {
          // Extract video ID from URL
          const videoIdMatch = data.youtubeLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
          const videoId = videoIdMatch ? videoIdMatch[1] : null;
          
          if (videoId) {
            mediaHtml = `
              <div class="video-container">
                <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </div>
            `;
          }
        }

        // Sermon Notes
        let notesBtn = '';
        if (data.notes && data.notes.trim() !== '') {
          // Escape quotes for HTML attribute
          const escapedNotes = encodeURIComponent(data.notes);
          const escapedTitle = encodeURIComponent(data.title);
          notesBtn = `<button onclick="openSermonNotes('${escapedTitle}', '${escapedNotes}')" class="btn btn-sm btn-outline" style="margin-top: 1rem; width: 100%;">Read Notes</button>`;
        }

        html += `
          <div class="card">
            <div class="card-body">
              ${mediaHtml}
              <div class="card-meta">${data.date}</div>
              <h3 class="card-title">${data.title}</h3>
              <p class="card-text">${data.summary}</p>
              ${notesBtn}
            </div>
          </div>
        `;
      });
      sermonsGrid.innerHTML = html;
    })
    .catch(error => {
      console.error("Error loading sermons:", error);
      sermonsGrid.innerHTML = '<p style="text-align: center; color: red; grid-column: 1/-1;">Error loading sermons.</p>';
    });
}

// Handle Prayer Request Submission
function handlePrayerSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('prayer-name').value;
  const request = document.getElementById('prayer-request').value;
  const btn = e.target.querySelector('button');
  const alert = document.getElementById('prayer-alert');
  
  btn.disabled = true;
  btn.textContent = 'Submitting...';
  
  firebaseDb.collection('prayerRequests').add({
    name: name,
    request: request,
    prayedFor: false,
    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    e.target.reset();
    showAlert(alert, 'Prayer request submitted successfully! We are praying for you.', 'success');
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
    showAlert(alert, 'Failed to submit request. Please try again.', 'error');
  })
  .finally(() => {
    btn.disabled = false;
    btn.textContent = 'Submit Request';
  });
}

// Handle Contact Form Submission
function handleContactSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('contact-name').value;
  const email = document.getElementById('contact-email').value;
  const message = document.getElementById('contact-message').value;
  const btn = e.target.querySelector('button');
  const alert = document.getElementById('contact-alert');
  
  btn.disabled = true;
  btn.textContent = 'Sending...';
  
  firebaseDb.collection('contactMessages').add({
    name: name,
    email: email,
    message: message,
    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    e.target.reset();
    showAlert(alert, 'Message sent successfully! We will get back to you soon.', 'success');
  })
  .catch((error) => {
    console.error("Error adding document: ", error);
    showAlert(alert, 'Failed to send message. Please try again.', 'error');
  })
  .finally(() => {
    btn.disabled = false;
    btn.textContent = 'Send Message';
  });
}

// Utility function to show alerts
function showAlert(element, message, type) {
  element.textContent = message;
  element.className = `alert alert-${type} show`;
  setTimeout(() => {
    element.className = 'alert';
  }, 5000);
}

// Handle RSVP Click
window.handleRSVP = function(eventId, eventTitle) {
  // Check if logged in
  const user = firebaseAuth.currentUser;
  if (!user) {
    alert("Please log in or register to RSVP for events!");
    window.location.href = 'login.html';
    return;
  }
  
  // Get user profile to get the name
  firebaseDb.collection('users').doc(user.uid).get().then(doc => {
    if (doc.exists) {
      const userData = doc.data();
      // Record RSVP
      firebaseDb.collection('eventRSVPs').add({
        eventId: eventId,
        eventTitle: eventTitle,
        userId: user.uid,
        userName: userData.name,
        rsvpdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert("Successfully RSVP'd to " + eventTitle + "!");
      }).catch(err => {
        console.error("RSVP error:", err);
        alert("Failed to RSVP. Please try again.");
      });
    }
  });
};

// Open Sermon Notes Modal
window.openSermonNotes = function(encodedTitle, encodedNotes) {
  const title = decodeURIComponent(encodedTitle);
  const notes = decodeURIComponent(encodedNotes);
  
  document.getElementById('sermon-notes-title').textContent = title + " - Notes";
  document.getElementById('sermon-notes-content').textContent = notes;
  document.getElementById('modal-sermon-notes').classList.add('active');
};
