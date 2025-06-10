from fastapi import FastAPI, Depends, HTTPException, status, Body, Response, File, UploadFile, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey, Float, Table, Text, DateTime, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import os
import json
import datetime
import io
from jose import JWTError, jwt
from passlib.context import CryptContext
import enum
from dotenv import load_dotenv
from question_generator import QuestionGenerator
import PyPDF2  # For PDF processing

# Load environment variables
load_dotenv()

# Constants
SECRET_KEY = os.getenv("SECRET_KEY", "SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Database setup
# Using SQLite for local development
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./eduqgen.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize the question generators
openai_api_key = os.getenv("OPENAI_KEY")
openai_generator = QuestionGenerator(use_openai=True, openai_api_key=openai_api_key)
nltk_generator = QuestionGenerator(use_openai=False)

if not openai_api_key:
    print("Warning: OPENAI_KEY environment variable not set. OpenAI generation may not work properly.")

# Create FastAPI app instance
app = FastAPI(title="EduQGen API", description="API for generating educational questions")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enums
class TaxonomyLevel(str, enum.Enum):
    REMEMBER = "remember"
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"

class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EDUCATOR = "educator"
    ASSISTANT = "assistant"

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String, default="educator")
    institution = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    educational_level = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Add created_by field
    
    topics = relationship("Topic", back_populates="subject")
    questions = relationship("Question", back_populates="subject")
    creator = relationship("User")  # Add relationship to User

class Topic(Base):
    __tablename__ = "topics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Add created_by field
    
    subject = relationship("Subject", back_populates="topics")
    subtopics = relationship("Subtopic", back_populates="topic")
    questions = relationship("Question", back_populates="topic")
    creator = relationship("User")  # Add relationship to User

