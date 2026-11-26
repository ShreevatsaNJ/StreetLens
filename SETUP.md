# StreetLens — Pre-Development Setup Guide
### Prerequisites & Step-by-Step Environment Initialization

Before writing feature code, complete these setup steps to ensure your development environment, database, and libraries are ready.

---

## 1. System Prerequisites Checklist

Ensure these tools are installed on your machine:

- [ ] **Python 3.10+** (Verify in terminal: `python --version`)
- [ ] **Node.js (v18+ or v20+ LTS)** (Verify in terminal: `node -v` and `npm -v`)
- [ ] **Git** (Verify: `git --version`)
- [ ] **PostgreSQL**:
  - *Option A (Local):* Installed locally with pgAdmin or psql running on port `5432`.
  - *Option B (Cloud / Zero Install):* Free [Supabase](https://supabase.com) PostgreSQL database.

---

## 2. Project Directory Scaffolding

Set up this clean directory layout inside your `StreetLens` folder:

```text
StreetLens/
├── backend/
│   ├── models/            # Storing YOLO weights (.pt files)
│   ├── storage/
│   │   ├── uploads/       # Incoming raw images and videos
│   │   ├── enhanced/      # OpenCV enhanced outputs
│   │   ├── annotated/     # Output images with bounding boxes
│   │   └── reports/       # Generated PDF and CSV files
│   ├── .env               # Database credentials and configuration
│   └── requirements.txt   # Python package dependencies
├── frontend/              # React + Vite application
├── assets/                # Presentation diagrams and project icons
├── StreetLens_System_Architecture.md
├── TODO.md
└── SETUP.md
```

---

## 3. Backend Setup (Flask & AI Environment)

### Step 3.1: Create & Activate Virtual Environment
Open PowerShell inside the project root:
```powershell
# Navigate to backend (create if not exists)
mkdir backend
cd backend

# Create isolated Python environment
python -m venv venv

# Activate it (Windows)
.\venv\Scripts\activate
```
*(You will see `(venv)` in your terminal prompt).*

---

### Step 3.2: Create `requirements.txt`
In `backend/requirements.txt`, include:
```text
# Web Framework & API
flask
flask-cors
werkzeug
pydantic
python-dotenv

# Computer Vision & Deep Learning
torch
torchvision
ultralytics
opencv-python
pillow
piexif

# Math & Data Processing
numpy
pandas

# Database (PostgreSQL + ORM)
flask-sqlalchemy
psycopg2-binary

# Reporting & PDF Export
reportlab

# Testing
pytest
```

---

### Step 3.3: Install Backend Packages
Run with your virtual environment active:
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 4. Database Setup (PostgreSQL)

### Step 4.1: Create the Database
In pgAdmin or terminal `psql`:
```sql
CREATE DATABASE streetlens_db;
```

### Step 4.2: Configure Environment Variables
Create a file named `.env` inside `/backend`:
```env
FLASK_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/streetlens_db
SECRET_KEY=streetlens-super-secret-key-2026
```

---

## 5. Frontend Setup (React + Vite + Tailwind)

Open a separate terminal window at the project root:

### Step 5.1: Create React App with Vite
```powershell
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### Step 5.2: Install Styling & Icons
```powershell
# Tailwind CSS setup
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# UI Icons & Navigation
npm install lucide-react react-router-dom axios
```

### Step 5.3: Install Charts & Maps
```powershell
# Dashboard charts
npm install recharts

# Interactive Map
npm install leaflet react-leaflet
```

### Step 5.4: Configure Tailwind
In `frontend/tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

In `frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 6. AI Model Checkpoint (YOLO Weights)

- [ ] Place initial baseline weights or custom fine-tuned weights inside `backend/models/`:
  - `yolov8s.pt` (Small YOLOv8 model for testing)
  - or `best_road_damage.pt` (Trained on road defects: potholes, cracks).

---

## 7. Pre-Flight Verification Checklist

Before writing code for Feature 1, verify that both servers start cleanly:

- [ ] **Backend Test:** Run a test script in `/backend` to confirm PyTorch, OpenCV, and PostgreSQL connect without errors.
- [ ] **Frontend Test:** Run `npm run dev` in `/frontend` $\rightarrow$ verify page opens at `http://localhost:5173`.
- [ ] **Database Test:** Confirm connection to `streetlens_db` via SQLAlchemy.
