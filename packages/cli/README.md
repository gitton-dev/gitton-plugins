# @gitton-dev/cli

CLI tool for managing Gitton plugins.

## Installation

```bash
npm install -g @gitton-dev/cli
```

## Usage

### Install a plugin

```bash
# Install by full package name
gitton install @gitton-dev/plugin-github-actions

# Or use shorthand (automatically expands to @gitton-dev/plugin-{name})
gitton install github-actions
```

### List installed plugins

```bash
gitton list
```

### Uninstall a plugin

```bash
gitton uninstall github-actions
```

## Options

- `--dev` - Use development plugins directory (for plugin developers)

## Plugin Directory

Plugins are installed to:

- **macOS**: `~/Library/Application Support/gitton/plugins/`
- **Windows**: `%APPDATA%/gitton/plugins/`
- **Linux**: `~/.config/gitton/plugins/`

## License

MIT
