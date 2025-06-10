# EduQGen 🎓

**EduQGen** (Educational Question Generator) is an AI-powered system that automatically generates question papers based on the university syllabus, previous year question papers, and deep semantic understanding of the content. It is specifically built for SPPU (Savitribai Phule Pune University), but can be extended to other universities.

This project aims to help teachers and exam coordinators reduce manual work and create new, relevant, and diverse sets of exam questions quickly using Machine Learning (ML), Natural Language Processing (NLP), and Deep Learning (DL) techniques.

---

## 🚀 Features

- 📄 **Automated Question Generation** from syllabus and previous papers  
- 🤖 AI/ML-based system using advanced NLP techniques  
- 📚 Syllabus-driven and Bloom’s taxonomy-aligned questions  
- 🎯 Filter questions by difficulty, type, and unit/module  
- 🧠 Deep learning integration for contextual question generation  
- 🛠️ REST API built with FastAPI  
- 🌐 Streamlit-based interactive frontend  
- 🗃️ SQLite database to store and manage questions  

---

## 🧱 Project Structure

```
EduQGen/
├── backend/                  # FastAPI backend
│   ├── main.py               # Main FastAPI app
│   ├── model.py              # Pydantic models
│   ├── generator.py          # AI-based question generator logic
│   ├── utils.py              # Utility functions
│   └── database.db           # SQLite DB
├── frontend/                 # Streamlit frontend
│   ├── app.py                # Main Streamlit UI
│   └── pages/                # Extra pages (if any)
├── data/                     # Contains syllabus & question paper data
│   ├── syllabus.csv
│   └── previous_questions.csv
├── requirements.txt
├── README.md
└── .gitignore
```

---

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/nvs0108/EduQGen.git
cd EduQGen
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## ⚙️ Running the Project

### Start FastAPI Backend

```bash
cd backend
uvicorn main:app --reload
```

Visit: `http://127.0.0.1:8000/docs` for interactive Swagger UI to test API.

### Start Streamlit Frontend

In a new terminal:

```bash
cd frontend
streamlit run app.py
```

Visit: `http://localhost:8501` for the web interface.

---

## 📦 Example API Usage

### Generate Questions (cURL)

```bash
curl -X POST "http://127.0.0.1:8000/generate" \
     -H "Content-Type: application/json" \
     -d '{"subject": "Data Structures", "unit": "Stack and Queue", "num_questions": 5}'
```

Response:

```json
{
  "questions": [
    "What is a stack? Explain its operations with examples.",
    "Differentiate between stack and queue with real-life applications.",
    ...
  ]
}
```

---

## 🧪 Testing

You can test API endpoints via Swagger UI:

```
http://127.0.0.1:8000/docs
```

Or manually test via Postman or cURL.

---

## 🧠 Technologies Used

- **Python 3.8+**
- **FastAPI** – API development
- **Streamlit** – UI frontend
- **scikit-learn, NLTK, spaCy** – NLP pipeline
- **SQLite** – Local database
- **pandas, NumPy** – Data processing

---

## 🔮 Future Enhancements

- Add **MCQ** and **True/False** generation support  
- Enhance NLP pipeline with **transformers**  
- Deploy via **Docker**, **Render**, or **Heroku**  
- Add **admin dashboard** to manage question bank  
- Support uploading syllabus PDFs directly  

---

## 🙌 Contributors

- **Nitin Vishwakarma** – [nvs0108](https://github.com/nvs0108)

Contributions are welcome! Please feel free to submit pull requests or create issues for any feature suggestions or bugs.

---

## 📄 License

This project is licensed under the MIT License.

---

## 📬 Contact

For queries, reach out at: **nvs0108@gmail.com**

---

**EduQGen** – Revolutionizing the way educational question papers are created using the power of AI. 🚀
