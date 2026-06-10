// ==========================================
// 1. PSEUDO-RANDOM DATA ENGINE SEEDING
// ==========================================
const firstNames = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
    "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
    "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
    "Dmitry", "Alex", "Elena", "Marcus", "Viktor", "Sophia", "Oliver", "Rachel", "Brian", "Emily",
    "Kevin", "Anna", "Edward", "Ashley", "Ronald", "Megan", "Timothy", "Cheryl", "Jason", "Ava"
];

const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Igor", "Volkov", "Ivanov", "Petrov"];

const ranks = ["Senior QA Director", "Principal Program Manager", "VP of Software Delivery", "Lead Systems Architect", "Director of Infrastructure"];
const depts = ["Global QA Solutions", "Enterprise Performance", "Agile Core Formations", "Systems Testing Automation"];

const managersSet = new Set();
managersSet.add("Dmitry Igor"); // Force required verification anchor

let fIndex = 0, lIndex = 0, loopCounter = 1;
while(managersSet.size < 500) {
    let nameStr = `${firstNames[fIndex]} ${lastNames[lIndex]}`;
    if (loopCounter > 1) nameStr += ` III`;
    if (!managersSet.has(nameStr)) managersSet.add(nameStr);
    
    lIndex++;
    if (lIndex >= lastNames.length) { lIndex = 0; fIndex++; }
    if (fIndex >= firstNames.length) { fIndex = 0; loopCounter++; }
}

const managers = Array.from(managersSet).map((name, index) => {
    return {
        name: name,
        rank: name === "Dmitry Igor" ? "Lead Systems Architect" : ranks[index % ranks.length],
        dept: depts[index % depts.length],
        projectsCount: 12 + (index % 35),
        rate: parseFloat((92 + (index % 8) + Math.random() * 0.9).toFixed(1)),
        tenure: (3 + (index % 10)) + " Years"
    };
});
managers.sort((a, b) => b.projectsCount - a.projectsCount);

// ==========================================
// 2. DOM INSTANTIATION & STATE CONTEXT
// ==========================================
const managersList = document.getElementById('managersList');
const searchInput = document.getElementById('searchInput');
const deptFilter = document.getElementById('deptFilter');
const rankFilter = document.getElementById('rankFilter');
const searchStats = document.getElementById('searchStats');
const noResults = document.getElementById('noResults');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');

const profileModal = document.getElementById('profileModal');
const modalLoader = document.getElementById('modalLoader');
const loaderMessage = document.getElementById('loaderMessage');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');
const refNumberInput = document.getElementById('refNumberInput');
const refError = document.getElementById('refError');

const profName = document.getElementById('profName');
const profRank = document.getElementById('profRank');
const profDept = document.getElementById('profDept');
const profProjectsCount = document.getElementById('profProjectsCount');
const profRate = document.getElementById('profRate');
const profRateBar = document.getElementById('profRateBar');
const profTenure = document.getElementById('profTenure');

const dashboardView = document.getElementById('dashboardView');
const projectPageView = document.getElementById('projectPageView');
const projectPageContent = document.getElementById('projectPageContent');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');

let activeManager = null;
let dynamicInterval = null;
const baseDynamicTesters = 142;
const projectStartDate = new Date();
projectStartDate.setDate(projectStartDate.getDate() - 27); // Standardized to 27 days real-world duration

// ==========================================
// 3. LOGICAL ENGINE SETUP (DEBOUNCE, FILTER, THEME)
// ==========================================

// Build Select Filtering Roster dynamically
depts.forEach(d => deptFilter.innerHTML += `<option value="${d}">${d}</option>`);
ranks.forEach(r => rankFilter.innerHTML += `<option value="${r}">${r}</option>`);

