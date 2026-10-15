from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from src.schemas.category import CategoryResponse


class SubscriptionBase(BaseModel):
    title: str
    price: float
    currency: str = "USD"
    billing_cycle: str = "monthly"
    is_active: bool = True
    category_id: Optional[int] = None


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    title: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = None
    billing_cycle: Optional[str] = None
    is_active: Optional[bool] = None
    category_id: Optional[int] = None


class SubscriptionResponse(SubscriptionBase):
    id: int
    start_date: datetime
    category: Optional[CategoryResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Схема для статистики и аналитики
class SubscriptionStats(BaseModel):
    total_monthly: float
    total_yearly: float
    active_count: int
    inactive_count: int
    most_expensive: Optional[SubscriptionResponse] = None
