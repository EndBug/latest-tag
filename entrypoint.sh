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

echo "${GITHUB_SHA}"

git_setup

git tag -d latest
git tag -a latest -m "This tag has been auto-generated by latest-tag" "${GITHUB_SHA}"
git push --tags

exit 1