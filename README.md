# Latest tag

Automatically creates & updates a `latest` tag pointing to your latest release.

When using GitHub Actions you always have to put a reference for every action you use in your worflows: that means that you either need to choose a specific version or you need to use a branch.  
If you want to use the **latest** release of an action you can only hope authors are mantaining a `latest` tag that they update with every version: although not impossible, it's not that easy to find someone willing to do that.

That's why I made this action: if you're the kind of guy that doesn't like to update tags you can simply use this action and forget about it. You can just put `latest` in the documentation: your users will get the benefits of using a branch as ref and the security of using only stable versions (as long as you don't make breaking changes).

## Input parameters

These are the parameters you can use with the action:

- `tag-name`: [optional] Tag name. Specify the name of tag that will be created or updated (default is `latest`).
- `description`: [optional] Tag description. Providing a value will result in the creation of an **annotated tag**; if no value is entered, the action will create a **lightweight tag**.

## Usage

You can use a workflow like this:

```yaml
name: Add latest tag to new release
on:
  release:
    types: [published] # This makes it run only when a new released is published

jobs: 
  run:
    name: Add/update tag to new release
    runs-on: ubuntu-latest

    steps: 
    - name: Checkout repository
      uses: actions/checkout@master

    - name: Run latest-tag
      uses: EndBug/latest-tag@latest
      with:
        description: Description for the tag
        tag-name: latest
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Leave this line unchanged
```

### Environment variables:

The only `env` variable required is the token for the action to run: GitHub generates one automatically, but you need to pass it through `env` to make it available to actions. You can find more about `GITHUB_TOKEN` [here](https://help.github.com/en/articles/virtual-environments-for-github-actions#github_token-secret).  
With that said, you can just copy the example line and don't worry about it. If you do want to use a different token you can pass that in, but I wouldn't see any possible advantage in doing so.

## License

This action is distributed under the MIT license, check the [license](LICENSE) for more info.

## Similar actions

[actions-tagger](https://github.com/marketplace/actions/actions-tagger): allows you to create and update both `latest` and major version tags, even though it doesn't support annotated tags.