// Initialize Persistence Configurations
if (localStorage.getItem('themeMode') === 'dark') {
    document.body.classList.add('dark-mode');
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('themeMode', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// Performance Debounce Utility
function debounce(func, timeout = 250) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

// Master Multi-Parameter Query Controller
function computeActiveRoster() {
    const searchVal = searchInput.value.toLowerCase().trim();
    const deptVal = deptFilter.value;
    const rankVal = rankFilter.value;

    return managers.filter(m => {
        const matchesName = m.name.toLowerCase().includes(searchVal);
        const matchesDept = !deptVal || m.dept === deptVal;
        const matchesRank = !rankVal || m.rank === rankVal;
        return matchesName && matchesDept && matchesRank;
    });
}

function renderList() {
    managersList.innerHTML = "";
    const filtered = computeActiveRoster();
    const query = searchInput.value.trim();

    filtered.forEach(manager => {
        const li = document.createElement('li');
        li.className = 'manager-card';

        if (query !== "") {
            const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
            li.innerHTML = manager.name.replace(regex, `<span class="highlight">$1</span>`);
        } else {
            li.textContent = manager.name;
        }

        li.addEventListener('click', () => openManagerProfile(manager));
        managersList.appendChild(li);
    });

    searchStats.textContent = `Showing ${filtered.length} of 500 managers matches`;
    noResults.style.display = filtered.length === 0 ? 'block' : 'none';
}

function escapeRegExp(str) { return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

const debouncedRender = debounce(renderList);
searchInput.addEventListener('input', debouncedRender);
deptFilter.addEventListener('change', renderList);
rankFilter.addEventListener('change', renderList);

// ==========================================
// 4. CSV EXTRACTION UTILITY
// ==========================================
exportCsvBtn.addEventListener('click', () => {
    const subset = computeActiveRoster();
    if(subset.length === 0) return alert("Roster array empty under current queries.");

    let csvContent = "data:text/csv;charset=utf-8,Name,Rank,Department,Projects,Success Rate,Tenure\n";
    subset.forEach(m => {
        csvContent += `"${m.name}","${m.rank}","${m.dept}",${m.projectsCount},${m.rate}%,${m.tenure}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `filtered_manager_roster.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
});

// ==========================================
// 5. PROFILE MODAL INTERACTION LAYER
// ==========================================
function openManagerProfile(manager) {
    activeManager = manager;
    refNumberInput.value = "";
    refError.style.display = "none";
    
    profileModal.style.display = "flex";
    modalLoader.style.display = "flex";
    loaderMessage.textContent = "Retrieving corporate telemetry...";
    modalContent.style.display = "none";

    setTimeout(() => {
        modalLoader.style.display = "none";
        modalContent.style.display = "block";
        
        profName.textContent = manager.name;
        profRank.textContent = manager.rank;
        profDept.textContent = manager.dept;
        profProjectsCount.textContent = manager.projectsCount;
        profRate.textContent = manager.rate + "%";
        profTenure.textContent = manager.tenure;
        
        // Data visualization bar update
        profRateBar.style.width = manager.rate + "%";
        
        refNumberInput.focus();
    }, 450);
}

closeModalBtn.addEventListener('click', () => { profileModal.style.display = "none"; });
window.addEventListener('click', (e) => { if (e.target === profileModal) profileModal.style.display = "none"; });

// Security Validation Hook (Upgraded Transition Workflow)
refNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const token = e.target.value.trim();
        if (token === "672Djj1Z" && activeManager && activeManager.name === "Dmitry Igor") {
            
            // Step 1: Re-engage loader element configuration with customized clear message
            modalContent.style.display = "none";
            modalLoader.style.display = "flex";
            loaderMessage.textContent = "Authorizing encryption channels... Please wait.";
            
            // Step 2: Trigger time-buffered routing transition sequence
            setTimeout(() => {
                profileModal.style.display = "none";
                switchToProjectPage();
            }, 1500);

        } else {
            refError.style.display = "block";
        }
    }
});

refNumberInput.addEventListener('input', () => { refError.style.display = "none"; });

// ==========================================
// 6. WORKSPACE ROUTING & PERSISTENCE STATE
// ==========================================
function switchToProjectPage() {
    dashboardView.style.display = "none";
    projectPageView.style.display = "block";
    window.scrollTo(0,0);

    renderProjectPageContent();

    if(dynamicInterval) clearInterval(dynamicInterval);
    dynamicInterval = setInterval(() => {
        const drift = Math.floor(Math.random() * 5) - 2;
        const targetCounter = document.getElementById('liveActiveCounter');
        if (targetCounter) {
            let activeNum = parseInt(targetCounter.textContent);
            targetCounter.textContent = Math.max(15, activeNum + drift);
        }
    }, 3000);
}

function renderProjectPageContent() {
    const elapsedDays = Math.ceil(Math.abs(new Date() - projectStartDate) / (1000 * 60 * 60 * 24));
    const currentActiveTesters = Math.floor(baseDynamicTesters * 0.45) + Math.floor(Math.random() * 10);
    
    // Check Local Storage Deployment Status
    const contractStorageKey = `contract_deployed_${activeManager.name.replace(/\s+/g, '_')}`;
    const historicalDeploymentState = localStorage.getItem(contractStorageKey) === 'true';

    projectPageContent.innerHTML = `
        <h1 style="font-size: 2.2rem; margin-bottom: 0.3rem;">Corporate Track Records</h1>
        <p style="color: var(--muted-text); margin-bottom: 2rem;">Confidential Portfolio: <strong>${activeManager.name}</strong></p>
        
        <div class="project-section-title">Active Assignment</div>
        <div class="project-card active-project" id="activeProjectCard" style="cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h3>Project Zuri Options <span class="badge-active">In Progress</span></h3>
                <span class="expand-indicator" id="expandIcon">▼</span>
            </div>
            <p style="color: var(--muted-text); font-size: 0.95rem; margin: 0.5rem 0 1.2rem 0;">
                Click here to reveal deeper contract specs.
            </p>
            <div class="project-grid">
                <div class="profile-stat-row" style="border: none; background: var(--bg-color); padding: 0.5rem; border-left: 3px solid var(--text-color);">
                    <div style="display:flex; flex-direction:column;">
                        <span class="profile-stat-label" style="font-size:0.8rem;">TOTAL RECRUITED</span>
                        <span class="profile-stat-value" style="font-size: 1.3rem;">${baseDynamicTesters}</span>
                    </div>
                </div>
                <div class="profile-stat-row" style="border: none; background: var(--bg-color); padding: 0.5rem; border-left: 3px solid var(--accent-green);">
                    <div style="display:flex; flex-direction:column;">
                        <span class="profile-stat-label" style="font-size:0.8rem; color: var(--accent-green); font-weight: 700;">TESTERS ONLINE</span>
                        <span class="profile-stat-value" style="font-size: 1.3rem; color: var(--accent-green);" id="liveActiveCounter">${currentActiveTesters}</span>
                    </div>
                </div>
                <div class="profile-stat-row" style="border: none; background: var(--bg-color); padding: 0.5rem; border-left: 3px solid var(--text-color);">
                    <div style="display:flex; flex-direction:column;">
                        <span class="profile-stat-label" style="font-size:0.8rem;">ELAPSED DURATION</span>
                        <span class="profile-stat-value" style="font-size: 1.3rem;">Day ${elapsedDays} of 90+</span>
                    </div>
                </div>
            </div>

            <div class="expandable-details" id="zuriAccordion">
                <div class="detail-header">User Tasks & Responsibilities</div>
                <div class="detail-body">Execute parameter validation loops inside live asset classes and track pipeline latency across network sync layouts.</div>
                
                <div class="detail-header">Tester Credentials Section</div>
                <div class="credentials-box">
                    <strong>Tester ID:</strong> Tester number 37<br>
                    <strong>Authorization Key:</strong> 5qc2850q0hftxlvxZuriTester
                </div>
                
                <button class="cta-btn" id="startContractBtn">Start Contract</button>
            </div>
        </div>

        <div class="project-section-title">Recent Projects</div>
        <div class="project-card">
            <h3>Project Quantum-Core Inc</h3>
            <p style="color: var(--muted-text); font-size: 0.9rem; margin-top: 0.3rem;">Baseline validation systems</p>
        </div>
    `;

    // Internal Component Structural Mechanics Execution
    const cardElement = document.getElementById('activeProjectCard');
    const accordionElement = document.getElementById('zuriAccordion');
    const ctaButton = document.getElementById('startContractBtn');
    const expandIcon = document.getElementById('expandIcon');

    // Reapply Persistent Local Storage State on Template Drawing
    if(historicalDeploymentState) {
        ctaButton.textContent = "✓ Contract Initialized (Active Node)";
        ctaButton.style.backgroundColor = "var(--accent-green)";
        ctaButton.style.color = "#ffffff";
    }

    cardElement.addEventListener('click', (e) => {
        if (e.target === ctaButton || ctaButton.contains(e.target)) return;
        const expanded = accordionElement.style.display === "block";
        accordionElement.style.display = expanded ? "none" : "block";
        expandIcon.textContent = expanded ? "▼" : "▲";
    });

    ctaButton.addEventListener('click', (e) => {
        e.stopPropagation();
        // Persist Action Sequence
        localStorage.setItem(contractStorageKey, 'true');
        ctaButton.textContent = "✓ Contract Initialized (Active Node)";
        ctaButton.style.backgroundColor = "var(--accent-green)";
        ctaButton.style.color = "#ffffff";
        
        setTimeout(() => {
            window.location.href = "https://zuri-options.pages.dev";
        }, 300);
    });
}

backToDashboardBtn.addEventListener('click', () => {
    if(dynamicInterval) clearInterval(dynamicInterval);
    projectPageView.style.display = "none";
    dashboardView.style.display = "block";
});

// Seed Initial Board UI Frame drawing sequence
renderList();
