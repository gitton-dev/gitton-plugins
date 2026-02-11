# Gitton GitHub Actions Plugin

View and trigger GitHub Actions workflows directly from Gitton.

![GitHub Actions Plugin](./github-actions-plugin.png)

## Features

- View all workflows in your repository
- See recent run status (success, failure, pending)
- Trigger workflow_dispatch enabled workflows
- Quick access to run logs on GitHub

## Installation

1. Download the latest release ZIP file
2. In Gitton, go to Settings > Plugins
3. Click "Upload ZIP" and select the downloaded file

## Configuration

1. Go to Settings > Plugins > GitHub Actions tab
2. Enter your GitHub Personal Access Token
   - Required scopes: `repo`, `workflow`
   - [Create a new token](https://github.com/settings/tokens/new?scopes=repo,workflow&description=Gitton%20GitHub%20Actions)
3. Enter your repository owner and name
4. Click "Save Settings"

## Usage

1. Open a repository in Gitton
2. Click the "GitHub Actions" item in the sidebar
3. View your workflows and their status
4. Click "Run Workflow" to trigger a workflow

## Development

```bash
# Clone the repository
git clone https://github.com/example/gitton-plugin-github-actions

# Create ZIP for distribution
zip -r gitton-plugin-github-actions.zip gitton-plugin-github-actions
```

## License

MIT
