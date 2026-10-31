from pathlib import Path
from datetime import datetime

import jwt
import joblib
import pandas as pd
import io
from fastapi import FastAPI, File, HTTPException, UploadFile
import pandas as pd

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from auth import (
    create_access_token,
    hash_password,
    verify_password,
)

from database import Base, SessionLocal, engine
from models import Doctor, Patient, Assessment


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

# ============================================================
# APPLICATION
# ============================================================

app = FastAPI(
    title="CardioAI API",
    description="CardioAI cardiovascular research prototype",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173", # If using Vite locally
        "https://cardio-ai-web.onrender.com", # <--- Your Deployed Frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# JWT SECURITY
# ============================================================

security = HTTPBearer()

JWT_SECRET = "cardioai-development-secret-key-2026-very-long"
JWT_ALGORITHM = "HS256"


def get_current_doctor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        doctor_id = int(payload["sub"])

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )

    doctor = (
        db.query(Doctor)
        .filter(Doctor.id == doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=401,
            detail="Doctor not found.",
        )

    return doctor


# ============================================================
# LOAD HEART DISEASE MODEL
# ============================================================

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "../ml/heart_disease_logistic_model.pkl"
)

heart_model = None


try:
    if MODEL_PATH.exists():

        heart_model = joblib.load(MODEL_PATH)

        print("Heart disease model loaded successfully.")
        print("Model type:", type(heart_model))

        if hasattr(heart_model, "feature_names_in_"):
            print(
                "Model features:",
                list(heart_model.feature_names_in_),
            )

        elif hasattr(heart_model, "named_steps"):
            print(
                "Model pipeline loaded:",
                list(heart_model.named_steps.keys()),
            )

    else:
        print(
            "WARNING: Model file not found:",
            MODEL_PATH,
        )

except Exception as exc:

    print(
        "ERROR: Could not load heart disease model:",
        repr(exc),
    )

    heart_model = None


# ============================================================
# MODEL FEATURES
# ============================================================

MODEL_FEATURES = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
]


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================


class DoctorRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class DoctorLogin(BaseModel):
    email: EmailStr
    password: str


class PatientCreate(BaseModel):
    name: str
    date_of_birth: str | None = None
    sex: str | None = None
    phone: str | None = None


class AssessmentCreate(BaseModel):
    age: int
    sex: int
    cp: int
    trestbps: float
    chol: float
    fbs: int
    restecg: int
    thalach: float
    exang: int
    oldpeak: float
    slope: int
    ca: int
    thal: int


# ============================================================
# BASIC ROUTES
# ============================================================


@app.get("/")
def root():

    return {
        "message": "CardioAI API is running",
        "version": "1.0.0",
        "model_loaded": heart_model is not None,
    }


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model_loaded": heart_model is not None,
    }


@app.get("/model-status")
def model_status():

    if heart_model is None:

        return {
            "loaded": False,
            "message": "Heart disease model is not loaded.",
        }

    return {
        "loaded": True,
        "message": "Heart disease model loaded successfully.",
        "features": MODEL_FEATURES,
    }


# ============================================================
# AUTH - REGISTER
# ============================================================


@app.post("/auth/register")
def register_doctor(
    doctor_data: DoctorRegister,
    db: Session = Depends(get_db),
):

    existing_doctor = (
        db.query(Doctor)
        .filter(
            Doctor.email == doctor_data.email
        )
        .first()
    )

    if existing_doctor:

        raise HTTPException(
            status_code=400,
            detail="A doctor with this email already exists.",
        )

    doctor = Doctor(
        name=doctor_data.name,
        email=doctor_data.email,
        password_hash=hash_password(
            doctor_data.password
        ),
    )

    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return {
        "message": "Doctor account created successfully.",
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "email": doctor.email,
        },
    }


# ============================================================
# AUTH - LOGIN
# ============================================================


@app.post("/auth/login")
def login_doctor(
    login_data: DoctorLogin,
    db: Session = Depends(get_db),
):

    doctor = (
        db.query(Doctor)
        .filter(
            Doctor.email == login_data.email
        )
        .first()
    )

    if not doctor:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    password_valid = verify_password(
        login_data.password,
        doctor.password_hash,
    )

    if not password_valid:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    access_token = create_access_token(
        doctor.id
    )

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "doctor": {
            "id": doctor.id,
            "name": doctor.name,
            "email": doctor.email,
        },
    }


