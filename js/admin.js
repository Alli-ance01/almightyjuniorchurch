// admin.js - Admin Logic

let isReady = false;

window.addEventListener('authStateReady', (e) => {
  const { user, userData } = e.detail;
  if (user && userData && userData.role === 'admin') {
    isReady = true;
    document.getElementById('admin-name').textContent = userData.name.split(' ')[0];
    
    // Initial load
    loadAnnouncements();
    loadSermons();
    loadMembers();
    loadPrayerRequests();
    loadContactMessages();
  }
});

// -- Tab Navigation --
function showTab(tabId) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(el => el.style.display = 'none');
  // Deactivate all links
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  
  // Show target
  document.getElementById(tabId).style.display = 'block';
  // Activate link
  const link = document.querySelector(`[onclick="showTab('${tabId}')"]`);
  if(link) link.classList.add('active');
}

// -- Utility: Show/Hide Modals --
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal.classList.contains('active')) {
    modal.classList.remove('active');
  } else {
    modal.classList.add('active');
  }
}

// ==========================================
// ANNOUNCEMENTS
// ==========================================

function loadAnnouncements() {
  const tbody = document.getElementById('announcements-tbody');
  
  firebaseDb.collection('announcements').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      html += `
        <tr>
          <td>${data.title}</td>
          <td>${data.date}</td>
          <td>
            <button onclick="deleteDoc('announcements', '${doc.id}')" class="btn btn-sm btn-outline" style="color: red; border-color: red;">Delete</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html || '<tr><td colspan="3">No announcements found.</td></tr>';
  });
}

function handleAddAnnouncement(e) {
  e.preventDefault();
  const title = document.getElementById('ann-title').value;
  const date = document.getElementById('ann-date').value;
  const desc = document.getElementById('ann-desc').value;
  
  firebaseDb.collection('announcements').add({
    title: title,
    date: date,
    description: desc,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    e.target.reset();
    toggleModal('modal-announcement');
  }).catch(err => alert("Error adding announcement: " + err.message));
}

// ==========================================
// SERMONS
// ==========================================

function loadSermons() {
  const tbody = document.getElementById('sermons-tbody');
  
  firebaseDb.collection('sermons').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      html += `
        <tr>
          <td>${data.title}</td>
          <td>${data.date}</td>
          <td>${data.youtubeLink ? 'Yes' : 'No'}</td>
          <td>
            <button onclick="deleteDoc('sermons', '${doc.id}')" class="btn btn-sm btn-outline" style="color: red; border-color: red;">Delete</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html || '<tr><td colspan="4">No sermons found.</td></tr>';
  });
}

function handleAddSermon(e) {
  e.preventDefault();
  const title = document.getElementById('sermon-title').value;
  const date = document.getElementById('sermon-date').value;
  const yt = document.getElementById('sermon-yt').value;
  const summary = document.getElementById('sermon-summary').value;
  
  firebaseDb.collection('sermons').add({
    title: title,
    date: date,
    youtubeLink: yt,
    summary: summary,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    e.target.reset();
    toggleModal('modal-sermon');
  }).catch(err => alert("Error adding sermon: " + err.message));
}

// ==========================================
// MEMBERS & ATTENDANCE
// ==========================================

function loadMembers() {
  const tbody = document.getElementById('members-tbody');
  
  firebaseDb.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const badgeClass = data.role === 'admin' ? 'badge-warning' : 'badge-success';
      html += `
        <tr>
          <td>${data.name}</td>
          <td>${data.email}</td>
          <td><span class="badge ${badgeClass}">${data.role}</span></td>
          <td>${data.ageGroup}</td>
          <td>
            <button onclick="viewMemberAttendance('${doc.id}', '${data.name}')" class="btn btn-sm btn-outline">View Attendance</button>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html || '<tr><td colspan="5">No members found.</td></tr>';
  });
}

function viewMemberAttendance(userId, userName) {
  const tbody = document.getElementById('attendance-tbody');
  document.getElementById('att-member-name').textContent = userName;
  
  firebaseDb.collection('attendance').where('userId', '==', userId).orderBy('weekOf', 'desc').get().then(snapshot => {
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const markedDate = data.markedAt ? data.markedAt.toDate().toLocaleString() : 'N/A';
      html += `
        <tr>
          <td>${data.weekOf}</td>
          <td>${markedDate}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html || '<tr><td colspan="2">No attendance records found.</td></tr>';
    toggleModal('modal-attendance');
  }).catch(err => {
    // Note: Firestore requires an index for where() combined with orderBy(). 
    // It will throw an error with a link to create the index in the console if it's not created.
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="2" style="color:red;">Error loading. (Check console for index link)</td></tr>`;
    toggleModal('modal-attendance');
  });
}

// ==========================================
// PRAYER REQUESTS
// ==========================================

function loadPrayerRequests() {
  const tbody = document.getElementById('prayer-tbody');
  
  firebaseDb.collection('prayerRequests').orderBy('submittedAt', 'desc').onSnapshot(snapshot => {
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const statusBadge = data.prayedFor 
        ? `<span class="badge badge-success">Prayed</span>` 
        : `<span class="badge badge-warning">Pending</span>`;
        
      const actionBtn = data.prayedFor
        ? ''
        : `<button onclick="markPrayedFor('${doc.id}')" class="btn btn-sm btn-primary">Mark Prayed</button>`;

      html += `
        <tr>
          <td>${data.name}</td>
          <td>${data.request}</td>
          <td>${statusBadge}</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html || '<tr><td colspan="4">No prayer requests found.</td></tr>';
  });
}

function markPrayedFor(id) {
  firebaseDb.collection('prayerRequests').doc(id).update({
    prayedFor: true
  });
}

// ==========================================
// CONTACT MESSAGES
// ==========================================

function loadContactMessages() {
  const tbody = document.getElementById('contact-tbody');
  
  firebaseDb.collection('contactMessages').orderBy('submittedAt', 'desc').onSnapshot(snapshot => {
    let html = '';
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.submittedAt ? data.submittedAt.toDate().toLocaleDateString() : '';
      html += `
        <tr>
          <td>${data.name}</td>
          <td>${data.email}</td>
          <td>${data.message}</td>
          <td>${date}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html || '<tr><td colspan="4">No messages found.</td></tr>';
  });
}

// ==========================================
// GENERAL UTILS
// ==========================================

function deleteDoc(collection, id) {
  if (confirm('Are you sure you want to delete this?')) {
    firebaseDb.collection(collection).doc(id).delete();
  }
}

// Setup form listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('form-add-announcement').addEventListener('submit', handleAddAnnouncement);
  document.getElementById('form-add-sermon').addEventListener('submit', handleAddSermon);
});
