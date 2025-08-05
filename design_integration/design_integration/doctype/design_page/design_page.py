import frappe
from frappe import _

def get_context(context):
	context.no_cache = 1
	context.show_sidebar = True
	
	# Get design statistics
	context.design_stats = get_design_statistics()
	context.recent_items = get_recent_design_items()
	context.chart_data = get_chart_data()
	
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

def get_chart_data():
	"""Get chart data for the dashboard"""
	try:
		# Design status distribution
		status_data = frappe.db.sql("""
			SELECT design_status, COUNT(*) as count
			FROM `tabDesign Request Item`
			GROUP BY design_status
		""", as_dict=1)
		
		# Approval status distribution
		approval_data = frappe.db.sql("""
			SELECT approval_status, COUNT(*) as count
			FROM `tabDesign Request Item`
			GROUP BY approval_status
		""", as_dict=1)
		
		return {
			'status_data': status_data,
			'approval_data': approval_data
		}
	except:
		return {}

@frappe.whitelist()
def get_dashboard_data():
	"""Get dashboard data for JavaScript"""
	try:
		return {
			'stats': get_design_statistics(),
			'recent_items': get_recent_design_items(),
			'chart_data': get_chart_data()
		}
	except Exception as e:
		frappe.log_error(f"Error getting dashboard data: {str(e)}")
		return {} 