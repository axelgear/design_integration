frappe.ui.form.on("Design Request Item", {
    refresh(frm) {
        

        if (!frm.doc.__islocal) {

            frm.add_custom_button(__("+ Add New Version"), () => {

                frappe.call({
                    method:"design_integration.design_integration.doctype.design_request_item.design_request_item.get_version_meta_data",
                    callback:(r)=>{
                        if(!r.message) return;

                        // Build dialog fields except design_request_item
                        const fields = r.message.fields
                            .filter(df => df.fieldname !== "design_request_item")
                            .map(df => {
                                return {
                                    ...df,
                                    read_only: 0
                                }
                            });

                        let d = new frappe.ui.Dialog({
                            title: "Add Design Version",
                            fields: fields,
                            primary_action_label: "Create",

                            primary_action(values) {

                                // Force-set link without showing in dialog
                                values.design_request_item = frm.doc.name;

                                frappe.call({
                                    method: "frappe.client.insert",
                                    args: {
                                        doc: {
                                            doctype: "Design Version",
                                            ...values
                                        }
                                    },
                                    callback(r) {
                                        if (!r.exc) {
                                            frappe.msgprint("Design Version Created");
                                            d.hide();
                                            frm.refresh()
                                        }
                                    }
                                });
                            }
                        });

                        d.show();
                    }
                })
            });

        }
        render_all_versions(frm)

    },
    
    design_status: function(frm) {
        // Update current stage when design status changes
        frm.set_value("current_stage", frm.doc.design_status);
    },
    
    approval_status: function(frm) {
        // Handle approval status changes
        if (frm.doc.approval_status === "Approved") {
            // Show confirmation dialog
            frappe.confirm(
                __("Are you sure you want to approve this item? This will automatically change the Design Status to 'Design'."),
                function() {
                    // User confirmed
                    frm.set_value("design_status", "Design");
                    frm.set_value("approval_date", frappe.datetime.now_datetime());
                    frappe.msgprint({
                        message: __("Item approved successfully. Design Status changed to 'Design'."),
                        indicator: "green"
                    });
                },
                function() {
                    // User cancelled
                    frm.set_value("approval_status", frm.doc.approval_status);
                }
            );
        } else if (frm.doc.approval_status === "Rejected") {
            // Show confirmation dialog
            frappe.confirm(
                __("Are you sure you want to reject this item? This will automatically change the Design Status to 'On Hold'."),
                function() {
                    // User confirmed
                    frm.set_value("design_status", "On Hold");
                    frappe.msgprint({
                        message: __("Item rejected. Design Status changed to 'On Hold'."),
                        indicator: "orange"
                    });
                },
                function() {
                    // User cancelled
                    frm.set_value("approval_status", frm.doc.approval_status);
                }
            );
        } else if (frm.doc.approval_status === "On Hold") {
            // Show confirmation dialog
            frappe.confirm(
                __("Are you sure you want to put this item on hold? This will automatically change the Design Status to 'On Hold'."),
                function() {
                    // User confirmed
                    frm.set_value("design_status", "On Hold");
                    frappe.msgprint({
                        message: __("Item put on hold. Design Status changed to 'On Hold'."),
                        indicator: "orange"
                    });
                },
                function() {
                    // User cancelled
                    frm.set_value("approval_status", frm.doc.approval_status);
                }
            );
        }
    }
});