# ============================================================
# ADMIN MODEL / CSV VALIDATION
# ============================================================

MODEL_FEATURES = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
]

TARGET_COLUMN = "target"


@app.post("/admin/model/validate-csv")
async def upload_training_csv(file: UploadFile = File(...)):

    """
    Validate a CSV dataset before it is used for model training.

    This endpoint DOES NOT train the model.
    It only checks whether the CSV is suitable.
    """

    # --------------------------------------------------------
    # Check file type
    # --------------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected."
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed."
        )

    # --------------------------------------------------------
    # Read file
    # --------------------------------------------------------

    try:
        contents = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not read CSV file: {exc}"
        )

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The CSV file is empty."
        )

    # --------------------------------------------------------
    # Parse CSV
    # --------------------------------------------------------

    try:
        df = pd.read_csv(
            io.BytesIO(contents)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid CSV file: {exc}"
        )

    # Remove accidental spaces from column names

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    # --------------------------------------------------------
    # Check required columns
    # --------------------------------------------------------

    required_columns = MODEL_FEATURES + [
        TARGET_COLUMN
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        return {
            "valid": False,
            "message": "CSV is missing required columns.",
            "filename": file.filename,
            "rows": len(df),
            "columns": list(df.columns),
            "missing_columns": missing_columns,
            "extra_columns": [
                column
                for column in df.columns
                if column not in required_columns
            ],
            "errors": [],
        }

    # --------------------------------------------------------
    # Find extra columns
    # --------------------------------------------------------

    extra_columns = [
        column
        for column in df.columns
        if column not in required_columns
    ]

    errors = []

    # --------------------------------------------------------
    # Check missing values
    # --------------------------------------------------------

    missing_values = df[required_columns].isnull().sum()

    for column, count in missing_values.items():

        if count > 0:

            errors.append({
                "type": "missing_values",
                "column": column,
                "count": int(count),
                "message": (
                    f"{column} contains "
                    f"{count} missing value(s)."
                ),
            })

    # --------------------------------------------------------
    # Check numeric columns
    # --------------------------------------------------------

    for column in required_columns:

        converted = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        invalid_count = int(
            converted.isna().sum()
        )

        if invalid_count > 0:

            errors.append({
                "type": "non_numeric",
                "column": column,
                "count": invalid_count,
                "message": (
                    f"{column} contains "
                    f"{invalid_count} non-numeric value(s)."
                ),
            })

    # --------------------------------------------------------
    # Check target values
    # --------------------------------------------------------

    target_numeric = pd.to_numeric(
        df[TARGET_COLUMN],
        errors="coerce"
    )

    invalid_target = target_numeric[
        ~target_numeric.isin([0, 1])
        & target_numeric.notna()
    ]

    if len(invalid_target) > 0:

        errors.append({
            "type": "invalid_target",
            "column": TARGET_COLUMN,
            "count": int(len(invalid_target)),
            "message": (
                "Target must contain only "
                "0 or 1."
            ),
        })

    # --------------------------------------------------------
    # Check model feature ranges
    # --------------------------------------------------------

    range_rules = {
        "age": (1, 120),
        "sex": (0, 1),
        "cp": (0, 3),
        "trestbps": (50, 300),
        "chol": (0, 1000),
        "fbs": (0, 1),
        "restecg": (0, 2),
        "thalach": (40, 250),
        "exang": (0, 1),
        "oldpeak": (0, 10),
        "slope": (0, 2),
        "ca": (0, 3),
        "thal": (0, 3),
    }

    for column, (minimum, maximum) in range_rules.items():

        numeric_values = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        invalid_range = numeric_values[
            (
                numeric_values.notna()
                & (
                    (numeric_values < minimum)
                    | (numeric_values > maximum)
                )
            )
        ]

        if len(invalid_range) > 0:

            errors.append({
                "type": "out_of_range",
                "column": column,
                "count": int(len(invalid_range)),
                "message": (
                    f"{column} must be between "
                    f"{minimum} and {maximum}."
                ),
            })

    # --------------------------------------------------------
    # Dataset statistics
    # --------------------------------------------------------

    target_counts = {}

    for value, count in (
        target_numeric
        .dropna()
        .value_counts()
        .items()
    ):
        target_counts[str(int(value))] = int(count)

    # --------------------------------------------------------
    # Final result
    # --------------------------------------------------------

    valid = len(errors) == 0

    return {
        "valid": valid,

        "message": (
            "CSV is valid and ready for the training step."
            if valid
            else "CSV contains validation errors."
        ),

        "filename": file.filename,

        "rows": int(len(df)),

        "columns": list(df.columns),

        "required_columns": required_columns,

        "missing_columns": missing_columns,

        "extra_columns": extra_columns,

        "target_distribution": target_counts,

        "errors": errors,

        "preview": (
            df[
                required_columns
            ]
            .head(10)
            .fillna("")
            .to_dict(
                orient="records"
            )
        ),
    }




# ============================================================
# PATIENTS - CREATE
# ============================================================


@app.post("/patients")
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):

    patient = Patient(
        doctor_id=current_doctor.id,
        name=patient_data.name,
        date_of_birth=patient_data.date_of_birth,
        sex=patient_data.sex,
        phone=patient_data.phone,
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return {
        "message": "Patient created successfully.",
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth,
            "sex": patient.sex,
            "phone": patient.phone,
            "created_at": patient.created_at,
        },
    }


