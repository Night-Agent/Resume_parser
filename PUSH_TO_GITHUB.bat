@echo off
echo ===============================================
echo Push to Your GitHub Repository
echo ===============================================
echo.
echo Repository: https://github.com/unknown0149/Resume_parser.git
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo.
    echo Please install Git from: https://git-scm.com/downloads
    echo.
    pause
    exit /b 1
)

echo [OK] Git is installed
echo.

REM Check if already a Git repository
if exist .git (
    echo [INFO] Git repository already exists
    echo.
) else (
    echo [INFO] Initializing Git repository...
    git init
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to initialize Git repository
        pause
        exit /b 1
    )
    echo [OK] Git repository initialized
    echo.
)

REM Configure Git user (if not already configured)
echo ===============================================
echo Configuring Git User
echo ===============================================
echo.

git config user.name >nul 2>&1
if %errorlevel% neq 0 (
    set /p username="Enter your GitHub username (unknown0149): "
    if "%username%"=="" set username=unknown0149
    git config user.name "%username%"
    echo [OK] Username set to: %username%
)

git config user.email >nul 2>&1
if %errorlevel% neq 0 (
    set /p email="Enter your email address: "
    if not "%email%"=="" (
        git config user.email "%email%"
        echo [OK] Email set to: %email%
    )
)

echo.
echo Current Git configuration:
git config user.name
git config user.email
echo.

REM Set default branch to main
echo ===============================================
echo Setting Default Branch
echo ===============================================
echo.
git branch -M main
echo [OK] Default branch set to 'main'
echo.

REM Check if remote exists
echo ===============================================
echo Configuring Remote Repository
echo ===============================================
echo.

git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Remote 'origin' already exists
    set /p update="Do you want to update it? (Y/N): "
    if /i "%update%"=="Y" (
        git remote remove origin
        git remote add origin https://github.com/unknown0149/Resume_parser.git
        echo [OK] Remote updated
    )
) else (
    echo [INFO] Adding remote repository...
    git remote add origin https://github.com/unknown0149/Resume_parser.git
    echo [OK] Remote 'origin' added
)

echo.
echo Current remote:
git remote -v
echo.

REM Check for sensitive files
echo ===============================================
echo Security Check
echo ===============================================
echo.

if exist backend\.env (
    echo [WARNING] .env file detected
    findstr /C:".env" .gitignore >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] .env is NOT in .gitignore!
        echo.
        echo This is DANGEROUS! Your secrets will be exposed!
        echo.
        set /p fix="Add .env to .gitignore? (Y/N): "
        if /i "%fix%"=="Y" (
            echo backend/.env >> .gitignore
            echo .env >> .gitignore
            echo [OK] .env added to .gitignore
        ) else (
            echo [WARNING] Proceeding without protection - BE CAREFUL!
        )
    ) else (
        echo [OK] .env is protected by .gitignore
    )
) else (
    echo [INFO] No .env file found
)

echo.

REM Show files that will be added
echo ===============================================
echo Files to be Added
echo ===============================================
echo.
echo Checking what will be committed...
git status --short 2>nul
if %errorlevel% neq 0 (
    echo (No existing commits yet)
)
echo.

set /p continue="Do you want to continue? (Y/N): "
if /i not "%continue%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

REM Add all files
echo.
echo ===============================================
echo Adding Files
echo ===============================================
echo.

echo Adding files to Git...
git add .

if %errorlevel% neq 0 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)

echo [OK] Files added successfully
echo.

REM Check if there are changes to commit
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo [INFO] No changes to commit
    echo.
    set /p force_push="Do you want to push existing commits? (Y/N): "
    if /i not "%force_push%"=="Y" (
        echo Cancelled.
        pause
        exit /b 0
    )
    goto push_step
)

REM Create commit
echo ===============================================
echo Creating Commit
echo ===============================================
echo.

set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    set commit_msg=Initial commit: AI-Powered Resume Parser
)

echo.
echo Creating commit: "%commit_msg%"
git commit -m "%commit_msg%"

if %errorlevel% neq 0 (
    echo [ERROR] Commit failed
    pause
    exit /b 1
)

echo [OK] Commit created successfully
echo.

:push_step
REM Push to GitHub
echo ===============================================
echo Pushing to GitHub
echo ===============================================
echo.
echo Repository: https://github.com/unknown0149/Resume_parser.git
echo Branch: main
echo.

echo [INFO] This will push your code to GitHub...
echo.

set /p push_now="Ready to push? (Y/N): "
if /i not "%push_now%"=="Y" (
    echo.
    echo Cancelled. You can push later with:
    echo    git push -u origin main
    echo.
    pause
    exit /b 0
)

echo.
echo Pushing to GitHub...
echo Please wait...
echo.

git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed!
    echo.
    echo Common issues:
    echo.
    echo 1. AUTHENTICATION FAILED:
    echo    - GitHub no longer accepts password authentication
    echo    - You need to use Personal Access Token (PAT)
    echo.
    echo    How to fix:
    echo    a) Go to: https://github.com/settings/tokens
    echo    b) Click "Generate new token (classic)"
    echo    c) Select scopes: repo (all)
    echo    d) Copy the token
    echo    e) Use token as password when prompted
    echo.
    echo 2. REPOSITORY DOESN'T EXIST:
    echo    - Make sure you created the repository on GitHub
    echo    - Go to: https://github.com/new
    echo.
    echo 3. PERMISSION DENIED:
    echo    - Make sure you own the repository
    echo    - Or have write access to it
    echo.
    echo 4. UPDATES WERE REJECTED:
    echo    - Repository has commits you don't have locally
    echo    - Run: git pull origin main --rebase
    echo    - Then: git push -u origin main
    echo.
    echo ==========================================
    echo EASIEST FIX - Use Personal Access Token:
    echo ==========================================
    echo.
    echo 1. Go to: https://github.com/settings/tokens
    echo 2. Click: "Generate new token (classic)"
    echo 3. Name: "Resume Parser"
    echo 4. Select scopes: ✓ repo
    echo 5. Click: "Generate token"
    echo 6. COPY THE TOKEN (you won't see it again!)
    echo.
    echo Then try again and use token as password
    echo.
    echo Or set up credential helper:
    echo    git config --global credential.helper wincred
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================
echo SUCCESS! 🎉
echo ===============================================
echo.
echo Your code has been pushed to GitHub!
echo.
echo Repository: https://github.com/unknown0149/Resume_parser
echo.
echo Next steps:
echo 1. Visit your repository: https://github.com/unknown0149/Resume_parser
echo 2. Add repository description and topics
echo 3. Update README.md with your info
echo 4. Set up branch protection rules
echo.
echo Future commits:
echo   git add .
echo   git commit -m "your message"
echo   git push
echo.
pause
