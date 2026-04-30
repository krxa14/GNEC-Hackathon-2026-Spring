@echo off
:: ShadowFile — Windows launcher
:: Double-click this file to start the app

title ShadowFile Setup

echo.
echo ShadowFile — local setup
echo ────────────────────────────
echo.

:: ── 1. Node.js ───────────────────────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found.
    echo.
    echo Install it from https://nodejs.org ^(LTS version^)
    echo then double-click this file again.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js %%v

:: ── 2. npm install ───────────────────────────────────────────────────────────
if not exist "node_modules\" (
    echo [->] Installing dependencies ^(first run only^)...
    call npm install --silent
)
echo [OK] Dependencies installed

:: ── 3. Ollama ────────────────────────────────────────────────────────────────
set USE_OLLAMA=0
set OLLAMA_MODEL=llama3.1:8b

where ollama >nul 2>&1
if not errorlevel 1 (
    set USE_OLLAMA=1
    echo [OK] Ollama found

    echo [->] Checking model: %OLLAMA_MODEL%
    ollama list | findstr /i "%OLLAMA_MODEL%" >nul 2>&1
    if errorlevel 1 (
        echo [->] Pulling model: %OLLAMA_MODEL% ^(one-time download^)...
        ollama pull %OLLAMA_MODEL%
    )
    echo [OK] Model ready: %OLLAMA_MODEL%

    curl -s http://localhost:11434 >nul 2>&1
    if errorlevel 1 (
        echo [->] Starting Ollama...
        start /b ollama serve
        timeout /t 2 /nobreak >nul
    )
    echo [OK] Ollama running
) else (
    echo [WARN] Ollama not found - will use OpenRouter cloud API
    echo        For offline use: install Ollama from https://ollama.com
)

:: ── 4. .env.local ────────────────────────────────────────────────────────────
if not exist ".env.local" (
    copy .env.example .env.local >nul

    if %USE_OLLAMA%==1 (
        powershell -Command "(gc .env.local) -replace '^OLLAMA_BASE_URL=.*', 'OLLAMA_BASE_URL=http://localhost:11434/v1' | Set-Content .env.local"
        echo [OK] .env.local configured for Ollama
    ) else (
        echo.
        echo [ACTION NEEDED] No .env.local found.
        echo   1. Sign up free at https://openrouter.ai
        echo   2. Create a key ^(no credit card required^)
        echo   3. Open .env.local in Notepad and set OPENROUTER_API_KEY=your_key
        echo.
        pause
    )
) else (
    echo [OK] .env.local exists
)

:: ── 5. Launch ────────────────────────────────────────────────────────────────
echo.
echo Starting ShadowFile...
echo Opening http://localhost:5173
echo Press Ctrl+C to stop.
echo.

:: Open browser after delay
start "" timeout /t 2 /nobreak >nul & start http://localhost:5173

call npm run dev
pause
