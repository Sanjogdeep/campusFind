import sys
import argparse
from app.core.database import SessionLocal
from app.models.models import User
from app.core.security import get_password_hash


def list_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role.in_(["ADMIN", "SUPER_ADMIN"])).all()
        print("\n=== Current CampusFind Administrators ===")
        if not admins:
            print("No admin accounts found.")
        for u in admins:
            print(f"- ID: {u.id} | Name: {u.name} | Email: {u.email} | Role: {u.role}")
        print("=========================================\n")
    finally:
        db.close()


def set_admin_role(email: str, role: str = "SUPER_ADMIN", password: str = None):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.strip().lower()).first()
        if not user:
            print(f"Error: User with email '{email}' was not found in the database.")
            print("Tip: Register the user first via the Sign Up page, then run this command to grant admin access.")
            return

        user.role = role
        if password:
            user.hashed_password = get_password_hash(password)
            print(f"Password updated successfully for {email}.")

        db.commit()
        print(f"Success! {user.name} ({user.email}) is now a '{role}'.")
        print("You can now log in at http://localhost:5173/login and click 'Admin Portal' in the navigation bar.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manage CampusFind Admin Accounts")
    parser.add_argument("email", nargs="?", help="Email of the user to promote to admin")
    parser.add_argument("--role", default="SUPER_ADMIN", choices=["ADMIN", "SUPER_ADMIN", "STUDENT"], help="Role to assign")
    parser.add_argument("--password", help="Optional new password to set for this user")
    parser.add_argument("--list", action="store_true", help="List all current admin users")

    args = parser.parse_args()

    if args.list:
        list_admins()
    elif args.email:
        set_admin_role(args.email, role=args.role, password=args.password)
    else:
        parser.print_help()