# ============================================================
# PATIENTS - LIST
# ============================================================


@app.get("/patients")
def get_patients(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):

    patients = (
        db.query(Patient)
        .filter(
            Patient.doctor_id == current_doctor.id
        )
        .order_by(
            Patient.created_at.desc()
        )
        .all()
    )

    return {
        "patients": [
            {
                "id": patient.id,
                "name": patient.name,
                "date_of_birth": patient.date_of_birth,
                "sex": patient.sex,
                "phone": patient.phone,
                "created_at": patient.created_at,
            }
            for patient in patients
        ]
    }


# ============================================================
# PATIENT - GET ONE
# ============================================================


@app.get("/patients/{patient_id}")
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.doctor_id == current_doctor.id,
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    return {
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "date_of_birth": patient.date_of_birth,
            "sex": patient.sex,
            "phone": patient.phone,
            "created_at": patient.created_at,
        }
    }


# ============================================================
# ML PREDICTION
# ============================================================


def run_heart_prediction(
    assessment_data: AssessmentCreate,
):

    if heart_model is None:

        raise HTTPException(
            status_code=503,
            detail=(
                "Heart disease model is not loaded. "
                "Check that heart_disease_logistic_model.pkl "
                "is inside the backend folder."
            ),
        )

    values = {
        "age": assessment_data.age,
        "sex": assessment_data.sex,
        "cp": assessment_data.cp,
        "trestbps": assessment_data.trestbps,
        "chol": assessment_data.chol,
        "fbs": assessment_data.fbs,
        "restecg": assessment_data.restecg,
        "thalach": assessment_data.thalach,
        "exang": assessment_data.exang,
        "oldpeak": assessment_data.oldpeak,
        "slope": assessment_data.slope,
        "ca": assessment_data.ca,
        "thal": assessment_data.thal,
    }

    input_df = pd.DataFrame(
        [values],
        columns=MODEL_FEATURES,
    )

    try:

        prediction = int(
            heart_model.predict(input_df)[0]
        )

        probability = None

        if hasattr(
            heart_model,
            "predict_proba",
        ):

            probabilities = (
                heart_model.predict_proba(
                    input_df
                )[0]
            )

            probability = float(
                probabilities[1]
            )

        else:

            probability = (
                1.0
                if prediction == 1
                else 0.0
            )

        # ----------------------------------------------------
        # Risk category
        #
        # This is a presentation category based on the
        # model probability. It is NOT a clinical diagnosis.
        # ----------------------------------------------------

        if probability < 0.30:

            risk_level = "Low"

        elif probability < 0.70:

            risk_level = "Moderate"

        else:

            risk_level = "High"

        return (
            prediction,
            probability,
            risk_level,
        )

    except Exception as exc:

        print(
            "MODEL PREDICTION ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The heart disease model failed "
                "while making the prediction."
            ),
        )


