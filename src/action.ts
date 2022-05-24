import * as core from '@actions/core'
import * as util from 'util'
import * as child_process from 'child_process'

const { GITHUB_ACTOR } = process.env

async function exec(command: string) {
  const { stdout, stderr } = await util.promisify(child_process.exec)(command)
  if (stderr) console.error(stderr)
  return stdout
}

function annotatedTag(message: string, tagName: string) {
  core.info('Creating annotated tag...')
  return exec(`git tag -a -f -m "${message}" ${tagName}`)
}

function lightweightTag(tagName: string) {
  core.info('Creating lightweight tag...')
  return exec(`git tag -f ${tagName}`)
}

function forceBranch(tagName: string) {
  core.info('Updating branch...')
  return exec(`git branch -f ${tagName}`)
}

async function run() {
  try {
    core.info('Setting up git user...')
    await exec(`git config user.name "${GITHUB_ACTOR}"`)
    await exec(
      `git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"`
    )

    const message = core.getInput('description')
    const tagName = core.getInput('tag-name', { required: true })
    core.info(`Using '${tagName}' as tag name.`)

    const branch = core.getBooleanInput('force-branch', { required: true })

    if (branch && message)
      core.warning(
        "You can't set a message when updating a branch, the message will be ignored."
      )

    if (branch) await forceBranch(tagName)
    else if (message) await annotatedTag(message, tagName)
    else await lightweightTag(tagName)

    if (branch) core.info('Force-pushing updated branch to repo...')
    else core.info('Pushing updated tag to repo...')
    return await exec(`git push --force origin ${tagName}`)
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : error)
  }
}

run()
