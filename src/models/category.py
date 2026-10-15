from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.core.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    icon = Column(String, nullable=True)  # например, "film", "music", "code"

    subscriptions = relationship("Subscription", back_populates="category")