# ============================================================
# ASSESSMENT - CREATE
# ============================================================


@app.post(
    "/patients/{patient_id}/assessments"
)
def create_assessment(
    patient_id: int,
    assessment_data: AssessmentCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):

    # --------------------------------------------------------
    # Verify patient belongs to logged-in doctor
    # --------------------------------------------------------

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.doctor_id == current_doctor.id,
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    # --------------------------------------------------------
    # Run ML model
    # --------------------------------------------------------

    (
        prediction,
        probability,
        risk_level,
    ) = run_heart_prediction(
        assessment_data
    )

    # --------------------------------------------------------
    # Save assessment
    #
    # IMPORTANT:
    # Only use columns that actually exist in Assessment.
    # No systolic_bp, diabetes, smoking, etc.
    # --------------------------------------------------------

    assessment = Assessment(

        patient_id=patient.id,

        age=assessment_data.age,

        sex=assessment_data.sex,

        cp=assessment_data.cp,

        trestbps=assessment_data.trestbps,

        chol=assessment_data.chol,

        fbs=assessment_data.fbs,

        restecg=assessment_data.restecg,

        thalach=assessment_data.thalach,

        exang=assessment_data.exang,

        oldpeak=assessment_data.oldpeak,

        slope=assessment_data.slope,

        ca=assessment_data.ca,

        thal=assessment_data.thal,

        prediction=prediction,

        probability=probability,

        risk_score=probability * 100,

        risk_level=risk_level,

    )

    db.add(assessment)

    db.commit()

    db.refresh(assessment)

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {

        "message": "Assessment created successfully.",

        "assessment": {

            "id": assessment.id,

            "patient_id": assessment.patient_id,

            "age": assessment.age,

            "sex": assessment.sex,

            "cp": assessment.cp,

            "trestbps": assessment.trestbps,

            "chol": assessment.chol,

            "fbs": assessment.fbs,

            "restecg": assessment.restecg,

            "thalach": assessment.thalach,

            "exang": assessment.exang,

            "oldpeak": assessment.oldpeak,

            "slope": assessment.slope,

            "ca": assessment.ca,

            "thal": assessment.thal,

            "prediction": assessment.prediction,

            "probability": assessment.probability,

            "risk_score": assessment.risk_score,

            "risk_level": assessment.risk_level,

            "created_at": assessment.created_at,

        },

        "analysis": {

            "prediction": prediction,

            "probability": probability,

            "risk_score": probability * 100,

            "risk_level": risk_level,

            "prototype": True,

        },

    }


# ============================================================
# ASSESSMENT - HISTORY
# ============================================================


@app.get(
    "/patients/{patient_id}/assessments"
)
def get_assessments(
    patient_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor),
):

    patient = (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.doctor_id == current_doctor.id,
        )
        .first()
    )

    if not patient:

        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    assessments = (
        db.query(Assessment)
        .filter(
            Assessment.patient_id == patient_id
        )
        .order_by(
            Assessment.created_at.desc()
        )
        .all()
    )

    return {

        "patient": {
            "id": patient.id,
            "name": patient.name,
        },

        "assessments": [

            {
                "id": assessment.id,

                "patient_id": assessment.patient_id,

                "age": assessment.age,

                "sex": assessment.sex,

                "cp": assessment.cp,

                "trestbps": assessment.trestbps,

                "chol": assessment.chol,

                "fbs": assessment.fbs,

                "restecg": assessment.restecg,

                "thalach": assessment.thalach,

                "exang": assessment.exang,

                "oldpeak": assessment.oldpeak,

                "slope": assessment.slope,

                "ca": assessment.ca,

                "thal": assessment.thal,

                "prediction": assessment.prediction,

                "probability": assessment.probability,

                "risk_score": assessment.risk_score,

                "risk_level": assessment.risk_level,

                "created_at": assessment.created_at,

            }

            for assessment in assessments

        ],

    }
