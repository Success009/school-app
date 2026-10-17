#!/usr/bin/env bash
# deploy.sh - Comprehensive build, test, commit, and deployment script
set -e

COMMIT_MSG="${1:-Auto-deploy: Updates and verified unit tests}"

echo -e "\033[35m=== STEP 1: RUNNING CODE VALIDATION & TESTS ===\033[0m"
node tests/runner.js

echo -e "\n\033[35m=== STEP 2: STAGING AND COMMITTING CODE ===\033[0m"
git status --short
git add -A

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo -e "\033[33mNo uncommitted changes detected. Skipping commit.\033[0m"
else
    git commit -m "$COMMIT_MSG"
    echo -e "\033[32m✔ Commit successful: '$COMMIT_MSG'\033[0m"
fi

echo -e "\n\033[35m=== STEP 3: REMOTE SYNC (OPTIONAL / PRODUCTION) ===\033[0m"
if [[ "$*" == *"--push"* ]]; then
    echo "Pushing commits to remote master..."
    git push origin master
    echo -e "\033[32m✔ Pushed to GitHub repository.\033[0m"
fi

if [[ "$*" == *"--remote"* ]]; then
    REMOTE_HOST="root@100.89.137.102"
    TARGET_DIR="/home/bb/school-app-server/"
    echo "Deploying via rsync to $REMOTE_HOST:$TARGET_DIR ..."
    rsync -avz -e "ssh -o StrictHostKeyChecking=no" --exclude '.git' --exclude 'node_modules' --exclude 'app' ./ "$REMOTE_HOST:$TARGET_DIR"
    echo "Restarting remote systemd daemon..."
    ssh -o StrictHostKeyChecking=no "$REMOTE_HOST" "systemctl restart school-app.service && systemctl is-active school-app.service"
    echo -e "\033[32m✔ Remote deployment completed.\033[0m"
fi

echo -e "\n\033[32m✔ Deployment workflow finished successfully!\033[0m"
