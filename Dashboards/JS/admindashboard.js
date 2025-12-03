/* admindashboard.js - COMPLETE VERSION */

import { db } from '../../firebase.js'; 
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  setDoc 
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// ==========================================
//  MODULE A: USER MANAGEMENT
// ==========================================

const usersCol = collection(db, 'users');

onSnapshot(usersCol, (snapshot) => {
  const tbody = document.getElementById('userTableBody');
  const countLabel = document.getElementById('userCount');
  
  if(!tbody) return; 

  tbody.innerHTML = ''; 
  let count = 0;

  // CHANGED VARIABLE FROM 'document' TO 'docSnap' TO FIX ERROR
  snapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const docId = docSnap.id;
    count++;
    
    const userStatus = user.status || 'Active'; 
    const userRole = user.role || 'Student'; 
    const statusClass = userStatus === 'Active' ? 'active' : 'banned';
    const statusIcon = userStatus === 'Active' ? '🚫' : '✅'; 
    
    // Now 'document' refers to the global window.document again
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight:700; color:#fff">${user.name || 'No Name'}</div>
        <div style="font-size:0.85rem; color:var(--muted)">${user.email}</div>
      </td>
      <td>${userRole}</td>
      <td><span class="status-pill ${statusClass}">${userStatus}</span></td>
      <td style="text-align:right">
        <button class="btn-ghost action-btn" data-action="ban" data-id="${docId}" data-status="${userStatus}" title="Ban/Unban">${statusIcon}</button>
        <button class="btn-ghost btn-danger action-btn" data-action="delete" data-id="${docId}" title="Delete">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  if(countLabel) countLabel.innerText = count;
  attachButtonListeners();
});

function attachButtonListeners() {
  document.querySelectorAll('.action-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', async (e) => {
      const action = newBtn.dataset.action;
      const id = newBtn.dataset.id;

      if (action === 'ban') {
        const newStatus = newBtn.dataset.status === 'Active' ? 'Banned' : 'Active';
        try { await updateDoc(doc(db, 'users', id), { status: newStatus }); } catch (err) { alert(err.message); }
      }
      
      if (action === 'delete') {
        if(confirm("Permanently delete this user?")) {
          try { await deleteDoc(doc(db, 'users', id)); } catch (err) { alert(err.message); }
        }
      }
    });
  });
}

// ==========================================
//  MODULE B: CONTENT MANAGEMENT (CMS)
// ==========================================

// Define which IDs in learning.html are editable
const contentConfig = [
  { id: 'gdpr_title', label: 'GDPR Card Title', default: '🇪🇺 GDPR: Right to Access' },
  { id: 'gdpr_desc', label: 'GDPR Description', default: 'You can ask any company for a copy...' },
  { id: 'gdpr_detail', label: 'GDPR Detail', default: 'Send a Subject Access Request...' },
  { id: 'dpa_title', label: 'Kenya DPA Title', default: '🇰🇪 Kenya DPA: Informed Consent' },
  { id: 'dpa_desc', label: 'Kenya DPA Description', default: 'You must be told CLEARLY what data...' },
  { id: 'dpa_detail', label: 'Kenya DPA Detail', default: 'If a privacy policy is hidden...' }
];

// Render the CMS Cards
function renderCMS() {
  const grid = document.getElementById('contentGrid');
  if(!grid) return;
  
  grid.innerHTML = ''; // Clear

  contentConfig.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card'; // Reusing your global card style
    card.style.display = 'flex'; card.style.flexDirection = 'column'; card.style.gap = '10px';

    // Create container for live text
    const textContainer = document.createElement('div');
    textContainer.style.background = '#000'; 
    textContainer.style.padding = '10px'; 
    textContainer.style.borderRadius = '6px';
    textContainer.style.color = '#fff';
    textContainer.innerText = "Loading...";

    // Listen to this specific document
    onSnapshot(doc(db, 'learning_content', item.id), (docSnap) => {
      if (docSnap.exists()) {
        textContainer.innerText = docSnap.data().text;
      } else {
        textContainer.innerText = item.default; // Fallback
      }
    });

    card.innerHTML = `
      <div style="color:var(--accent1); font-weight:700">${item.label}</div>
      <div style="font-size:0.8rem; color:var(--muted)">ID: ${item.id}</div>
    `;
    
    card.appendChild(textContainer);

    const btn = document.createElement('button');
    btn.className = 'btn-ghost';
    btn.innerText = '✏️ Edit Text';
    btn.onclick = () => openEditModal(item.id, textContainer.innerText);
    
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

// Open Edit Modal
function openEditModal(id, currentText) {
  const newText = prompt(`Edit content for ${id}:`, currentText);
  if (newText !== null && newText !== currentText) {
    // Using setDoc with merge:true creates the doc if it doesn't exist
    setDoc(doc(db, 'learning_content', id), { text: newText }, { merge: true });
  }
}

// Initialize CMS on load
renderCMS();


// ==========================================
//  MODULE C: BREACH LOGS
// ==========================================

const logsCol = collection(db, 'breach_logs');
const qLogs = query(logsCol, orderBy('timestamp', 'desc'), limit(20));

onSnapshot(qLogs, (snapshot) => {
  const tbody = document.getElementById('logsTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';

  snapshot.forEach((document) => {
    const log = document.data();
    
    // Format Time
    let timeStr = "Unknown";
    if(log.timestamp) {
        const date = log.timestamp.toDate();
        timeStr = date.toLocaleTimeString() + " (" + date.toLocaleDateString() + ")";
    }

    const riskLevel = log.risk > 50 ? 'High' : 'Low';
    const badgeClass = log.risk > 50 ? 'banned' : 'active'; // reusing badge styles

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--muted); font-size:0.85rem">${timeStr}</td>
      <td style="color:#fff">${log.message}</td>
      <td>${log.risk}%</td>
      <td><span class="status-pill ${badgeClass}">${riskLevel}</span></td>
    `;
    tbody.appendChild(tr);
  });
});


// ==========================================
//  MODULE D: NAVIGATION & MODALS UI
// ==========================================

window.openUserModal = () => { document.getElementById('userModal').classList.add('open'); };
window.closeModal = () => { document.getElementById('userModal').classList.remove('open'); };

window.saveUser = async () => {
  const name = document.getElementById('userName').value;
  const email = document.getElementById('userEmail').value;
  const role = document.getElementById('userRole').value;
  const status = document.getElementById('userStatus').value;

  if(!name || !email) return alert("Fill fields");

  try {
    await addDoc(collection(db, 'users'), {
      name, email, role, status, createdAt: serverTimestamp()
    });
    window.closeModal();
  } catch(err) { alert("Error: " + err.message); }
};

window.showTab = (sectionId) => {
  document.getElementById('tab-users').style.display = 'none';
  document.getElementById('tab-content').style.display = 'none';
  document.getElementById('tab-logs').style.display = 'none';
  
  document.getElementById('tab-' + sectionId).style.display = 'block';
  
  // Update Sidebar Active State
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  if(event) event.currentTarget.classList.add('active');
};