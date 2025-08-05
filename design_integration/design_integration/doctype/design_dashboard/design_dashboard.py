import frappe
from frappe import _

def get_data():
	return [
		{
			"module_name": "Design Integration",
			"color": "#FF6B6B",
			"icon": "design",
			"type": "module",
			"label": _("Design Integration"),
			"route": "#design-integration",
			"description": _("Design management and workflow tracking")
		}
	] 