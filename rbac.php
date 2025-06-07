<?php
// rbac.php - Role-Based Access Control System

class RBACManager {
    private $permissions = [
        'Admin' => [
            'dashboard' => ['view', 'edit', 'delete'],
            'map' => ['view', 'add_point', 'edit_point', 'delete_point', 'export'],
            'users' => ['view', 'create', 'edit', 'delete'],
            'maintenance' => ['view', 'create', 'assign', 'update', 'delete'],
            'inspections' => ['view', 'create', 'assign', 'update', 'delete'],
            'flood_reports' => ['view', 'create', 'update', 'delete'],
            'settings' => ['view', 'edit'],
            'reports' => ['view', 'create', 'export'],
            'analytics' => ['view', 'export']
        ],
        'Inspector' => [
            'dashboard' => ['view'],
            'map' => ['view', 'add_point'], // Limited map access
            'inspections' => ['view', 'create', 'update'], // Only their own
            'flood_reports' => ['view', 'create'],
            'reports' => ['view', 'create'], // Only inspection reports
            'maintenance' => ['view'] // Read-only for coordination
        ],
        'Operator' => [
            'dashboard' => ['view'],
            'map' => ['view'], // Read-only map access
            'maintenance' => ['view', 'update'], // Only assigned tasks
            'flood_reports' => ['view', 'create'],
            'reports' => ['view'] // Read-only reports
        ],
        'Viewer' => [
            'dashboard' => ['view'],
            'map' => ['view'], // Read-only map access
            'flood_reports' => ['view', 'create'], // Can report floods
            'reports' => ['view'] // Read-only reports
        ]
    ];

    private $roleHierarchy = [
        'Admin' => 4,
        'Inspector' => 3,
        'Operator' => 2,
        'Viewer' => 1
    ];

    private $restrictedFeatures = [
        'Inspector' => [
            'no_user_management',
            'no_system_settings',
            'limited_export',
            'own_inspections_only'
        ],
        'Operator' => [
            'no_user_management',
            'no_system_settings',
            'no_point_editing',
            'assigned_tasks_only',
            'no_export'
        ],
        'Viewer' => [
            'read_only_mode',
            'no_editing',
            'no_export',
            'flood_report_only'
        ]
    ];

    public function hasPermission($userRole, $resource, $action) {
        if (!isset($this->permissions[$userRole])) {
            return false;
        }

        if (!isset($this->permissions[$userRole][$resource])) {
            return false;
        }

        return in_array($action, $this->permissions[$userRole][$resource]);
    }

    public function getRoleLevel($role) {
        return $this->roleHierarchy[$role] ?? 0;
    }

    public function canAccessHigherRole($currentRole, $targetRole) {
        return $this->getRoleLevel($currentRole) > $this->getRoleLevel($targetRole);
    }

    public function getRestrictedFeatures($role) {
        return $this->restrictedFeatures[$role] ?? [];
    }

    public function filterMenuItems($role) {
        $menuItems = [
            'dashboard' => [
                'admin' => 'admin.html',
                'inspector' => 'inspector-dashboard.html',
                'operator' => 'operator-dashboard.html',
                'viewer' => 'viewer-dashboard.html'
            ],
            'map' => [
                'admin' => 'map.html',
                'inspector' => 'inspector-map.html',
                'operator' => 'operator-map.html',
                'viewer' => 'viewer-map.html'
            ]
        ];

        switch ($role) {
            case 'Admin':
                return [
                    'Dashboard' => 'admin.html',
                    'Interactive Map' => 'map.html',
                    'Flood Reports' => 'flood-report.html',
                    'Management' => 'maintanance-inspection.html',
                    'User Management' => 'user.html'
                ];

            case 'Inspector':
                return [
                    'Dashboard' => 'inspector-dashboard.html',
                    'Inspection Map' => 'inspector-map.html',
                    'My Schedules' => 'inspector-schedules.html',
                    'Reports' => 'inspector-reports.html',
                    'Flood Reports' => 'flood-report.html'
                ];

            case 'Operator':
                return [
                    'Dashboard' => 'operator-dashboard.html',
                    'Drainage Map' => 'operator-map.html',
                    'My Tasks' => 'operator-maintenance.html',
                    'Flood Reports' => 'flood-report.html'
                ];

            case 'Viewer':
                return [
                    'Dashboard' => 'viewer-dashboard.html',
                    'View Map' => 'viewer-map.html',
                    'Flood Reports' => 'flood-report.html'
                ];

            default:
                return [];
        }
    }

