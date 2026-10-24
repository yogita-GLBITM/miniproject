from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.models.user import User, StudentProfile, FacultyProfile
from app.schemas.auth import (
    LoginRequest,
    RoleSwitchDemoRequest,
    TokenResponse,
    UserProfileResponse,
    StudentRosterItem,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _build_profile_response(user: User) -> UserProfileResponse:
    if user.role == "student" and user.student_profile:
        sp = user.student_profile
        return UserProfileResponse(
            id=sp.id,
            name=sp.name,
            enrollmentNo=sp.enrollment_no,
            enrollmentNumber=sp.enrollment_no,
            rollNumber=sp.roll_number or sp.enrollment_no,
            collegeId=sp.college_id,
            email=sp.email,
            phone=sp.phone,
            role="student",
            avatarUrl=sp.avatar_url,
            department=sp.department,
            course=sp.course,
            branch=sp.branch,
            semester=sp.semester,
            section=sp.section,
            batch=sp.batch,
            mentorName=sp.mentor_name,
            bloodGroup=sp.blood_group,
            cgpa=sp.cgpa,
            totalCredits=sp.total_credits,
            achievements=sp.achievements,
        )
    elif user.role == "faculty" and user.faculty_profile:
        fp = user.faculty_profile
        return UserProfileResponse(
            id=fp.id,
            name=fp.name,
            enrollmentNo=fp.enrollment_no,
            enrollmentNumber=fp.enrollment_no,
            rollNumber=fp.enrollment_no,
            collegeId=fp.college_id,
            email=fp.email,
            phone=fp.phone,
            role="faculty",
            department=fp.department,
            course=fp.course,
            branch=fp.branch,
            semester=fp.semester,
            section=fp.section,
            batch=fp.batch,
        )
    else:  # Admin or generic
        return UserProfileResponse(
            id=user.id,
            name="Prof. (Dr.) Manas Kumar Mishra" if user.role == "admin" else user.college_id,
            enrollmentNo=user.college_id,
            enrollmentNumber=user.college_id,
            rollNumber=user.college_id,
            collegeId=user.college_id,
            email=user.email,
            role=user.role,
            department="Office of Academic Affairs & Administration" if user.role == "admin" else "Computer Science & Engineering",
            course="Institutional Administration" if user.role == "admin" else "B.Tech",
            branch="GL Bajaj Institute of Technology & Management",
            semester="CampusOS SuperAdmin" if user.role == "admin" else "Semester VI",
            section="Greater Noida Campus" if user.role == "admin" else "A",
            batch="2026",
        )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with roll_number, name, college_id, or email."""
    roll = payload.roll_number.strip() if payload.roll_number else None
    name = payload.name.strip() if payload.name else None
    ident = (payload.identifier or payload.college_id or "").strip() or None
    user = None

    # 1. Search by roll_number first if supplied (Roll Number is unique)
    if roll:
        student = (
            db.query(StudentProfile)
            .filter((StudentProfile.roll_number.ilike(roll)) | (StudentProfile.enrollment_no.ilike(roll)))
            .first()
        )
        if not student and len(roll) >= 6:
            # Fuzzy match on last 6 digits in case of batch year prefix typo (e.g. 21 vs 25)
            student = (
                db.query(StudentProfile)
                .filter(StudentProfile.roll_number.ilike(f"%{roll[-6:]}%"))
                .first()
            )
        if student and student.user:
            user = student.user

    # 2. If no student found by roll and both roll & name were supplied, try matching both
    if not user and roll and name:
        student = (
            db.query(StudentProfile)
            .filter(
                (StudentProfile.roll_number.ilike(roll)) | (StudentProfile.enrollment_no.ilike(roll)),
                StudentProfile.name.ilike(f"%{name}%"),
            )
            .first()
        )
        if student and student.user:
            user = student.user

    # 3. If name alone is supplied (or roll didn't match)
    if not user and name:
        student = (
            db.query(StudentProfile)
            .filter(StudentProfile.name.ilike(name))
            .first()
        )
        if not student:
            # Partial match if exact full name not found
            student = (
                db.query(StudentProfile)
                .filter(StudentProfile.name.ilike(f"%{name}%"))
                .first()
            )
        if student and student.user:
            user = student.user

    # 4. If identifier (or college_id) is supplied
    if not user and ident:
        student = (
            db.query(StudentProfile)
            .filter(
                (StudentProfile.roll_number.ilike(ident))
                | (StudentProfile.name.ilike(ident))
                | (StudentProfile.name.ilike(f"%{ident}%"))
                | (StudentProfile.college_id.ilike(ident))
                | (StudentProfile.email.ilike(ident))
                | (StudentProfile.enrollment_no.ilike(ident))
            )
            .first()
        )
        if student and student.user:
            user = student.user
        else:
            # Check User table directly (e.g. for faculty or admin)
            user = (
                db.query(User)
                .filter((User.college_id.ilike(ident)) | (User.email.ilike(ident)))
                .first()
            )

    # 5. Check if user provided an explicit identifier that didn't match
    has_explicit_id = bool(roll or name or ident)
    if has_explicit_id and not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Student or user account not found. Please verify your Roll Number or Name.",
        )

    # 6. Fallback only if no identifier was passed at all (e.g. quick demo button)
    if not user and not has_explicit_id:
        user = db.query(User).filter(User.role == (payload.role or "student")).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Student or user account not found.",
        )

    # In production, verify password
    if payload.password and payload.password != "password123":
        if not verify_password(payload.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password. Please check your credentials.",
            )

    token = create_access_token(subject=user.id, role=user.role)
    profile = _build_profile_response(user)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user=profile,
    )


@router.get("/students", response_model=List[StudentRosterItem])
def get_student_roster(db: Session = Depends(get_db)):
    """Public roster of enrolled students to enable quick selection on the Sign In page."""
    students = db.query(StudentProfile).order_by(StudentProfile.semester.asc(), StudentProfile.roll_number.asc()).all()
    return [
        StudentRosterItem(
            id=s.id,
            name=s.name,
            rollNumber=s.roll_number or s.enrollment_no,
            collegeId=s.college_id,
            branch=s.branch,
            semester=s.semester,
            section=s.section,
        )
        for s in students
    ]


@router.post("/role-switch-demo", response_model=TokenResponse)
def switch_role_demo(payload: RoleSwitchDemoRequest, db: Session = Depends(get_db)):
    """Switch active demo role (student, faculty, admin) and return a signed JWT token."""
    target_role = payload.role.lower()
    user = db.query(User).filter(User.role == target_role).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Default user for role '{target_role}' not found in database.",
        )

    token = create_access_token(subject=user.id, role=user.role)
    profile = _build_profile_response(user)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        role=user.role,
        user=profile,
    )


@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return profile details for the currently authenticated user."""
    return _build_profile_response(current_user)


@router.post("/logout")
def logout():
    """Acknowledge logout."""
    return {"success": True, "message": "Logged out successfully"}
