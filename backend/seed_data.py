from utils.database import get_database
from models.user import User
from models.drug import Drug
from datetime import datetime, timedelta

def seed_database():
    print("🌱 Seeding database with sample data...")
    
    try:
        db = get_database()
        
        db.users.delete_many({})
        db.drugs.delete_many({})
        db.scan_logs.delete_many({})
        db.reports.delete_many({})
        
        print("✅ Cleared existing data")
        
        admin_user = User.create(
            name="Admin User",
            email="admin@pharma.com",
            password="admin123",
            role="admin"
        )
        print(f"✅ Created admin user: {admin_user['email']}")
        
        manufacturer1 = User.create(
            name="John Doe",
            email="manufacturer@pharma.com",
            password="manu123",
            role="manufacturer",
            company_name="PharmaCorp Ltd",
            license_number="LIC-2024-001",
            address="123 Pharma Street, Medical City"
        )
        print(f"✅ Created manufacturer: {manufacturer1['company_name']}")
        
        manufacturer2 = User.create(
            name="Jane Smith",
            email="medlife@pharma.com",
            password="manu123",
            role="manufacturer",
            company_name="MedLife Industries",
            license_number="LIC-2024-002",
            address="456 Health Avenue, Bio Park"
        )
        print(f"✅ Created manufacturer: {manufacturer2['company_name']}")
        
        customer1 = User.create(
            name="Alice Johnson",
            email="customer@test.com",
            password="customer123",
            role="customer"
        )
        print(f"✅ Created customer: {customer1['email']}")
        
        customer2 = User.create(
            name="Bob Williams",
            email="bob@test.com",
            password="customer123",
            role="customer"
        )
        print(f"✅ Created customer: {customer2['email']}")
        
        today = datetime.now()
        future_date = (today + timedelta(days=365)).strftime('%Y-%m-%d')
        past_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
        manufacturing_date = (today - timedelta(days=60)).strftime('%Y-%m-%d')
        
        drugs_data = [
            {
                'drug_name': 'Paracetamol 500mg',
                'manufacturer': manufacturer1['company_name'],
                'batch_number': 'BATCH001',
                'quantity': 100,
                'expiry_date': future_date,
                'manufacturing_date': manufacturing_date,
                'manufacturer_id': str(manufacturer1['_id']),
                'description': 'Pain relief and fever reducer'
            },
            {
                'drug_name': 'Amoxicillin 250mg',
                'manufacturer': manufacturer1['company_name'],
                'batch_number': 'BATCH002',
                'quantity': 50,
                'expiry_date': future_date,
                'manufacturing_date': manufacturing_date,
                'manufacturer_id': str(manufacturer1['_id']),
                'description': 'Antibiotic for bacterial infections'
            },
            {
                'drug_name': 'Ibuprofen 400mg',
                'manufacturer': manufacturer2['company_name'],
                'batch_number': 'BATCH003',
                'quantity': 75,
                'expiry_date': past_date,
                'manufacturing_date': (today - timedelta(days=400)).strftime('%Y-%m-%d'),
                'manufacturer_id': str(manufacturer2['_id']),
                'description': 'Anti-inflammatory pain reliever'
            },
            {
                'drug_name': 'Cetirizine 10mg',
                'manufacturer': manufacturer2['company_name'],
                'batch_number': 'BATCH004',
                'quantity': 60,
                'expiry_date': future_date,
                'manufacturing_date': manufacturing_date,
                'manufacturer_id': str(manufacturer2['_id']),
                'description': 'Antihistamine for allergies'
            },
            {
                'drug_name': 'Metformin 500mg',
                'manufacturer': manufacturer1['company_name'],
                'batch_number': 'BATCH005',
                'quantity': 80,
                'expiry_date': future_date,
                'manufacturing_date': manufacturing_date,
                'manufacturer_id': str(manufacturer1['_id']),
                'description': 'Diabetes medication'
            }
        ]
        
        for drug_data in drugs_data:
            result = Drug.create_batch(**drug_data)
            print(f"✅ Created batch: {drug_data['batch_number']} - {result['quantity']} units of {drug_data['drug_name']}")
        
        recalled_batch = Drug.recall_batch('BATCH004', str(manufacturer2['_id']))
        print(f"✅ Recalled batch BATCH004: {recalled_batch} units")
        
        print("\n🎉 Database seeding completed successfully!")
        print("\n📋 Sample Credentials:")
        print("=" * 50)
        print("Admin:")
        print("  Email: admin@pharma.com")
        print("  Password: admin123")
        print("\nManufacturer 1:")
        print("  Email: manufacturer@pharma.com")
        print("  Password: manu123")
        print("  Company: PharmaCorp Ltd")
        print("\nManufacturer 2:")
        print("  Email: medlife@pharma.com")
        print("  Password: manu123")
        print("  Company: MedLife Industries")
        print("\nCustomer 1:")
        print("  Email: customer@test.com")
        print("  Password: customer123")
        print("\nCustomer 2:")
        print("  Email: bob@test.com")
        print("  Password: customer123")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error seeding database: {str(e)}")
        raise

if __name__ == '__main__':
    seed_database()
