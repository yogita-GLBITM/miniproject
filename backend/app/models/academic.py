import json
from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base


class Subject(Base):
    __tablename__ = "subjects"

    code = Column(String(32), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    short_name = Column(String(32), nullable=True)
    credits = Column(Integer, default=4)
    type = Column(String(32), default="Theory")
    department = Column(String(128), default="Computer Science & Engineering")
    semester = Column(String(32), default="Semester VI")
    faculty_name = Column(String(128), nullable=True)
    faculty_id = Column(String(64), nullable=True)
    color_code = Column(String(32), default="#2563eb")
    description = Column(Text, nullable=True)
    syllabus_json = Column(Text, nullable=True)

    @property
    def syllabus(self):
        if not self.syllabus_json:
            return []
        try:
            return json.loads(self.syllabus_json)
        except Exception:
            return []

    @syllabus.setter
    def syllabus(self, value):
        self.syllabus_json = json.dumps(value) if value else "[]"


class SubjectMarks(Base):
    __tablename__ = "subject_marks"

    id = Column(String(64), primary_key=True, index=True)
    student_id = Column(String(64), ForeignKey("student_profiles.id"), nullable=False, index=True)
    subject_code = Column(String(32), nullable=False, index=True)
    subject_name = Column(String(128), nullable=False)
    credits = Column(Integer, default=4)
    faculty_name = Column(String(128), nullable=True)
    
    sessional1_scored = Column(Float, default=0.0)
    sessional1_max = Column(Float, default=30.0)
    sessional2_scored = Column(Float, default=0.0)
    sessional2_max = Column(Float, default=30.0)
    quizzes_scored = Column(Float, default=0.0)
    quizzes_max = Column(Float, default=10.0)
    assignments_scored = Column(Float, default=0.0)
    assignments_max = Column(Float, default=10.0)
    practicals_scored = Column(Float, default=0.0)
    practicals_max = Column(Float, default=20.0)

    grade_projected = Column(String(8), default="B+")
    trend = Column(String(16), default="stable")  # up, down, stable
    change_percentage = Column(Float, default=0.0)

    student = relationship("StudentProfile", back_populates="subject_marks")

    @property
    def total_percentage(self) -> float:
        total_scored = (
            (self.sessional1_scored or 0.0) +
            (self.sessional2_scored or 0.0) +
            (self.quizzes_scored or 0.0) +
            (self.assignments_scored or 0.0) +
            (self.practicals_scored or 0.0)
        )
        total_max = (
            (self.sessional1_max or 30.0) +
            (self.sessional2_max or 30.0) +
            (self.quizzes_max or 10.0) +
            (self.assignments_max or 10.0) +
            (self.practicals_max or 20.0)
        )
        if total_max <= 0:
            return 0.0
        return round((total_scored / total_max) * 100.0, 1)


class TimetableSlotModel(Base):
    __tablename__ = "timetable_slots"

    id = Column(String(64), primary_key=True, index=True)
    day = Column(String(32), nullable=False, index=True)  # Monday, Tuesday, ...
    time = Column(String(64), nullable=False)            # "09:00 AM – 09:50 AM"
    start_time = Column(String(16), nullable=False)      # "09:00"
    end_time = Column(String(16), nullable=False)        # "09:50"
    subject_code = Column(String(32), nullable=False)
    subject_name = Column(String(128), nullable=False)
    faculty_name = Column(String(128), nullable=False)
    room = Column(String(64), nullable=False)
    type = Column(String(32), default="Lecture")         # Lecture, Lab, Tutorial
    semester = Column(String(32), default="Semester VI")
    section = Column(String(32), default="CSE-3B")
