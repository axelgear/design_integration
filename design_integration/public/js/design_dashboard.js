// Design Dashboard JavaScript
frappe.provide('design_integration');

design_integration.DesignDashboard = class DesignDashboard {
	constructor(wrapper) {
		this.wrapper = wrapper;
		this.page = wrapper.page;
		this.setup();
	}

	setup() {
		this.page.set_title(__('Design Dashboard'));
		this.page.set_primary_action(__('Create Design Request'), () => {
			frappe.new_doc('Design Request');
		});
		
		this.render();
	}

	render() {
		this.wrapper.html(`
			<div class="design-dashboard">
				<div class="dashboard-header">
					<h1 class="page-title">Design Dashboard</h1>
					<p class="text-muted">Monitor and manage design requests and items</p>
				</div>
				
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-number" id="total-requests">-</div>
						<div class="stat-label">Total Requests</div>
					</div>
					<div class="stat-card">
						<div class="stat-number" id="open-requests">-</div>
						<div class="stat-label">Open Requests</div>
					</div>
					<div class="stat-card">
						<div class="stat-number" id="total-items">-</div>
						<div class="stat-label">Total Items</div>
					</div>
					<div class="stat-card">
						<div class="stat-number" id="pending-items">-</div>
						<div class="stat-label">Pending Items</div>
					</div>
				</div>
				
				<div class="dashboard-content">
					<div class="recent-items-section">
						<h3>Recent Design Items</h3>
						<div id="recent-items-list"></div>
					</div>
					
					<div class="quick-actions">
						<h3>Quick Actions</h3>
						<div class="action-buttons">
							<button class="btn btn-primary" onclick="frappe.new_doc('Design Request')">
								Create Design Request
							</button>
							<button class="btn btn-secondary" onclick="frappe.set_route('List', 'Design Request Item')">
								View All Items
							</button>
							<button class="btn btn-secondary" onclick="frappe.set_route('List', 'Design Request')">
								View All Requests
							</button>
						</div>
					</div>
				</div>
			</div>
		`);
		
		this.load_data();
	}

	load_data() {
		frappe.call({
			method: 'design_integration.design_integration.doctype.design_page.design_page.get_dashboard_data',
			callback: (r) => {
				if (r.message) {
					this.update_stats(r.message.stats);
					this.update_recent_items(r.message.recent_items);
				}
			}
		});
	}

	update_stats(stats) {
		if (stats) {
			$('#total-requests').text(stats.total_requests || 0);
			$('#open-requests').text(stats.open_requests || 0);
			$('#total-items').text(stats.total_items || 0);
			$('#pending-items').text(stats.pending_items || 0);
		}
	}

	update_recent_items(items) {
		const container = $('#recent-items-list');
		if (items && items.length > 0) {
			const html = items.map(item => `
				<div class="item-card">
					<div class="item-header">
						<span class="item-code">${item.item_code || 'N/A'}</span>
						<span class="status-badge status-${item.design_status?.toLowerCase().replace(' ', '-')}">
							${item.design_status || 'Pending'}
						</span>
					</div>
					<div class="item-name">${item.item_name || 'N/A'}</div>
					<div class="item-meta">
						<span class="assigned-to">${item.assigned_to || 'Unassigned'}</span>
						<span class="creation-date">${frappe.datetime.str_to_user(item.creation)}</span>
					</div>
				</div>
			`).join('');
			container.html(html);
		} else {
			container.html('<p class="text-muted">No recent items found</p>');
		}
	}
};

// Initialize dashboard
frappe.pages['design-dashboard'] = design_integration.DesignDashboard; 