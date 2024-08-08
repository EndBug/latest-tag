import * as core from '@actions/core';
import * as util from 'util';
import * as child_process from 'child_process';

class GitArgs {
  readonly command: string;

  constructor(
    readonly ref: string,
    readonly directory: string
  ) {
    core.debug(`GitArgs.ref: ${ref}`);
    core.debug(`GitArgs.directory: ${directory}`);

    this.command = `git -C ${this.directory}`;
    core.debug(`GitArgs.command: ${this.command}`);
  }
}

async function exec(command: string) {
  core.debug(`executing: ${command}`);

  const {stdout, stderr} = await util.promisify(child_process.exec)(command);
  if (stderr) console.error(stderr);
  return stdout;
}

function annotatedTag(message: string, git: GitArgs) {
  core.info('Creating annotated tag...');
  return exec(`${git.command} tag -a -f -m "${message}" ${git.ref}`);
}

function lightweightTag(git: GitArgs) {
  core.info('Creating lightweight tag...');
  return exec(`${git.command} tag -f ${git.ref}`);
}

function forceBranch(git: GitArgs) {
  core.info('Updating branch...');
  return exec(`${git.command} branch -f ${git.ref}`);
}

async function setupUser(git: GitArgs) {
  core.info('Setting up git user...');

  const {GITHUB_ACTOR} = process.env;
  core.debug(`GITHUB_ACTOR: ${GITHUB_ACTOR}`);

  await exec(`${git.command} config user.name "${GITHUB_ACTOR}"`);
  await exec(
    `${git.command} config user.email "${GITHUB_ACTOR}@users.noreply.github.com"`
  );
}

async function run() {
  try {
    const git = new GitArgs(
      core.getInput('ref') || core.getInput('tag-name') || 'latest',
      core.getInput('git-directory')
    );

    const branch = core.getBooleanInput('force-branch', {required: true});
    const message = core.getInput('description');

    if (branch && message)
      core.warning(
        "You can't set a message when updating a branch, the message will be ignored."
      );

    core.debug(`branch: ${branch}`);
    core.debug(`message: ${message}`);

    core.info(`Running git commands within ${git.directory}`);
    core.info(`Using '${git.ref}' as tag name.`);

    await setupUser(git);

    if (branch) await forceBranch(git);
    else if (message) await annotatedTag(message, git);
    else await lightweightTag(git);

    if (branch) core.info('Force-pushing updated branch to repo...');
    else core.info('Pushing updated tag to repo...');
    return await exec(`${git.command} push --force origin ${git.ref}`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : error);
  }
}

run();