    public function getMapRestrictions($role) {
        switch ($role) {
            case 'Admin':
                return [
                    'can_add_points' => true,
                    'can_edit_points' => true,
                    'can_delete_points' => true,
                    'can_export' => true,
                    'can_manage_layers' => true,
                    'can_view_all_data' => true
                ];

            case 'Inspector':
                return [
                    'can_add_points' => true, // Limited to inspection-related points
                    'can_edit_points' => false,
                    'can_delete_points' => false,
                    'can_export' => false,
                    'can_manage_layers' => false,
                    'can_view_all_data' => true,
                    'add_inspection_points_only' => true
                ];

            case 'Operator':
                return [
                    'can_add_points' => false,
                    'can_edit_points' => false,
                    'can_delete_points' => false,
                    'can_export' => false,
                    'can_manage_layers' => false,
                    'can_view_all_data' => true,
                    'highlight_assigned_tasks' => true
                ];

            case 'Viewer':
                return [
                    'can_add_points' => false,
                    'can_edit_points' => false,
                    'can_delete_points' => false,
                    'can_export' => false,
                    'can_manage_layers' => false,
                    'can_view_all_data' => true,
                    'read_only_mode' => true
                ];

            default:
                return [
                    'can_add_points' => false,
                    'can_edit_points' => false,
                    'can_delete_points' => false,
                    'can_export' => false,
                    'can_manage_layers' => false,
                    'can_view_all_data' => false
                ];
        }
    }

    public function filterDataByRole($data, $role, $userId = null) {
        switch ($role) {
            case 'Admin':
                return $data; // Full access

            case 'Inspector':
                // Inspectors see all data but have limited editing
                return $data;

            case 'Operator':
                // Operators see all data but focus on their assigned tasks
                if (isset($data['maintenance_requests'])) {
                    $data['maintenance_requests'] = array_filter(
                        $data['maintenance_requests'],
                        function($request) use ($userId) {
                            return $request['assigned_to'] == $userId || !$request['assigned_to'];
                        }
                    );
                }
                return $data;

            case 'Viewer':
                // Viewers see basic information only
                if (isset($data['users'])) unset($data['users']);
                if (isset($data['maintenance_requests'])) {
                    foreach ($data['maintenance_requests'] as &$request) {
                        unset($request['estimated_cost']);
                        unset($request['assigned_to']);
                    }
                }
                return $data;

            default:
                return [];
        }
    }

    public function validateUserAction($userRole, $userId, $action, $targetData = null) {
        $restrictions = $this->getRestrictedFeatures($userRole);

        // Check if action is completely forbidden
        if (in_array('read_only_mode', $restrictions) && 
            !in_array($action, ['view', 'create_flood_report'])) {
            return ['allowed' => false, 'reason' => 'Read-only access'];
        }

        // Role-specific validations
        switch ($userRole) {
            case 'Inspector':
                if ($action === 'edit_inspection' && 
                    isset($targetData['inspector_id']) && 
                    $targetData['inspector_id'] != $userId) {
                    return ['allowed' => false, 'reason' => 'Can only edit own inspections'];
                }
                break;

            case 'Operator':
                if ($action === 'update_maintenance' && 
                    isset($targetData['assigned_to']) && 
                    $targetData['assigned_to'] != $userId) {
                    return ['allowed' => false, 'reason' => 'Can only update assigned tasks'];
                }
                break;

            case 'Viewer':
                if (!in_array($action, ['view', 'create_flood_report'])) {
                    return ['allowed' => false, 'reason' => 'Limited to viewing and flood reporting'];
                }
                break;
        }

        return ['allowed' => true];
    }

