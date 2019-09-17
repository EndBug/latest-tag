FROM alpine/git:1.0.7

LABEL "com.github.actions.name"="Latest tag"
LABEL "com.github.actions.description"="Automatically generate & update a 'latest' tag for your releases"
LABEL "com.github.actions.icon"="tag"
LABEL "com.github.actions.color"="blue"

LABEL "repository"="https://github.com/EndBug/latest-tag"
LABEL "homepage"="https://github.com/EndBug/latest-tag"
LABEL "maintainer"="Federico Grandi <fgrandi30@gmail.com>"

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["sh", "/entrypoint.sh"]
