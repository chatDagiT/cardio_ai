from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from database import Base


# ============================================================
# DOCTOR
# ============================================================

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    patients = relationship(
        "Patient",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )


# ============================================================
# PATIENT
# ============================================================

class Patient(Base):
    __tablename__ = "patients"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    doctor_id = Column(
        Integer,
        ForeignKey("doctors.id"),
        nullable=False,
    )

    name = Column(
        String,
        nullable=False,
    )

    date_of_birth = Column(
        String,
        nullable=True,
    )

    sex = Column(
        String,
        nullable=True,
    )

    phone = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    doctor = relationship(
        "Doctor",
        back_populates="patients",
    )

    assessments = relationship(
        "Assessment",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


# ============================================================
# ASSESSMENT
# ============================================================

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
    )

    # ==========================================
    # 13 HEART-DISEASE MODEL FEATURES
    # ==========================================

    age = Column(
        Integer,
        nullable=False,
    )

    sex = Column(
        Integer,
        nullable=False,
    )

    cp = Column(
        Integer,
        nullable=False,
    )

    trestbps = Column(
        Float,
        nullable=False,
    )

    chol = Column(
        Float,
        nullable=False,
    )

    fbs = Column(
        Integer,
        nullable=False,
    )

    restecg = Column(
        Integer,
        nullable=False,
    )

    thalach = Column(
        Float,
        nullable=False,
    )

    exang = Column(
        Integer,
        nullable=False,
    )

    oldpeak = Column(
        Float,
        nullable=False,
    )

    slope = Column(
        Integer,
        nullable=False,
    )

    ca = Column(
        Integer,
        nullable=False,
    )

    thal = Column(
        Integer,
        nullable=False,
    )

    # ==========================================
    # MODEL RESULT
    # ==========================================

    prediction = Column(
        Integer,
        nullable=True,
    )

    probability = Column(
        Float,
        nullable=True,
    )

    risk_score = Column(
        Float,
        nullable=True,
    )

    risk_level = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    # ==========================================
    # RELATIONSHIP
    # ==========================================

    patient = relationship(
        "Patient",
        back_populates="assessments",
    )