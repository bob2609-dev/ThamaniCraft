#!/bin/bash

# Defaults
COMMIT_MSG="New Changes"
BRANCH_NAME="main"




# Parse options
while getopts "m:b:" opt; do
  case ${opt} in
    m) COMMIT_MSG=$OPTARG ;;
    b) BRANCH_NAME=$OPTARG ;;
    \?) echo "Usage: cmd [-m message] [-b branch]" ;;
  esac
done
git status

echo "Adding changes..."
git add .

echo "Committing with message: '$COMMIT_MSG'"
git commit -m "$COMMIT_MSG"

echo "Pushing to origin $BRANCH_NAME..."
git push -u origin "HEAD:$BRANCH_NAME"
