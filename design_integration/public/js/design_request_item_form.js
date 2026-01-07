// Design Request Item Form Customization
frappe.ui.form.on('Design Request Item', {
    refresh: function(frm) {
        createTwoColumnLayout(frm);
        
        // Add custom buttons
        addCustomButtons(frm);

        // Enforce allowed design_status options based on approval_status
        enforceDesignStatusOptions(frm);
    },
    
    design_status: function(frm) {
        // Auto-save when design status changes
        if (frm.doc.design_status) {
            frm.save(null, function() {
                frappe.show_alert({
                    message: __("Status updated and saved automatically"),
                    indicator: "green"
                }, 3);
            });
        }
    },
    
    approval_status: function(frm) {
        // Auto-save when approval status changes
        if (frm.doc.approval_status) {
            frm.save(null, function() {
                frappe.show_alert({
                    message: __("Approval status updated and saved automatically"),
                    indicator: "green"
                }, 3);
            });
        }

        // Refresh allowed options based on new approval_status
        enforceDesignStatusOptions(frm);
    },
    
    new_item_code: function(frm) {
        // Auto-update SKU and Item Created when new item is selected
        if (frm.doc.new_item_code) {
            frm.set_value("sku_generated", 1);
            frm.set_value("item_created", 1);
            
            // Fetch item name from the selected item
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Item',
                    name: frm.doc.new_item_code
                },
                callback: function(r) {
                    if (r.message) {
                        frm.set_value("new_item_name", r.message.item_name);
                        // Auto-save after setting the item name
                        frm.save();
                    }
                }
            });
            
            frappe.msgprint({
                message: __("SKU Generated and Item Created automatically set to Yes."),
                indicator: "green"
            });
        } else {
            // Clear the fields if new_item_code is cleared
            frm.set_value("sku_generated", 0);
            frm.set_value("item_created", 0);
            frm.set_value("new_item_name", "");
        }
    },
    
    bom_name: function(frm) {
        // Auto-update BOM Created when BOM is selected
        if (frm.doc.bom_name) {
            frm.set_value("bom_created", 1);
            frappe.msgprint({
                message: __("BOM Created automatically set to Yes."),
                indicator: "green"
            });
            // Auto-save after setting BOM created
            frm.save();
        } else {
            frm.set_value("bom_created", 0);
        }
    }
});

function createTwoColumnLayout(frm) {
    // Remove existing layout
    frm.page.clear_inner_toolbar();
    
    // Create sections for better organization
    if (!frm.sections) {
        frm.sections = {};
    }
    
    // Ensure all fields are visible by removing any hidden attributes
    frm.fields.forEach(function(field) {
        if (field.df.fieldname === 'new_item_code' || field.df.fieldname === 'new_item_name') {
            field.df.hidden = 0;
            field.df.read_only = field.df.fieldname === 'new_item_name' ? 1 : 0;
        }
    });
}

function addCustomButtons(frm) {
    // Add custom buttons to the form
    frm.add_custom_button(__('Update Status'), function() {
        showStatusDialog(frm);
    }, __('Actions'));
    
    frm.add_custom_button(__('Assign To'), function() {
        showAssignDialog(frm);
    }, __('Actions'));
    
    frm.add_custom_button(__('Add Approval Remarks'), function() {
        showApprovalRemarksDialog(frm);
    }, __('Actions'));

    // Mark Revision button
    frm.add_custom_button(__('Mark Revision'), function() {
        showRevisionDialog(frm);
    }, __('Actions'));
}

function showStatusDialog(frm) {
    frappe.prompt({
        label: __('Design Status'),
        fieldtype: 'Select',
        options: 'Pending\nApproval Drawing\nSend for Approval\nDesign\nModelling\nProduction Drawing\nSKU Generation\nBOM\nNesting\nCompleted\nCancelled',
        default: frm.doc.design_status || 'Pending'
    }, function(values) {
        frm.set_value('design_status', values.design_status);
        frm.save(null, function() {
            frappe.show_alert({
                message: __("Status updated successfully"),
                indicator: "green"
            }, 3);
        });
    }, __('Update Status'), __('Update'));
}

function showAssignDialog(frm) {
    frappe.prompt({
        label: __('Assign To'),
        fieldtype: 'Link',
        options: 'User',
        default: frm.doc.assigned_to || ''
    }, function(values) {
        frm.set_value('assigned_to', values.assigned_to);
        frm.save(null, function() {
            frappe.show_alert({
                message: __("Item assigned successfully"),
                indicator: "green"
            }, 3);
        });
    }, __('Assign'), __('Assign'));
}

function showApprovalRemarksDialog(frm) {
    frappe.prompt({
        label: __('Approval Remarks'),
        fieldtype: 'Text Editor',
        default: frm.doc.approval_remarks || ''
    }, function(values) {
        frm.set_value('approval_remarks', values.approval_remarks);
        frm.save(null, function() {
            frappe.show_alert({
                message: __("Approval remarks added successfully"),
                indicator: "green"
            }, 3);
        });
    }, __('Add Remarks'), __('Save'));
} 

function enforceDesignStatusOptions(frm) {
    // Allowed sets
    const preApproval = ['Pending','Approval Drawing','Send for Approval','Cancelled'];
    const postApproval = ['Design','Modelling','Production Drawing','SKU Generation','BOM','Nesting','Completed','Cancelled'];

    let options = preApproval;
    if (frm.doc.approval_status === 'Approved') {
        options = postApproval;
    } else if (frm.doc.approval_status === 'Rejected') {
        options = preApproval;
    }

    frm.set_df_property('design_status', 'options', options.join('\n'));

    // If current value not in allowed, reset to first allowed
    if (frm.doc.design_status && !options.includes(frm.doc.design_status)) {
        frm.set_value('design_status', options[0]);
    }
}

function showRevisionDialog(frm) {
    if (!['Modelling','Production Drawing','BOM','Nesting','Completed','Design'].includes(frm.doc.design_status)) {
        frappe.msgprint(__('Revision can be marked from Design and later stages.'));
        return;
    }

    const d = new frappe.ui.Dialog({
        title: __('Mark Revision'),
        fields: [
            { fieldtype: 'Small Text', fieldname: 'revision_reason', label: __('Revision Details'), reqd: 1 },
            { fieldtype: 'Small Text', fieldname: 'revision_remark', label: __('Remarks') }
        ],
        primary_action_label: __('Submit'),
        primary_action: function() {
            const values = d.get_values();
            frm.set_value('revision_reason', values.revision_reason || '');
            frm.set_value('approval_status', 'Revised');
            frm.set_value('approval_remarks', values.revision_remark || '');
            frm.set_value('revision_requested', 1);
            frm.save(null, function() {
                frappe.show_alert({ message: __('Revision requested'), indicator: 'orange' }, 3);
                d.hide();
            });
        }
    });
    d.show();
}