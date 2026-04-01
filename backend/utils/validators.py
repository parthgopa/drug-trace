from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal
from datetime import datetime

class UserRegistration(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Literal['customer', 'manufacturer', 'owner', 'admin'] = 'customer'
    company_name: Optional[str] = None
    license_number: Optional[str] = None
    address: Optional[str] = None

    @validator('company_name')
    def validate_company_name(cls, v, values):
        role = values.get('role')
        if role in ['manufacturer', 'owner'] and not v:
            raise ValueError(f'Company name is required for {role}s')
        return v
    
    @validator('license_number')
    def validate_license_number(cls, v, values):
        if values.get('role') == 'manufacturer' and not v:
            raise ValueError('License number is required for manufacturers')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class DrugRegistration(BaseModel):
    drug_name: str = Field(..., min_length=2, max_length=200)
    manufacturer: str = Field(..., min_length=2, max_length=200)
    batch_number: str = Field(..., min_length=2, max_length=100)
    quantity: int = Field(..., gt=0)
    expiry_date: str
    manufacturing_date: str
    description: Optional[str] = None

    @validator('expiry_date', 'manufacturing_date')
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')

class DrugRecall(BaseModel):
    batch_number: str = Field(..., min_length=2)
    reason: str = Field(..., min_length=10)

class ReportSubmission(BaseModel):
    serial_number: str
    issue_description: str = Field(..., min_length=10, max_length=1000)
    issue_type: Literal['fake', 'expired', 'damaged', 'suspicious', 'other']