function render_all_versions(frm){
    if (frm.is_new()) return;

    // fetch linked design versions
    frappe.call({
        method: "design_integration.design_integration.doctype.design_request_item.design_request_item.get_version_list",
        args: {
            design_request_item: frm.doc.name
        },
        callback: function(r) {
            console.log(r)
            if (!r.message || r.message.length === 0) {
                frm.fields_dict.version_view.$wrapper.html(`
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="fa fa-layer-group"></i>
                        </div>
                        <h4>No Versions Found</h4>
                        <p class="text-muted">No design versions have been uploaded yet.</p>
                    </div>
                `);
                return;
            }

            let html = `
                <div class="versions-container">
                    <div class="versions-header">
                        <h4><i class="fa fa-history"></i> Design Versions</h4>
                        <span class="badge">${r.message.length} version${r.message.length > 1 ? 's' : ''}</span>
                    </div>
                    <div class="versions-timeline">
            `;

            r.message.forEach((row, index) => {
                let file_html = "";
                let file_preview = "";
                let file_badge = "";

                if (row.new_version_file) {
                    let ext = row.new_version_file.split('.').pop().toLowerCase();
                    let fileName = row.new_version_file.split('/').pop();
                    
                    // Determine file type and icon
                    if (["png","jpg","jpeg","webp","gif","bmp"].includes(ext)) {
                        file_badge = `<span class="file-badge image-badge"><i class="fa fa-image"></i> Image</span>`;
                        file_preview = `
                            <div class="file-preview">
                                <img src="${row.new_version_file}" class="preview-image" alt="${row.version_tag || 'Design'}">
                                <div class="preview-overlay">
                                    <a href="${row.new_version_file}" target="_blank" class="preview-link">
                                        <i class="fa fa-expand"></i> View Full Size
                                    </a>
                                </div>
                            </div>
                        `;
                    } 
                    else if (ext === "pdf") {
                        file_badge = `<span class="file-badge pdf-badge"><i class="fa fa-file-pdf"></i> PDF</span>`;
                        file_preview = `
                            <div class="file-preview">
                                <div class="pdf-placeholder">
                                    <i class="fa fa-file-pdf pdf-icon"></i>
                                    <p>${fileName}</p>
                                    <a href="${row.new_version_file}" target="_blank" class="btn-view-pdf">
                                        <i class="fa fa-eye"></i> View PDF
                                    </a>
                                </div>
                            </div>
                        `;
                    }
                    else if (["doc","docx","odt"].includes(ext)) {
                        file_badge = `<span class="file-badge doc-badge"><i class="fa fa-file-word"></i> Document</span>`;
                    }
                    else if (["ai","psd","eps","svg"].includes(ext)) {
                        file_badge = `<span class="file-badge design-badge"><i class="fa fa-palette"></i> Design File</span>`;
                    }
                    else {
                        file_badge = `<span class="file-badge"><i class="fa fa-file"></i> ${ext.toUpperCase()}</span>`;
                    }
                }

                // Format date
                let formattedDate = row.posting_date ? frappe.format(row.posting_date, { fieldtype: 'Date' }) : 'Not set';
                
                // Determine version status color
                const statusColors = ['primary', 'success', 'warning', 'info'];
                const colorIndex = index % statusColors.length;
                
                html += `
                    <div class="version-card" data-version-name="${row.name}">
                        <div class="version-header">
                            <div class="version-marker" style="background-color: var(--${statusColors[colorIndex]})">
                                <span class="version-number">V${index + 1}</span>
                            </div>
                            <div class="version-info">
                                <h5>
                                    ${row.version_tag || `Version ${index + 1}`}
                                    ${file_badge}
                                </h5>
                                <div class="version-meta">
                                    <span class="meta-item">
                                        <i class="fa fa-calendar"></i> ${formattedDate}
                                    </span>
                                    ${row.created_by ? `<span class="meta-item"><i class="fa fa-user"></i> ${row.created_by}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        ${row.description ? `
                            <div class="version-description">
                                <i class="fa fa-align-left"></i>
                                <p>${row.description}</p>
                            </div>
                        ` : ''}
                        
                        ${file_preview ? `
                            <div class="version-preview">
                                ${file_preview}
                            </div>
                        ` : ''}
                        
                        <div class="version-actions">
                            <div class="action-buttons">
                                ${row.new_version_file ? `
                                    <a href="${row.new_version_file}" target="_blank" class="btn btn-sm btn-primary">
                                        <i class="fa fa-external-link"></i> Open
                                    </a>
                                    <a href="${row.new_version_file}" target="_blank" class="btn btn-sm btn-default" download>
                                        <i class="fa fa-download"></i> Download
                                    </a>
                                ` : ''}
                                <button class="btn btn-sm btn-danger btn-delete-version" data-version-name="${row.name}">
                                    <i class="fa fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;

            frm.fields_dict.version_view.$wrapper.html(html);
            
            // Add event listeners for delete buttons
            addDeleteListeners(frm);
        }
    });
}

function addDeleteListeners(frm) {
    // Remove any existing listeners first
    $('.btn-delete-version').off('click');
    
    // Add click event for delete buttons
    $('.btn-delete-version').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const versionName = $(this).data('version-name');
        const versionCard = $(this).closest('.version-card');
        const versionTitle = versionCard.find('h5').text().trim().split('\n')[0];
        
        // Show confirmation dialog
        frappe.confirm(
            `Are you sure you want to delete "${versionTitle}"?<br><br>
            <small class="text-muted">This action cannot be undone.</small>`,
            () => {
                // User confirmed - delete the version
                deleteVersion(frm, versionName, versionCard);
            },
            () => {
                // User cancelled
                console.log('Delete cancelled');
            }
        );
    });
}

function deleteVersion(frm, versionName, versionCard) {
    // Show loading state
    versionCard.addClass('deleting');
    versionCard.find('.btn-delete-version').html('<i class="fa fa-spinner fa-spin"></i> Deleting...').prop('disabled', true);
    
    frappe.call({
        method: "design_integration.design_integration.doctype.design_request_item.design_request_item.delete_version",
        args: {
            version_name: versionName,
            design_request_item: frm.doc.name
        },
        callback: function(r) {
            if (r.exc) {
                // Show error message
                frappe.show_alert({
                    message: __('Error deleting version. Please try again.'),
                    indicator: 'red'
                });
                versionCard.removeClass('deleting');
                versionCard.find('.btn-delete-version').html('<i class="fa fa-trash"></i> Delete').prop('disabled', false);
                return;
            }
            
            // Show success message
            frappe.show_alert({
                message: __('Version deleted successfully'),
                indicator: 'green'
            });
            
            // Add fade out animation
            versionCard.addClass('fade-out');
            
            // Remove card after animation
            setTimeout(() => {
                // Refresh the versions list
                render_all_versions(frm);
                
                // Refresh the form to update any related data
                frm.refresh();
            }, 300);
        }
    });
}