class Subtopic(Base):
    __tablename__ = "subtopics"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    
    topic = relationship("Topic", back_populates="subtopics")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    answer = Column(Text)
    explanation = Column(Text, nullable=True)
    bloom_taxonomy_level = Column(String)
    difficulty_level = Column(String)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    subtopic_id = Column(Integer, ForeignKey("subtopics.id"), nullable=True)
    tags = Column(JSON, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    is_verified = Column(Boolean, default=False)
    usage_count = Column(Integer, default=0)
    
    subject = relationship("Subject", back_populates="questions")
    topic = relationship("Topic", back_populates="questions")
    creator = relationship("User")

class QuestionSet(Base):
    __tablename__ = "question_sets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    institution_name = Column(String, nullable=True)
    header_info = Column(JSON, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    creator = relationship("User")
    questions = relationship("QuestionSetItem", back_populates="question_set")

class QuestionSetItem(Base):
    __tablename__ = "question_set_items"
    
    id = Column(Integer, primary_key=True, index=True)
    question_set_id = Column(Integer, ForeignKey("question_sets.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    order = Column(Integer)
    
    question_set = relationship("QuestionSet", back_populates="questions")
    question = relationship("Question")

class QuestionAnalytics(Base):
    __tablename__ = "question_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    usage_count = Column(Integer, default=0)
    difficulty_score = Column(Float, nullable=True)
    discrimination_index = Column(Float, nullable=True)
    average_response_time = Column(Integer, nullable=True)
    feedback_score = Column(Float, nullable=True)
    last_used = Column(DateTime, nullable=True)
    
    question = relationship("Question")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models for API
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: str = "educator"
    institution: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime
    
    class Config:
        orm_mode = True

class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    educational_level: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    created_by: Optional[int] = None
    
    class Config:
        orm_mode = True

class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    subject_id: int

class TopicCreate(TopicBase):
    pass

class TopicResponse(TopicBase):
    id: int
    created_by: Optional[int] = None
    
    class Config:
        orm_mode = True

class QuestionBase(BaseModel):
    content: str
    answer: str
    explanation: Optional[str] = None
    bloom_taxonomy_level: TaxonomyLevel
    difficulty_level: DifficultyLevel
    subject_id: int
    topic_id: Optional[int] = None
    subtopic_id: Optional[int] = None
    tags: Optional[List[str]] = None

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    created_by: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    is_verified: bool
    usage_count: int
    
    class Config:
        orm_mode = True

class QuestionSetBase(BaseModel):
    name: str
    description: Optional[str] = None
    institution_name: Optional[str] = None
    header_info: Optional[str] = None

class QuestionSetCreate(QuestionSetBase):
    question_ids: List[int]

class QuestionSetResponse(QuestionSetBase):
    id: int
    created_by: int
    created_at: datetime.datetime
    updated_at: datetime.datetime
    
    class Config:
        orm_mode = True

class QuestionGenRequest(BaseModel):
    subject_id: int
    topic_id: Optional[int] = None
    context: str
    taxonomy_levels: List[TaxonomyLevel]
    difficulty_levels: List[DifficultyLevel]
    num_questions: int = 10
    use_openai: bool = True  # Add this field with default True

class QuestionGenFileRequest(BaseModel):
    subject_id: int
    topic_id: Optional[int] = None
    taxonomy_levels: List[TaxonomyLevel]
    difficulty_levels: List[DifficultyLevel]
    num_questions: int = 10
    use_openai: bool = True  # Add this field with default True

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Update last login
    user.last_login = datetime.datetime.utcnow()
    db.commit()
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        institution=user.institution
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
async def read_auth_me(current_user: User = Depends(get_current_active_user)):
    """
    Get current authenticated user's details.
    """
    return current_user

@app.post("/subjects/", response_model=SubjectResponse)
async def create_subject(
    subject: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "educator"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db_subject = db.query(Subject).filter(Subject.name == subject.name).first()
    if db_subject:
        raise HTTPException(status_code=400, detail="Subject already exists")
    
    # Create a new subject with the current user as creator
    db_subject = Subject(
        **subject.dict(),
        created_by=current_user.id
    )
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@app.get("/subjects/", response_model=List[SubjectResponse])
async def get_subjects(
    my_subjects_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Subject)
    
    # Filter by current user if requested
    if my_subjects_only:
        query = query.filter(Subject.created_by == current_user.id)
    
    subjects = query.offset(skip).limit(limit).all()
    return subjects

@app.post("/topics/", response_model=TopicResponse)
async def create_topic(
    topic: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role not in ["admin", "educator"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Verify subject exists
    db_subject = db.query(Subject).filter(Subject.id == topic.subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Create a new topic with the current user as creator
    db_topic = Topic(
        **topic.dict(),
        created_by=current_user.id
    )
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic

@app.get("/topics/", response_model=List[TopicResponse])
async def get_topics(
    subject_id: Optional[int] = None,
    my_topics_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Topic)
    
    # Filter by subject if provided
    if subject_id:
        query = query.filter(Topic.subject_id == subject_id)
    
    # Filter by current user if requested
    if my_topics_only:
        query = query.filter(Topic.created_by == current_user.id)
    
    topics = query.offset(skip).limit(limit).all()
    return topics

@app.post("/questions/", response_model=QuestionResponse)
async def create_question(
    question: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify subject exists
    db_subject = db.query(Subject).filter(Subject.id == question.subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Verify topic if provided
    if question.topic_id:
        db_topic = db.query(Topic).filter(Topic.id == question.topic_id).first()
        if not db_topic:
            raise HTTPException(status_code=404, detail="Topic not found")
    
    # Verify subtopic if provided
    if question.subtopic_id:
        db_subtopic = db.query(Subtopic).filter(Subtopic.id == question.subtopic_id).first()
        if not db_subtopic:
            raise HTTPException(status_code=404, detail="Subtopic not found")
    
    db_question = Question(
        **question.dict(),
        created_by=current_user.id,
        is_verified=current_user.role == "admin"  # Auto-verify if admin
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@app.get("/questions/", response_model=List[QuestionResponse])
async def get_questions(
    subject_id: Optional[int] = None,
    topic_id: Optional[int] = None,
    bloom_level: Optional[TaxonomyLevel] = None,
    difficulty: Optional[DifficultyLevel] = None,
    verified_only: bool = False,
    my_questions_only: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Question)
    
    if subject_id:
        query = query.filter(Question.subject_id == subject_id)
    
    if topic_id:
        query = query.filter(Question.topic_id == topic_id)
    
    if bloom_level:
        query = query.filter(Question.bloom_taxonomy_level == bloom_level)
    
    if difficulty:
        query = query.filter(Question.difficulty_level == difficulty)
    
    if verified_only:
        query = query.filter(Question.is_verified == True)
    
    # Filter by current user if requested
    if my_questions_only:
        query = query.filter(Question.created_by == current_user.id)
    
    questions = query.offset(skip).limit(limit).all()
    return questions

@app.post("/questions/generate", response_model=List[QuestionResponse])
async def generate_questions(
    request: QuestionGenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify subject exists
    db_subject = db.query(Subject).filter(Subject.id == request.subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Verify topic if provided
    topic_name = None
    if request.topic_id:
        db_topic = db.query(Topic).filter(Topic.id == request.topic_id).first()
        if not db_topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        topic_name = db_topic.name
    
    # Select the appropriate generator based on use_openai parameter
    generator = openai_generator if request.use_openai else nltk_generator
    
    # Generate questions
    generated_questions = generator.generate_question_set(
        context=request.context,
        subject=db_subject.name,
        topic=topic_name,
        taxonomy_levels=[level.value for level in request.taxonomy_levels],
        difficulty_levels=[level.value for level in request.difficulty_levels],
        num_questions=request.num_questions
    )
    
    # Save questions to database
    db_questions = []
    for q in generated_questions:
        db_question = Question(
            content=q['question'],
            answer=q['answer'],
            bloom_taxonomy_level=q['taxonomy_level'],
            difficulty_level=q['difficulty'],
            subject_id=request.subject_id,
            topic_id=request.topic_id,
            created_by=current_user.id,
            is_verified=False  # Generated questions need verification
        )
        db.add(db_question)
        db_questions.append(db_question)
    
    db.commit()
    
    # Refresh to get IDs
    for q in db_questions:
        db.refresh(q)
    
    return db_questions

@app.post("/questions/generate-from-pdf", response_model=List[QuestionResponse])
async def generate_questions_from_pdf(
    file: UploadFile = File(...),
    subject_id: int = Form(...),
    topic_id: Optional[int] = Form(None),
    taxonomy_levels: str = Form(...),  # JSON string of taxonomy levels
    difficulty_levels: str = Form(...),  # JSON string of difficulty levels
    num_questions: int = Form(10),
    use_openai: bool = Form(True),  # Add this parameter with default True
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify subject exists
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Verify topic if provided
    topic_name = None
    if topic_id:
        db_topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not db_topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        topic_name = db_topic.name
    
    # Parse JSON strings to lists
    try:
        taxonomy_levels_list = json.loads(taxonomy_levels)
        difficulty_levels_list = json.loads(difficulty_levels)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Invalid JSON format for taxonomy_levels or difficulty_levels")
    
    # Process the uploaded PDF file
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Create a BytesIO object from the file contents
        pdf_file = io.BytesIO(contents)
        
        # Extract text from PDF
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        context_text = ""
        
        # Extract text from each page
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            context_text += page.extract_text() + "\n"
            context_text = "\n".join([
                line for line in context_text.splitlines()
                if not line.strip().lower().startswith(("subject code", "savitribai", "mrs.", "publication", "university"))
                and len(line.strip()) > 30
        ])
            
            

        
        if not context_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF file")
        
        # Select the appropriate generator based on use_openai parameter
        generator = openai_generator if use_openai else nltk_generator
        
        # Generate questions using the extracted text
        generated_questions = generator.generate_question_set(
            context=context_text,
            subject=db_subject.name,
            topic=topic_name,
            taxonomy_levels=taxonomy_levels_list,
            difficulty_levels=difficulty_levels_list,
            num_questions=num_questions
        )
        
        # Save questions to database
        db_questions = []
        for q in generated_questions:
            db_question = Question(
                content=q['question'],
                answer=q['answer'],
                bloom_taxonomy_level=q['taxonomy_level'],
                difficulty_level=q['difficulty'],
                subject_id=subject_id,
                topic_id=topic_id,
                created_by=current_user.id,
                is_verified=False  # Generated questions need verification
            )
            db.add(db_question)
            db_questions.append(db_question)
        
        db.commit()
        
        # Refresh to get IDs
        for q in db_questions:
            db.refresh(q)
        
        return db_questions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF file: {str(e)}")
@app.post("/question-sets/", response_model=QuestionSetResponse)
async def create_question_set(
    question_set: QuestionSetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Create question set
    db_question_set = QuestionSet(
        name=question_set.name,
        description=question_set.description,
        institution_name=question_set.institution_name,
        header_info=question_set.header_info,
        created_by=current_user.id
    )
    db.add(db_question_set)
    db.commit()
    db.refresh(db_question_set)
    
    # Add questions to set
    for i, question_id in enumerate(question_set.question_ids):
        # Verify question exists
        db_question = db.query(Question).filter(Question.id == question_id).first()
        if not db_question:
            raise HTTPException(status_code=404, detail=f"Question {question_id} not found")
        
        # Add to set
        db_item = QuestionSetItem(
            question_set_id=db_question_set.id,
            question_id=question_id,
            order=i
        )
        db.add(db_item)
        
        # Update usage count
        db_question.usage_count += 1
    
    db.commit()
    return db_question_set

@app.get("/question-sets/", response_model=List[QuestionSetResponse])
async def get_question_sets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(QuestionSet)
    
    # If not admin, only show own sets
    if current_user.role != "admin":
        query = query.filter(QuestionSet.created_by == current_user.id)
    
    question_sets = query.offset(skip).limit(limit).all()
    return question_sets

@app.get("/question-sets/{question_set_id}", response_model=dict)
async def get_question_set(
    question_set_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the question set
    question_set = db.query(QuestionSet).filter(QuestionSet.id == question_set_id).first()
    if not question_set:
        raise HTTPException(status_code=404, detail="Question set not found")
    
    # Check if user has access to this question set
    if current_user.role != "admin" and question_set.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get all questions in the set with their order
    question_items = db.query(QuestionSetItem).filter(
        QuestionSetItem.question_set_id == question_set_id
    ).order_by(QuestionSetItem.order).all()
    
    # Get the actual questions
    questions = []
    for item in question_items:
        question = db.query(Question).filter(Question.id == item.question_id).first()
        if question:
            question_dict = {
                "id": question.id,
                "content": question.content,
                "answer": question.answer,
                "explanation": question.explanation,
                "bloom_taxonomy_level": question.bloom_taxonomy_level,
                "difficulty_level": question.difficulty_level,
                "order": item.order
            }
            questions.append(question_dict)
    
    # Prepare the response
    result = {
        "id": question_set.id,
        "name": question_set.name,
        "description": question_set.description,
        "created_by": question_set.created_by,
        "created_at": question_set.created_at,
        "updated_at": question_set.updated_at,
        "questions": questions
    }
    
    return result

@app.get("/question-sets/{question_set_id}/export-pdf")
async def export_question_set_pdf(
    question_set_id: int,
    include_answers: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the question set
    question_set = db.query(QuestionSet).filter(QuestionSet.id == question_set_id).first()
    if not question_set:
        raise HTTPException(status_code=404, detail="Question set not found")
    
    # Check if user has access to this question set
    if current_user.role != "admin" and question_set.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get all questions in the set with their order
    question_items = db.query(QuestionSetItem).filter(
        QuestionSetItem.question_set_id == question_set_id
    ).order_by(QuestionSetItem.order).all()
    
    # Get the actual questions
    questions = []
    for item in question_items:
        question = db.query(Question).filter(Question.id == item.question_id).first()
        if question:
            question_dict = {
                "id": question.id,
                "content": question.content,
                "answer": question.answer if include_answers else None,
                "explanation": question.explanation if include_answers else None,
                "bloom_taxonomy_level": question.bloom_taxonomy_level,
                "difficulty_level": question.difficulty_level,
                "order": item.order
            }
            questions.append(question_dict)
    
    try:
        # Import ReportLab components for PDF generation
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.units import inch
        
        # Create a file-like object to receive PDF data
        buffer = io.BytesIO()
        
        # Create the PDF document using ReportLab
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72,
            title=f"Question Set: {question_set.name}"
        )
        
        # Container for the 'Flowable' objects
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        heading2_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Add custom styles
        question_style = ParagraphStyle(
            'QuestionStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=12,
            leading=14,
            spaceAfter=6
        )
        
        answer_style = ParagraphStyle(
            'AnswerStyle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=11,
            leftIndent=20,
            leading=14
        )
        
        # Add institution name if available
        if question_set.institution_name:
            elements.append(Paragraph(f"{question_set.institution_name}", title_style))
            elements.append(Spacer(1, 0.15 * inch))
        
        # Add header info if available
        if question_set.header_info:
            elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
            header_text = question_set.header_info.replace("\n", "<br/>")
            elements.append(Paragraph(f"{header_text}", normal_style))
            elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
            elements.append(Spacer(1, 0.15 * inch))
        
        # Add separator line
        elements.append(Paragraph("<hr/>", normal_style))
        elements.append(Spacer(1, 0.15 * inch))
        
        # Add title
        # elements.append(Paragraph(f"Question Set: {question_set.name}", title_style))
        # elements.append(Spacer(1, 0.25 * inch))
        
        # Add description if available
        if question_set.description:
            elements.append(Paragraph(f"Note: {question_set.description}", normal_style))
            elements.append(Spacer(1, 0.25 * inch))
            
        # Add separator line
        elements.append(Paragraph("<hr/>", normal_style))
        elements.append(Spacer(1, 0.15 * inch))
        
        # Add questions heading
        elements.append(Paragraph("Questions:", heading2_style))
        elements.append(Spacer(1, 0.15 * inch))
        
        # Add each question
        for i, q in enumerate(questions):
            # Calculate marks based on taxonomy level and difficulty
            marks = 0
            
            # Taxonomy level marks
            taxonomy_marks = {
                "remember": 1,
                "understand": 2,
                "apply": 3,
                "analyze": 4,
                "evaluate": 5,
                "create": 6
            }
            
            # Difficulty level multiplier
            difficulty_multiplier = {
                "easy": 1,
                "medium": 1.5,
                "hard": 2
            }
            
            # Calculate marks
            base_marks = taxonomy_marks.get(q['bloom_taxonomy_level'].lower(), 1)
            multiplier = difficulty_multiplier.get(q['difficulty_level'].lower(), 1)
            marks = int(base_marks * multiplier)
            
            # Question number, content and marks
            elements.append(Paragraph(f"<b>{i+1}. {q['content']}</b>  <i>[{marks} M]</i>", question_style))
            
            # Add a separator line between question and answer
            elements.append(Paragraph("<hr width='50%' align='left'/>", normal_style))
            
            # Answer if included
            if include_answers and q['answer']:
                elements.append(Paragraph(f"<b>Answer:</b> {q['answer']}", answer_style))
            
            # Explanation if included
            if include_answers and q['explanation']:
                elements.append(Paragraph(f"<b>Explanation:</b> {q['explanation']}", answer_style))
            
            # Metadata
            elements.append(Paragraph(f"<b>BL - (L{base_marks}):</b> {q['bloom_taxonomy_level']}", answer_style))
            elements.append(Paragraph(f"<b>Difficulty:</b> {q['difficulty_level']}", answer_style))
            elements.append(Spacer(1, 0.2 * inch))
        
        # Build the PDF document
        doc.build(elements)
        
        # Get the value of the BytesIO buffer and write it to the response
        buffer.seek(0)
        
        # Return the PDF as a downloadable response
        filename = f"question_set_{question_set_id}.pdf"
        
        return StreamingResponse(
            buffer, 
            media_type="application/pdf",
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )
    
    except ImportError:
        # Fallback to text if ReportLab is not available
        print("Warning: ReportLab not installed. Falling back to text format.")
        
        # Generate text content as before
        content = ""
        
        # Add institution name if available
        if question_set.institution_name:
            content += f"{question_set.institution_name}\n\n"
        
        # Add header info if available
        if question_set.header_info:
            # for key, value in question_set.header_info.items():
            content += f"{question_set.header_info}\n"
            content += "\n"
        
        content += "-" * 50 + "\n\n"
        
        content += f"Question Set: {question_set.name}\n\n"
        if question_set.description:
            content += f"Description: {question_set.description}\n\n"
        
        content += "-" * 50 + "\n\n"
        
        content += "Questions:\n\n"
        
        for i, q in enumerate(questions):
            # Calculate marks based on taxonomy level and difficulty
            taxonomy_marks = {
                "remember": 1,
                "understand": 2,
                "apply": 3,
                "analyze": 4,
                "evaluate": 5,
                "create": 6
            }
            
            difficulty_multiplier = {
                "easy": 1,
                "medium": 1.5,
                "hard": 2
            }
            
            base_marks = taxonomy_marks.get(q['bloom_taxonomy_level'].lower(), 1)
            multiplier = difficulty_multiplier.get(q['difficulty_level'].lower(), 1)
            marks = int(base_marks * multiplier)
            
            content += f"{i+1}. {q['content']} [{marks} marks]\n"
            content += "   " + "-" * 30 + "\n"
            if include_answers and q['answer']:
                content += f"   Answer: {q['answer']}\n"
            if include_answers and q['explanation']:
                content += f"   Explanation: {q['explanation']}\n"
            content += f"   Taxonomy Level: {q['bloom_taxonomy_level']}\n"
            content += f"   Difficulty: {q['difficulty_level']}\n\n"
        
        # Return as text file
        filename = f"question_set_{question_set_id}.txt"
        
        return StreamingResponse(
            io.StringIO(content), 
            media_type="text/plain",
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )

# Main function to run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)