from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            getattr(request.user, 'role', '') == 'admin' or
            getattr(request.user, 'is_staff', False) or
            getattr(request.user, 'is_superuser', False)
        ))

class BookPermission(BasePermission):
    """
    Role-Based Access Control for Book Management:
    - Unauthenticated: Returns False (DRF returns 401 Unauthorized)
    - Viewer: Read-only (GET, HEAD, OPTIONS)
    - Editor: Read, Create, Update (GET, POST, PUT, PATCH)
    - Admin: Full access including DELETE (GET, POST, PUT, PATCH, DELETE)
    - Manager: Read, Create, Update
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        role = getattr(request.user, 'role', 'viewer')

        # Read actions allowed for viewer, editor, admin, manager
        if request.method in SAFE_METHODS:
            return role in ['viewer', 'editor', 'admin', 'manager']

        # DELETE is strictly restricted to admin role
        if request.method == 'DELETE':
            return role == 'admin'

        # Write actions (POST, PUT, PATCH) allowed for editor, admin, manager
        if request.method in ['POST', 'PUT', 'PATCH']:
            return role in ['editor', 'admin', 'manager']

        return False
