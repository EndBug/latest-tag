import { setFailed, getInput, info, error } from '@actions/core'
import { context } from '@actions/github'
import * as util from 'util'
import * as child_process from 'child_process'

const { GITHUB_ACTOR, GITHUB_TOKEN } = process.env

async function exec(command: string) {
  const { stdout, stderr } = await util.promisify(child_process.exec)(command)
  error(stderr)
  return stdout
}

function isRelease() {
  return context.payload.action == 'published'
    && context.payload.release?.tag_name != null
}

function annotatedTag(message: string) {
  info('Creating annotated tag...')
  return exec(`git tag -a -f -m "${message}" latest`)
}

function lightweightTag() {
  info('Creating lightweight tag...')
  return exec(`git tag -f latest`)
}

async function run() {
  try {
    if (!isRelease()) {
      setFailed("This action should only be used in a release context")
      setFailed("If you believe this to be an error, please submit a bug report")
      return
    }

    if (GITHUB_TOKEN) {
      info('Setting up git user...')
      await exec(`git config user.name "${GITHUB_ACTOR}"`)
      await exec(`git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"`)

      const message = getInput('description')

      if (message) await annotatedTag(message)
      else await lightweightTag()

      info('Pusing updated tag to repo...')
      return await exec('git push --force --tags')
    } else setFailed('Missing `GITHUB_TOKEN` environment variable')
  } catch (error) {
    setFailed(error instanceof Error ? error.message : error)
  }
}

run()
