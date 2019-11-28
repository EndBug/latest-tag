#!/bin/sh
set -eu

# Set up .netrc file with GitHub credentials
git_setup ( ) {
  cat <<- EOF > $HOME/.netrc
        machine github.com
        login $GITHUB_ACTOR
        password $GITHUB_TOKEN

        machine api.github.com
        login $GITHUB_ACTOR
        password $GITHUB_TOKEN
EOF
    chmod 600 $HOME/.netrc

    git config --global user.email "actions@github.com"
    git config --global user.name "Latest tag GitHub Action"
}

echo "Setting up git machine..."
git_setup

echo "Forcing tag update..."
git tag -a latest -m $INPUT_INTRODUCTION "${GITHUB_SHA}" -f

echo "Forcing tag push..."
git push --tags -f