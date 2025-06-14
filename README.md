# DrainTrack
## Centralized Drainage Information Management System for Muar District
## Overview
DrainTrack is a comprehensive web-based system for managing drainage infrastructure in Muar District, Johor, Malaysia. The platform enables efficient tracking, maintenance, and inspection of drainage assets while providing tools for flood reporting and infrastructure management.

## Key Features
### For Public Users
- Interactive map showing drainage infrastructure locations
- Flood reporting system with photo upload capability
- Mobile-responsive design for access on any device
### For Administrators
- Complete user management with role-based access control
- Dashboard with analytics and performance metrics
- Comprehensive drainage asset management
### For Operators
- Maintenance task management
- Completion reporting with photo documentation
- Task notifications and updates
- Inspection scheduling and task management
- Field reporting with photo documentation
- Inspection history and analytics
## Technology Stack
- Frontend : HTML5, CSS3, JavaScript, Bootstrap 5.3
- Maps : Leaflet.js with multiple layer support
- Backend : PHP 7.4+
- Database : MySQL
- Authentication : Session-based with role-based access control
## Installation
### Requirements
- Web server (Apache recommended)
- PHP 7.4 or higher
- MySQL 5.7 or higher
- XAMPP/WAMP/LAMP stack (for local development)
### Setup Instructions
1. Clone the repository to your web server directory
2. Create a MySQL database named 'DrainageInventory'
3. Import the database schema:
4. Configure database connection in db.php :
5. Ensure proper permissions for upload directories:
6. Access the application:
## User Access
- Public Map : /public/public-map.html
- Login Page : /login.html
- Admin Interface : /admin/admin.html
- Operator Interface : /operator/operator.html

## User Roles
Role Access Level Responsibilities Admin Full system access User management, system configuration, reporting Inspector Limited access Conduct inspections, create reports Operator Task-specific access Execute maintenance tasks, update completion status Viewer Read-only access View maps and reports, submit flood reports

## API Endpoints
The system provides a RESTful API for data operations:

- /api/drainage-points.php - Drainage point CRUD operations
- /api/drainage-lines.php - Drainage line CRUD operations
- /api/flood-reports.php - Flood report management
- /api/maintenance-requests.php - Maintenance request handling
- /api/inspection-schedules.php - Inspection scheduling
- /api/task-completion-report.php - Completion report management
- /api/upload-image.php - Image upload handling

## Development
### Project Structure
- /admin - Administrative interfaces
- /api - Backend API endpoints
- /css - Stylesheets
- /data - GeoJSON data files
- /images - Static images
- /js - JavaScript files
- /operator - Operator interfaces
- /public - Public-facing pages
- /uploads - User-uploaded files

### Contributing
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description

## Support
For technical support, please contact the system administrator.


Developed for the Muar District Council, Johor, Malaysia
