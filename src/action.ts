import { setFailed, getInput, info, warning } from '@actions/core'
import { context, GitHub } from '@actions/github'
const { stringify: str } = JSON

const { GITHUB_ACTOR, GITHUB_SHA, GITHUB_TOKEN } = process.env
type git = GitHub['git']

function isRelease() {
  return context.payload.action == 'published'
    && context.payload.release?.tag_name != null
}

async function createRef(git: git) {
  info(`Creating ref to point to ${GITHUB_SHA}...`)
  let created = await git.createRef({
    ...context.repo,
    ref: 'refs/tags/latest',
    sha: GITHUB_SHA
  })
  info('Ref created: ' + str(created.data))
  return created
}

async function createTag(git: git, message: string) {
  info(`Creating tag object for ${GITHUB_SHA}...`)
  let tag = await git.createTag({
    ...context.repo,
    tag: 'latest',
    message,
    object: GITHUB_SHA,
    type: 'commit',
    tagger: {
      name: GITHUB_ACTOR,
      email: `${GITHUB_ACTOR}@users.noreply.github.com`,
      date: (new Date()).toString()
    }
  })
  info('Tag created: ' + str(tag.data))
  return tag
}

async function deleteRef(git: git) {
  info('Deleting ref...')
  let deleted = await git.deleteRef({
    ...context.repo,
    ref: 'tags/latest'
  })
  info('Ref deleted')
  return deleted
}

async function updateRef(git: git) {
  info(`Updating ref to point to ${GITHUB_SHA}...`)
  let updated = await git.updateRef({
    ...context.repo,
    force: true,
    ref: 'tags/latest',
    sha: GITHUB_SHA
  })
  info('Ref updated: ' + str(updated.data))
  return updated
}

async function annotatedTag(git: git, message: string, matching: boolean) {
  if (matching) await deleteRef(git)
  let tag = await createTag(git, message)
  if (tag.status != 201) {
    warning('Creating tag obj resulted in an error:\n' + str(tag.data))
    warning('The action will proceed in creating/updating a lightweight tag.')
  }
  return await createRef(git)
}

function lightweightTag(git: git, matching: boolean) {
  if (matching) return updateRef(git)
  else return createRef(git)
}

async function run() {
  try {
    if (!isRelease()) {
      setFailed("This action should only be used in a release context")
      setFailed("If you believe this to be an error, please submit a bug report")
      return
    }

    if (GITHUB_TOKEN) {
      const { git } = new GitHub(GITHUB_TOKEN)

      const macthingRef = (await git.listMatchingRefs({
        ...context.repo,
        ref: `tags/latest`
      })).data.find(obj => obj.ref.endsWith('latest'))

      const message = getInput('description')

      if (message) annotatedTag(git, message, !!macthingRef)
      else lightweightTag(git, !!macthingRef)
    } else setFailed('Missing `GITHUB_TOKEN` environment variable')
  } catch (error) {
    setFailed(error instanceof Error ? error.message : error)
  }
}

run()
