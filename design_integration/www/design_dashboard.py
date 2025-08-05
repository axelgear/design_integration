import frappe
from frappe import _

def get_context(context):
	csrf_token = frappe.sessions.get_csrf_token()
	frappe.db.commit()  # nosempgrep
	context = frappe._dict()
	context.csrf_token = csrf_token
	
	# Add design statistics to context
	context.design_stats = get_design_statistics()
	context.recent_items = get_recent_design_items()
	
	return context

def get_design_statistics():
	"""Get design statistics for the dashboard"""
	try:
		stats = {
			'total_requests': frappe.db.count('Design Request'),
			'open_requests': frappe.db.count('Design Request', filters={'status': 'Open'}),
			'closed_requests': frappe.db.count('Design Request', filters={'status': 'Closed'}),
			'total_items': frappe.db.count('Design Request Item'),
			'pending_items': frappe.db.count('Design Request Item', filters={'design_status': 'Pending'}),
			'completed_items': frappe.db.count('Design Request Item', filters={'design_status': 'Completed'})
		}
		return stats
	except:
		return {}

def get_recent_design_items():
	"""Get recent design items for the dashboard"""
	try:
		items = frappe.get_all('Design Request Item', 
			fields=['name', 'item_code', 'item_name', 'design_status', 'approval_status', 'assigned_to', 'creation'],
			filters={},
			order_by='creation desc',
			limit=10
		)
		return items
	except:
		return [] 