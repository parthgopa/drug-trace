import qrcode
import io
import base64
from datetime import datetime
from bson import ObjectId

def generate_serial_number(drug_name: str, batch_number: str, index: int) -> str:
    prefix = ''.join([c.upper() for c in drug_name if c.isalpha()])[:6]
    timestamp = datetime.now().strftime('%Y%m')
    serial = f"{prefix}-{batch_number}-{timestamp}-{str(index).zfill(4)}"
    return serial

def generate_qr_code(data: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_base64}"

def check_drug_status(drug: dict) -> dict:
    expiry_date = datetime.strptime(drug['expiry_date'], '%Y-%m-%d')
    current_date = datetime.now()
    
    status = drug.get('status', 'active')
    
    if status == 'recalled':
        return {
            'is_genuine': True,
            'status': 'recalled',
            'message': '⚠️ RECALLED - Do not use this drug',
            'color': 'red'
        }
    
    if expiry_date < current_date:
        return {
            'is_genuine': True,
            'status': 'expired',
            'message': '⚠️ EXPIRED - Drug has passed expiry date',
            'color': 'orange'
        }
    
    return {
        'is_genuine': True,
        'status': 'genuine',
        'message': '✅ GENUINE - Drug is authentic and safe',
        'color': 'green'
    }

def serialize_doc(doc):
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        serialized = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                serialized[key] = str(value)
            elif isinstance(value, datetime):
                serialized[key] = value.isoformat()
            elif isinstance(value, dict):
                serialized[key] = serialize_doc(value)
            elif isinstance(value, list):
                serialized[key] = serialize_doc(value)
            else:
                serialized[key] = value
        return serialized
    return doc
