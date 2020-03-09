import { setFailed, getInput, info, warning } from '@actions/core'
import { context, GitHub } from '@actions/github'

function isRelease() {
  return context.payload.action == 'published'
    && context.payload.release?.tag_name != null
}

async function run() {
  try {
    if (!isRelease()) {
      setFailed("This action should only be used in a release context")
      setFailed("If you believe this to be an error, please submit a bug report")
      return
    }

    const { GITHUB_ACTOR, GITHUB_SHA, GITHUB_TOKEN } = process.env
    if (GITHUB_TOKEN) {
      const { git } = new GitHub(GITHUB_TOKEN)

      const macthingRef = (await git.listMatchingRefs({
        ...context.repo,
        ref: `tags/latest`
      })).data.find(obj => obj.ref.endsWith('latest'))

      const message = getInput('description')

      let tagResult
      if (message) {
        tagResult = await git.createTag({
          ...context.repo,
          tag: 'latest',
          message,
          object: GITHUB_SHA,
          type: 'commit',
          tagger: {
            name: GITHUB_ACTOR,
            email: `${GITHUB_ACTOR}@users.noreply.github.com`
          }
        })

        if (tagResult.status != 201) {
          warning('Creating tag obj resulted in an error:\n' + JSON.stringify(tagResult.data))
          warning('The action will proceed in creating/updating a lightweight tag.')
        } else info('Tag object successfully created.')
      }

      let newRef
      if (macthingRef && tagResult?.status != 201) {
        info(`Updating 'latest' tag to release commit: ${GITHUB_SHA}`)
        newRef = await git.updateRef({
          ...context.repo,
          force: true,
          ref: 'tags/latest',
          sha: GITHUB_SHA
        })
      } else {
        if (tagResult?.status == 201) {
          info('Deleting previous ref...')
          await git.deleteRef({
            ...context.repo,
            ref: 'refs/tags/latest'
          })
        }
        info(`Creating 'latest' tag for release commit: ${GITHUB_SHA}`)
        newRef = await git.createRef({
          ...context.repo,
          ref: 'refs/tags/latest',
          sha: GITHUB_SHA
        })
      }

      info('New ref available:\n' + JSON.stringify(newRef.data))
    } else setFailed('Missing `GITHUB_TOKEN` environment variable')
  } catch (error) {
    setFailed(error instanceof Error ? error.message : error)
  }
}

run()
