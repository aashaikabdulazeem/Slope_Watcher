@echo off
echo ===================================================================
echo   LandSlide Sentinel - Cloud Deployment Assistant
echo ===================================================================
echo.
echo Step 1: Push your code to GitHub
echo -------------------------------------------------------------------
echo   1. Create a new repository on GitHub: https://github.com/new
echo      (Name it e.g. "landslide-sentinel")
echo.
echo   2. Run these two commands to push your project:
echo      git remote add origin https://github.com/YOUR_USERNAME/landslide-sentinel.git
echo      git push -u origin master
echo.
echo Step 2: Deploy Backend to Render (Free Web Service)
echo -------------------------------------------------------------------
echo   1. Go to https://dashboard.render.com/blueprints
echo   2. Click "New Blueprint Instance" and select your GitHub repo.
echo   3. Render will automatically read "render.yaml" and configure:
echo      - Build: pip install -r backend/requirements.txt && python backend/ml/train.py && python -m backend.database.seed
echo      - Start: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
echo   4. Click "Apply". Your backend URL will be e.g.:
echo      https://landslide-sentinel-backend.onrender.com
echo.
echo Step 3: Deploy Frontend to Vercel (Free Static Site)
echo -------------------------------------------------------------------
echo   Option A (via Vercel Dashboard):
echo   1. Go to https://vercel.com/new
echo   2. Import your GitHub repository.
echo   3. Set Root Directory to: frontend
echo   4. Under "Environment Variables", add:
echo      VITE_API_URL = https://your-backend.onrender.com/api
echo      VITE_WS_URL  = wss://your-backend.onrender.com/ws
echo   5. Click "Deploy".
echo.
echo   Option B (via Vercel CLI):
echo   Run: cd frontend && npx vercel
echo ===================================================================
pause
