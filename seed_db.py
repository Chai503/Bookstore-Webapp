import os
import sys
import django
import bcrypt

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Book_Management.settings')
django.setup()

from Book_of_Bau_Bau.models import User as AppUser, Book

def seed():
    print("=== SEEDING DATABASE ===")

    # 1. Seed Users
    raw_password = '123456'
    hashed_pw = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt(10)).decode('utf-8')
    print(f"Generated bcrypt hash (len={len(hashed_pw)}): {hashed_pw[:20]}...")

    users_data = [
        {"email": "usera@test.com", "name": "User A", "role": "viewer"},
        {"email": "userb@test.com", "name": "User B", "role": "editor"},
        {"email": "userc@test.com", "name": "User C", "role": "admin"},
        {"email": "manager@test.com", "name": "Manager", "role": "manager"},
    ]

    for u_info in users_data:
        user, created = AppUser.objects.get_or_create(
            email=u_info["email"],
            defaults={
                "name": u_info["name"],
                "password": hashed_pw,
                "role": u_info["role"],
                "is_verified": True,
            }
        )
        if not created:
            user.name = u_info["name"]
            user.password = hashed_pw
            user.role = u_info["role"]
            user.is_verified = True
            user.save()
            print(f"[*] Updated user: {user.email} (Role: {user.role}, is_verified: {user.is_verified})")
        else:
            print(f"[+] Created user: {user.email} (Role: {user.role}, is_verified: {user.is_verified})")

    # 2. Seed Books
    sample_books = [
        {
            "title": "พื้นฐานการเขียนโปรแกรม",
            "author": "สมชาย ใจดี",
            "price": 250.00,
            "stock": 10,
            "category": "Programming"
        },
        {
            "title": "เรียนรู้ IoT ด้วย ESP32",
            "author": "วิชัย ขี้โมโห",
            "price": 320.00,
            "stock": 5,
            "category": "IoT"
        },
        {
            "title": "Data Science เบื้องต้น",
            "author": "ออร่า เจ้าถิ่น",
            "price": 450.00,
            "stock": 8,
            "category": "Data Science"
        },
        {
            "title": "Cloud Native Architecture",
            "author": "สุชาติ พัฒนา",
            "price": 590.00,
            "stock": 15,
            "category": "Cloud Computing"
        },
        {
            "title": "Full Stack Web Development with Django & React",
            "author": "กมลวรรณ เก่งกาจ",
            "price": 499.00,
            "stock": 12,
            "category": "Web Development"
        }
    ]

    for b_info in sample_books:
        book, created = Book.objects.get_or_create(
            title=b_info["title"],
            defaults=b_info
        )
        if created:
            print(f"[+] Added book: {book.title} (Price: {book.price}, Stock: {book.stock})")
        else:
            print(f"[*] Existing book: {book.title}")

    print("\n[OK] Database seeding completed successfully!")

if __name__ == '__main__':
    seed()
