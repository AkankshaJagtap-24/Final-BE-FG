const API_URL = 'http://localhost:5001/api';
let authToken = localStorage.getItem('adminToken');

// Check if already logged in
if (authToken) {
    showDashboard();
}

// Login Form Handler
// Update the login fetch call
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            localStorage.setItem('adminToken', data.token);
            authToken = data.token;
            showDashboard();
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
    }
});

function showDashboard() {
    document.getElementById('loginContainer').classList.add('d-none');
    document.getElementById('dashboardContainer').classList.remove('d-none');
    loadAllData();
}

async function loadAllData() {
    try {
        // Load initial tab data
        const activeTab = document.querySelector('.nav-link.active').getAttribute('href').substring(1);
        await loadTabData(activeTab);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Add these functions for alert management and charts

let alertsChart = null;
let severityChart = null;

async function loadAlerts() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard-alerts`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        updateAlertCharts(data);
        
        const html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Severity</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Created By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.alerts.map(alert => `
                            <tr>
                                <td>${alert.title}</td>
                                <td>${alert.description}</td>
                                <td><span class="badge bg-${getSeverityColor(alert.severity)}">${alert.severity}</span></td>
                                <td>${alert.location}</td>
                                <td><span class="badge bg-${alert.status === 'active' ? 'success' : 'secondary'}">${alert.status}</span></td>
                                <td>${alert.created_by_name}</td>
                                <td>
                                    <button class="btn btn-sm btn-${alert.status === 'active' ? 'danger' : 'success'}" 
                                            onclick="updateAlertStatus(${alert.id}, '${alert.status === 'active' ? 'inactive' : 'active'}')">
                                        ${alert.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('alertsContent').innerHTML = html;
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

function updateAlertCharts(data) {
    const ctx1 = document.getElementById('alertsChart').getContext('2d');
    const ctx2 = document.getElementById('severityChart').getContext('2d');

    // Destroy existing charts if they exist
    if (alertsChart) alertsChart.destroy();
    if (severityChart) severityChart.destroy();

    // Create status chart
    alertsChart = new Chart(ctx1, {
        type: 'pie',
        data: {
            labels: ['Active', 'Inactive'],
            datasets: [{
                data: [data.statistics.active, data.statistics.inactive],
                backgroundColor: ['#28a745', '#6c757d']
            }]
        }
    });

    // Create severity chart
    const severityCounts = {
        high: data.alerts.filter(a => a.severity === 'high').length,
        medium: data.alerts.filter(a => a.severity === 'medium').length,
        low: data.alerts.filter(a => a.severity === 'low').length
    };

    severityChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['High', 'Medium', 'Low'],
            datasets: [{
                label: 'Alerts by Severity',
                data: [severityCounts.high, severityCounts.medium, severityCounts.low],
                backgroundColor: ['#dc3545', '#ffc107', '#17a2b8']
            }]
        }
    });
}

function getSeverityColor(severity) {
    switch(severity.toLowerCase()) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'secondary';
    }
}

async function createAlert() {
    const form = document.getElementById('createAlertForm');
    const formData = new FormData(form);
    const alertData = Object.fromEntries(formData.entries());
    // var createAlert = {
    //     title: alertData.title,
    //     description: alertData.description,
    //     severity: alertData.severity,
    //     location: alertData.location,
    //     createAlert : ""
    // }; 
    try {
        const response = await fetch(`${API_URL}/alerts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(alertData)
        });

        if (!response.ok) throw new Error('Failed to create alert');

        // Close modal and reload alerts
        bootstrap.Modal.getInstance(document.getElementById('addAlertModal')).hide();
        form.reset();
        await loadAlerts();
    } catch (error) {
        console.error('Error creating alert:', error);
        alert('Failed to create alert: ' + error.message);
    }
}

// Add this function to handle alert status updates
async function updateAlertStatus(alertId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/admin/alerts/${alertId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update status');

        // Reload alerts after successful update
        await loadAlerts();
    } catch (error) {
        console.error('Error updating alert status:', error);
        alert('Failed to update alert status: ' + error.message);
    }
}

// Update the loadTabData function to include alerts
async function loadTabData(tabId) {
    switch(tabId) {
        case 'sos':
            await loadSOSAlerts();
            break;
        case 'forum':
            await loadForumPosts();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'alerts':
            await loadAlerts();
            break;
    }
}

// Update tab switching handler
document.querySelectorAll('.nav-link').forEach(tab => {
    tab.addEventListener('click', async (e) => {
        e.preventDefault();
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        
        const target = e.target.getAttribute('href').substring(1);
        document.getElementById(target).classList.add('active');
        e.target.classList.add('active');

        // Load data for the selected tab
        await loadTabData(target);
    });
});

// Update loadSOSAlerts function
async function loadSOSAlerts() {
    try {
        const response = await fetch(`${API_URL}/admin/sos-alerts`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        const html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>User</th>
                            <th>Location</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.alerts && data.alerts.length ? 
                            data.alerts.map(alert => `
                                <tr>
                                    <td>${alert.id || '-'}</td>
                                    <td>${alert.user_name || '-'}</td>
                                    <td>${alert.location || '-'}</td>
                                    <td>${alert.description || '-'}</td>
                                    <td>${alert.status || '-'}</td>
                                    <td>${alert.created_at ? new Date(alert.created_at).toLocaleString() : '-'}</td>
                                </tr>
                            `).join('') : 
                            '<tr><td colspan="6" class="text-center">No SOS alerts found</td></tr>'
                        }
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('sosContent').innerHTML = html;
    } catch (error) {
        console.error('Error loading SOS alerts:', error);
        document.getElementById('sosContent').innerHTML = `
            <div class="alert alert-danger">
                Failed to load SOS alerts. Error: ${error.message}
            </div>
        `;
    }
}

async function loadForumPosts() {
    try {
        const response = await fetch(`${API_URL}/admin/forum-posts`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        const html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Content</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.posts.map(post => `
                            <tr>
                                <td>${post.id}</td>
                                <td>${post.title}</td>
                                <td>${post.author_name}</td>
                                <td>${post.content}</td>
                                <td>${new Date(post.created_at).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('forumContent').innerHTML = html;
    } catch (error) {
        console.error('Error loading forum posts:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        
        const html = `
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.name}</td>
                                <td>${user.email}</td>
                                <td>${user.phone || '-'}</td>
                                <td>${user.status}</td>
                                <td>${new Date(user.created_at).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        document.getElementById('usersContent').innerHTML = html;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    location.reload();
}