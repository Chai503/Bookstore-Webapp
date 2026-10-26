from django.urls import path
from .views import (
    dashboard_view, delete_item_view, edit_item_view,
    register_page, login_page, logout_page,
    LabRegisterView, VerifyEmailView, LabLoginView, LabLogoutView,
    RegisterView, ProfileView, ChangePasswordView, UserListView, UserDetailView,
    BookListCreateView, BookDetailView
)

urlpatterns = [
    path('', dashboard_view, name='dashboard'),
    path('register/', register_page, name='register_page'),
    path('login/', login_page, name='login_page'),
    path('logout/', logout_page, name='logout_page'),
    path('verify/', VerifyEmailView.as_view(), name='verify_page'),
    path('books/delete/<int:pk>/', delete_item_view, name='item_delete'),
    path('books/edit/<int:pk>/', edit_item_view, name='item_edit'),

    # Auth & Profile Endpoints
    path('api/register/', LabRegisterView.as_view(), name='lab_register'),
    path('api/register', LabRegisterView.as_view(), name='lab_register_noslash'),
    path('api/verify/', VerifyEmailView.as_view(), name='lab_verify'),
    path('api/verify', VerifyEmailView.as_view(), name='lab_verify_noslash'),
    path('api/login/', LabLoginView.as_view(), name='lab_login'),
    path('api/login', LabLoginView.as_view(), name='lab_login_noslash'),
    path('api/logout/', LabLogoutView.as_view(), name='lab_logout'),
    path('api/logout', LabLogoutView.as_view(), name='lab_logout_noslash'),
    path('api/profile/', ProfileView.as_view(), name='profile_api'),
    path('api/profile', ProfileView.as_view(), name='profile_api_noslash'),

    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/profile/', ProfileView.as_view(), name='profile'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/users/', UserListView.as_view(), name='user_list_create'),
    path('api/users/<int:id>/', UserDetailView.as_view(), name='user_detail_delete'),

    # Book CRUD Endpoints
    path('api/books/', BookListCreateView.as_view(), name='book_list_create'),
    path('api/books', BookListCreateView.as_view(), name='book_list_create_noslash'),
    path('api/books/<int:pk>/', BookDetailView.as_view(), name='book_detail'),
    path('api/books/<int:pk>', BookDetailView.as_view(), name='book_detail_noslash'),
]