    public function getUIRestrictions($role) {
        switch ($role) {
            case 'Admin':
                return [
                    'hide_elements' => [],
                    'disable_elements' => [],
                    'readonly_elements' => []
                ];

            case 'Inspector':
                return [
                    'hide_elements' => [
                        '#user-management-btn',
                        '#system-settings-btn',
                        '.admin-only',
                        '#delete-point-btn'
                    ],
                    'disable_elements' => [
                        '#export-btn'
                    ],
                    'readonly_elements' => [
                        '#point-id' // Cannot change existing point IDs
                    ],
                    'limit_features' => [
                        'add_point_inspection_only'
                    ]
                ];

            case 'Operator':
                return [
                    'hide_elements' => [
                        '#user-management-btn',
                        '#system-settings-btn',
                        '#add-point-btn',
                        '#edit-point-btn',
                        '#delete-point-btn',
                        '.admin-only',
                        '.inspector-only'
                    ],
                    'disable_elements' => [
                        '#export-btn'
                    ],
                    'readonly_elements' => [
                        '.point-details',
                        '#maintenance-type',
                        '#maintenance-priority'
                    ],
                    'show_only_assigned' => true
                ];

            case 'Viewer':
                return [
                    'hide_elements' => [
                        '#user-management-btn',
                        '#system-settings-btn',
                        '#add-point-btn',
                        '#edit-point-btn',
                        '#delete-point-btn',
                        '#export-btn',
                        '.admin-only',
                        '.inspector-only',
                        '.operator-only',
                        '#maintenance-section',
                        '#inspection-section'
                    ],
                    'disable_elements' => [
                        'input:not([readonly])',
                        'select',
                        'button:not(.flood-report-btn)'
                    ],
                    'readonly_elements' => [
                        'input',
                        'textarea'
                    ],
                    'readonly_mode' => true
                ];

            default:
                return [
                    'hide_elements' => ['*'],
                    'disable_elements' => ['*'],
                    'readonly_elements' => ['*']
                ];
        }
    }
}

// Usage example in your PHP files:
function checkUserAccess($userRole, $requiredPermission, $resource) {
    $rbac = new RBACManager();
    
    if (!$rbac->hasPermission($userRole, $resource, $requiredPermission)) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'message' => 'Access denied. Insufficient permissions.'
        ]);
        exit;
    }
}

// Middleware function for API endpoints
function requirePermission($resource, $action) {
    session_start();
    
    if (!isset($_SESSION['user_role'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit;
    }
    
    $rbac = new RBACManager();
    if (!$rbac->hasPermission($_SESSION['user_role'], $resource, $action)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit;
    }
}

// JavaScript snippet to include in your frontend files for UI restrictions
function generateRBACJavaScript($userRole) {
    $rbac = new RBACManager();
    $restrictions = $rbac->getUIRestrictions($userRole);
    $mapRestrictions = $rbac->getMapRestrictions($userRole);
    
    return "
    <script>
    window.userRole = '{$userRole}';
    window.rbacRestrictions = " . json_encode($restrictions) . ";
    window.mapRestrictions = " . json_encode($mapRestrictions) . ";
    
    document.addEventListener('DOMContentLoaded', function() {
        applyRoleBasedRestrictions();
    });
    
    function applyRoleBasedRestrictions() {
        const restrictions = window.rbacRestrictions;
        
        // Hide elements
        restrictions.hide_elements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.style.display = 'none');
        });
        
        // Disable elements
        restrictions.disable_elements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => el.disabled = true);
        });
        
        // Make elements readonly
        restrictions.readonly_elements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.readOnly = true;
                } else if (el.tagName === 'SELECT') {
                    el.disabled = true;
                }
            });
        });
        
        // Apply role-specific styling
        document.body.classList.add('role-' + window.userRole.toLowerCase());
        
        // Show role indicator
        if (window.userRole !== 'Admin') {
            showRoleRestrictionNotice();
        }
    }
    
    function showRoleRestrictionNotice() {
        const notice = document.createElement('div');
        notice.className = 'alert alert-info role-notice';
        notice.style.cssText = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 10000; max-width: 500px;';
        notice.innerHTML = `
            <i class='fas fa-info-circle me-2'></i>
            You are logged in as <strong>{$userRole}</strong> with limited access permissions.
            <button type='button' class='btn-close' onclick='this.parentElement.remove()'></button>
        `;
        document.body.appendChild(notice);
        
        setTimeout(() => {
            if (notice.parentNode) notice.remove();
        }, 8000);
    }
    </script>
    ";
}
?>