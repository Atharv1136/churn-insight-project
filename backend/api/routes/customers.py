"""
Customer data API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
import logging

from app.database import get_db
from app.models import Customer, Prediction

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/customers")
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    contract_type: Optional[str] = None,
    tenure_min: Optional[int] = None,
    tenure_max: Optional[int] = None,
    churn_status: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get customers with filtering and pagination
    """
    try:
        query = db.query(Customer)
        
        # Apply filters
        if contract_type:
            query = query.filter(Customer.contract_type == contract_type)
        
        if tenure_min is not None:
            query = query.filter(Customer.tenure >= tenure_min)
        
        if tenure_max is not None:
            query = query.filter(Customer.tenure <= tenure_max)
        
        if churn_status is not None:
            query = query.filter(Customer.churn_status == churn_status)
        
        if search:
            query = query.filter(
                or_(
                    Customer.customer_id.like(f"%{search}%"),
                    Customer.payment_method.like(f"%{search}%")
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        customers = query.offset(skip).limit(limit).all()
        
        return {
            "customers": [
                {
                    "id": c.id,
                    "customer_id": c.customer_id,
                    "tenure": c.tenure,
                    "monthly_charges": c.monthly_charges,
                    "total_charges": c.total_charges,
                    "contract_type": c.contract_type,
                    "payment_method": c.payment_method,
                    "internet_service": c.internet_service,
                    "tech_support": c.tech_support,
                    "churn_status": c.churn_status,
                    "created_at": c.created_at.isoformat() if c.created_at else None
                }
                for c in customers
            ],
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching customers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customers/{customer_id}")
async def get_customer(
    customer_id: str,
    db: Session = Depends(get_db)
):
    """
    Get customer details
    """
    try:
        customer = db.query(Customer).filter(
            Customer.customer_id == customer_id
        ).first()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Get customer's predictions
        predictions = db.query(Prediction).filter(
            Prediction.customer_id == customer_id
        ).order_by(Prediction.prediction_date.desc()).limit(5).all()
        
        return {
            "customer": {
                "id": customer.id,
                "customer_id": customer.customer_id,
                "gender": customer.gender,
                "senior_citizen": customer.senior_citizen,
                "partner": customer.partner,
                "dependents": customer.dependents,
                "tenure": customer.tenure,
                "phone_service": customer.phone_service,
                "multiple_lines": customer.multiple_lines,
                "internet_service": customer.internet_service,
                "online_security": customer.online_security,
                "online_backup": customer.online_backup,
                "device_protection": customer.device_protection,
                "tech_support": customer.tech_support,
                "streaming_tv": customer.streaming_tv,
                "streaming_movies": customer.streaming_movies,
                "contract_type": customer.contract_type,
                "paperless_billing": customer.paperless_billing,
                "payment_method": customer.payment_method,
                "monthly_charges": customer.monthly_charges,
                "total_charges": customer.total_charges,
                "churn_status": customer.churn_status,
                "created_at": customer.created_at.isoformat() if customer.created_at else None
            },
            "predictions": [pred.to_dict() for pred in predictions]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching customer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/customers/stats/summary")
async def get_customer_stats(
    db: Session = Depends(get_db)
):
    """
    Get customer statistics summary
    """
    try:
        from sqlalchemy import func
        
        total_customers = db.query(func.count(Customer.id)).scalar() or 0
        
        churned_customers = db.query(func.count(Customer.id)).filter(
            Customer.churn_status == True
        ).scalar() or 0
        
        avg_tenure = db.query(func.avg(Customer.tenure)).scalar() or 0
        avg_monthly_charges = db.query(func.avg(Customer.monthly_charges)).scalar() or 0
        
        # Contract type distribution
        contract_dist = db.query(
            Customer.contract_type,
            func.count(Customer.id).label('count')
        ).group_by(Customer.contract_type).all()
        
        # Internet service distribution
        internet_dist = db.query(
            Customer.internet_service,
            func.count(Customer.id).label('count')
        ).group_by(Customer.internet_service).all()
        
        return {
            "total_customers": total_customers,
            "churned_customers": churned_customers,
            "churn_rate": round(churned_customers / total_customers, 4) if total_customers > 0 else 0,
            "avg_tenure": round(float(avg_tenure), 2),
            "avg_monthly_charges": round(float(avg_monthly_charges), 2),
            "contract_distribution": {row.contract_type: row.count for row in contract_dist},
            "internet_distribution": {row.internet_service: row.count for row in internet_dist}
        }
        
    except Exception as e:
        logger.error(f"Error fetching customer stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
