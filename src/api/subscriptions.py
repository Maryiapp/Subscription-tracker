from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.security import get_current_user
from src.models.subscription import Subscription
from src.models.user import User
from src.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionStats,
    SubscriptionUpdate,
)

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.post(
    "/",
    response_model=SubscriptionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_subscription(
    subscription_in: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_subscription = Subscription(
        **subscription_in.model_dump(),
        user_id=current_user.id,
    )
    db.add(new_subscription)
    db.commit()
    db.refresh(new_subscription)
    return new_subscription


@router.get("/", response_model=List[SubscriptionResponse])
def get_subscriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .all()
    )


@router.get("/stats/summary", response_model=SubscriptionStats)
def get_subscription_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscriptions = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .all()
    )

    active_subs = [s for s in subscriptions if s.is_active]
    inactive_count = len(subscriptions) - len(active_subs)

    total_monthly = 0.0
    total_yearly = 0.0
    most_expensive = None
    max_monthly_price = -1.0

    for sub in active_subs:
        if sub.billing_cycle == "yearly":
            m_price = sub.price / 12.0
            y_price = sub.price
        else:
            m_price = sub.price
            y_price = sub.price * 12.0

        total_monthly += m_price
        total_yearly += y_price

        if m_price > max_monthly_price:
            max_monthly_price = m_price
            most_expensive = sub

    return SubscriptionStats(
        total_monthly=round(total_monthly, 2),
        total_yearly=round(total_yearly, 2),
        active_count=len(active_subs),
        inactive_count=inactive_count,
        most_expensive=most_expensive,
    )


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.user_id == current_user.id,
        )
        .first()
    )
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )
    return subscription


@router.patch("/{subscription_id}", response_model=SubscriptionResponse)
def update_subscription(
    subscription_id: int,
    subscription_in: SubscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.user_id == current_user.id,
        )
        .first()
    )
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )

    update_data = subscription_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(subscription, field, value)

    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subscription(
    subscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.id == subscription_id,
            Subscription.user_id == current_user.id,
        )
        .first()
    )
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription not found",
        )

    db.delete(subscription)
    db.commit()
    return None
