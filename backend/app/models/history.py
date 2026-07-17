from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, func, Text, Float
from sqlalchemy.orm import relationship
from app.models.base import Base

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationship to messages, ordered by timestamp ascending
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.timestamp")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)  # "user" or "assistant"
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=func.now(), nullable=False)

    # Back relation to conversation
    conversation = relationship("ChatConversation", back_populates="messages")

class ScenarioHistory(Base):
    __tablename__ = "scenario_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_name = Column(String, nullable=False)
    scenario_type = Column(String, nullable=False)  # "simulation", "comparison", "optimization", "forecast"
    input_parameters = Column(JSON, nullable=False)
    predicted_revenue = Column(Float, nullable=False, default=0.0)
    predicted_roas = Column(Float, nullable=False, default=0.0)
    estimated_profit = Column(Float, nullable=False, default=0.0)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
