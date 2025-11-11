@echo off
echo ===============================================
echo Git Repository Setup Script
echo ===============================================
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
    echo [WARNING] This is already a Git repository!
    echo.
    set /p reinit="Do you want to reinitialize? This will preserve your history. (Y/N): "
    if /i not "%reinit%"=="Y" (
        echo Cancelled.
        pause
        exit /b 0
    )
) else (
    echo [INFO] Initializing new Git repository...
    git init
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to initialize Git repository
        pause
        exit /b 1
    )
    echo [OK] Git repository initialized
)

echo.
echo ===============================================
echo Setting up Git configuration
echo ===============================================
echo.

REM Get user information
set /p username="Enter your GitHub username: "
set /p email="Enter your email address: "

if "%username%"=="" (
    echo [ERROR] Username cannot be empty
    pause
    exit /b 1
)

if "%email%"=="" (
    echo [ERROR] Email cannot be empty
    pause
    exit /b 1
)

REM Configure Git
echo.
echo Configuring Git user information...
git config user.name "%username%"
git config user.email "%email%"

echo [OK] Git user configured
echo    Name: %username%
echo    Email: %email%
echo.

REM Set default branch to main
echo Setting default branch to 'main'...
git branch -M main
echo [OK] Default branch set to 'main'
echo.

REM Check if .gitignore exists
if not exist .gitignore (
    echo [WARNING] .gitignore file not found!
    echo Please make sure you have a .gitignore file before committing.
    echo.
)

REM Add all files
echo ===============================================
echo Adding files to Git
echo ===============================================
echo.

echo Files that will be added:
git add -n .
echo.

set /p continue="Do you want to add these files? (Y/N): "
if /i not "%continue%"=="Y" (
    echo Cancelled. You can manually add files with: git add .
    pause
    exit /b 0
)

echo.
echo Adding files...
git add .

if %errorlevel% neq 0 (
    echo [ERROR] Failed to add files
    pause
    exit /b 1
)

echo [OK] Files added to staging area
echo.

REM Check status
echo Current Git status:
git status --short
echo.

REM Initial commit
echo ===============================================
echo Creating initial commit
echo ===============================================
echo.

set /p commit_msg="Enter commit message (or press Enter for default): "
if "%commit_msg%"=="" (
    set commit_msg=Initial commit: Resume Parser project setup
)

echo.
echo Creating commit with message: "%commit_msg%"
git commit -m "%commit_msg%"

if %errorlevel% neq 0 (
    echo [WARNING] Commit failed. This might be because there are no changes.
    echo.
) else (
    echo [OK] Initial commit created successfully
    echo.
)

REM Remote repository setup
echo ===============================================
echo Remote Repository Setup
echo ===============================================
echo.
echo To push your code to GitHub, you need to create a repository first:
echo.
echo 1. Go to: https://github.com/new
echo 2. Create a new repository named 'resumeparser'
echo 3. Do NOT initialize with README, .gitignore, or license
echo 4. Copy the repository URL
echo.

set /p setup_remote="Have you created a GitHub repository? (Y/N): "
if /i not "%setup_remote%"=="Y" (
    echo.
    echo You can add remote later with:
    echo    git remote add origin https://github.com/%username%/resumeparser.git
    echo    git push -u origin main
    echo.
    goto :finish
)

echo.
set /p repo_url="Enter your GitHub repository URL: "

if "%repo_url%"=="" (
    echo [ERROR] Repository URL cannot be empty
    goto :finish
)

REM Add remote
echo.
echo Adding remote repository...
git remote remove origin >nul 2>&1
git remote add origin %repo_url%

if %errorlevel% neq 0 (
    echo [ERROR] Failed to add remote repository
    echo.
    echo Please check the URL and try manually:
    echo    git remote add origin %repo_url%
    echo.
    goto :finish
)

echo [OK] Remote repository added
echo.

REM Push to GitHub
echo ===============================================
echo Pushing to GitHub
echo ===============================================
echo.

set /p push_now="Do you want to push to GitHub now? (Y/N): "
if /i not "%push_now%"=="Y" (
    echo.
    echo You can push later with: git push -u origin main
    echo.
    goto :finish
)

echo.
echo Pushing to GitHub...
echo This may take a moment...
echo.

git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push to GitHub
    echo.
    echo Common issues:
    echo 1. Authentication failed - Set up Git credentials or SSH key
    echo 2. Repository doesn't exist - Create it on GitHub first
    echo 3. Branch name mismatch - Make sure remote expects 'main' branch
    echo.
    echo Try manually: git push -u origin main
    echo.
    goto :finish
)

echo.
echo [SUCCESS] Code pushed to GitHub!
echo.
echo Your repository: %repo_url%
echo.

:finish
echo ===============================================
echo Setup Complete!
echo ===============================================
echo.
echo Your Git repository is ready!
echo.
echo Next steps:
echo 1. Review files with: git status
echo 2. Make changes and commit: git add . && git commit -m "message"
echo 3. Push changes: git push
echo.
echo Useful Git commands:
echo   git status          - Check repository status
echo   git log             - View commit history
echo   git branch          - List branches
echo   git pull            - Pull latest changes
echo   git push            - Push your changes
echo.
echo Documentation:
echo   README.md           - Project overview
echo   CONTRIBUTING.md     - Contribution guidelines
echo   .gitignore          - Ignored files list
echo.
echo GitHub repository: https://github.com/%username%/resumeparser
echo.
pause
