/* admindashboard.js - INTEGRATED ANALYTICS VERSION */

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

  snapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const docId = docSnap.id;
    count++;
    
    const userStatus = user.status || 'Active'; 
    const userRole = user.role || 'Student'; 
    const statusClass = userStatus === 'Active' ? 'active' : 'banned';
    const statusIcon = userStatus === 'Active' ? '🚫' : '✅'; 
    
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

const contentConfig = [
  { id: 'gdpr_title', label: 'GDPR Card Title', default: '🇪🇺 GDPR: Right to Access' },
  { id: 'gdpr_desc', label: 'GDPR Description', default: 'You can ask any company for a copy...' },
  { id: 'gdpr_detail', label: 'GDPR Detail', default: 'Send a Subject Access Request...' },
  { id: 'dpa_title', label: 'Kenya DPA Title', default: '🇰🇪 Kenya DPA: Informed Consent' },
  { id: 'dpa_desc', label: 'Kenya DPA Description', default: 'You must be told CLEARLY what data...' },
  { id: 'dpa_detail', label: 'Kenya DPA Detail', default: 'If a privacy policy is hidden...' }
];

function renderCMS() {
  const grid = document.getElementById('contentGrid');
  if(!grid) return;
  
  grid.innerHTML = ''; 

  contentConfig.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card'; 
    card.style.display = 'flex'; card.style.flexDirection = 'column'; card.style.gap = '10px';

    const textContainer = document.createElement('div');
    textContainer.style.background = '#000'; 
    textContainer.style.padding = '10px'; 
    textContainer.style.borderRadius = '6px';
    textContainer.style.color = '#fff';
    textContainer.innerText = "Loading...";

    onSnapshot(doc(db, 'learning_content', item.id), (docSnap) => {
      if (docSnap.exists()) {
        textContainer.innerText = docSnap.data().text;
      } else {
        textContainer.innerText = item.default; 
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

function openEditModal(id, currentText) {
  const newText = prompt(`Edit content for ${id}:`, currentText);
  if (newText !== null && newText !== currentText) {
    setDoc(doc(db, 'learning_content', id), { text: newText }, { merge: true });
  }
}

renderCMS();


// ==========================================
//  MODULE C: BREACH LOGS & ANALYTICS
// ==========================================

const logsCol = collection(db, 'breach_logs');
const qLogs = query(logsCol, orderBy('timestamp', 'desc'), limit(20));

// 1. Logs Table Listener
onSnapshot(qLogs, (snapshot) => {
  const tbody = document.getElementById('logsTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';

  if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--muted)">No breaches recorded yet.</td></tr>';
      return;
  }

  // Changed variable from 'document' to 'docSnap' to avoid conflicts
  snapshot.forEach((docSnap) => {
    const log = docSnap.data();
    
    // --- TIMESTAMP FIX ---
    let timeStr = "Processing...";
    // We check if timestamp exists AND isn't null (which happens briefly on write)
    if(log.timestamp && typeof log.timestamp.toDate === 'function') {
        const date = log.timestamp.toDate();
        timeStr = date.toLocaleTimeString(); // e.g. "10:30:15 AM"
    } else if (log.timestamp) {
         // Fallback if it's not a Firestore timestamp object yet
         timeStr = "Just now";
    }

    const isHighRisk = log.risk > 50;
    const severity = log.severity || (isHighRisk ? 'Critical' : 'Warning');
    const badgeClass = isHighRisk ? 'banned' : 'active'; 

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="color:var(--muted); font-size:0.85rem">${timeStr}</td>
      <td style="color:#fff">
        <span style="color:var(--accent1); font-weight:bold; margin-right:5px">[${log.type || 'LOG'}]</span>
        ${log.message || 'No message'}
      </td>
      <td>${log.risk || 0}%</td>
      <td><span class="status-pill ${badgeClass}">${severity}</span></td>
    `;
    tbody.appendChild(tr);
  });
});

// 2. Real-time Analytics Engine
onSnapshot(collection(db, 'breach_logs'), (snapshot) => {
    let totalAttacks = 0;
    let criticalEvents = 0;
    let avgRisk = 0;
    let totalRisk = 0;

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        totalAttacks++;
        if(data.risk > 50) criticalEvents++;
        totalRisk += (data.risk || 0);
    });

    if(totalAttacks > 0) avgRisk = Math.round(totalRisk / totalAttacks);

    updateAnalyticsUI(totalAttacks, criticalEvents, avgRisk);
});

function updateAnalyticsUI(total, critical, avg) {
    const container = document.getElementById('tab-logs');
    let statsRow = document.getElementById('analytics-row');
    
    // Inject Grid if missing
    if(!statsRow && container) {
        statsRow = document.createElement('div');
        statsRow.id = 'analytics-row';
        statsRow.style.cssText = "display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:20px";
        
        const header = container.querySelector('.page-header');
        if(header) header.parentNode.insertBefore(statsRow, header.nextSibling);
    }

    if(statsRow) {
        statsRow.innerHTML = `
            <div class="card" style="text-align:center; padding:20px">
                <div style="font-size:2.5rem; font-weight:bold; color:var(--accent1)">${total}</div>
                <div style="font-size:0.8rem; color:var(--muted); text-transform:uppercase; letter-spacing:1px">Total Breaches</div>
            </div>
            <div class="card" style="text-align:center; padding:20px">
                <div style="font-size:2.5rem; font-weight:bold; color:var(--danger)">${critical}</div>
                <div style="font-size:0.8rem; color:var(--muted); text-transform:uppercase; letter-spacing:1px">Critical Threats</div>
            </div>
            <div class="card" style="text-align:center; padding:20px">
                <div style="font-size:2.5rem; font-weight:bold; color:#fff">${avg}%</div>
                <div style="font-size:0.8rem; color:var(--muted); text-transform:uppercase; letter-spacing:1px">Avg. Risk Score</div>
            </div>
        `;
    }
}

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
  
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  if(event) event.currentTarget.classList.add('active');
};