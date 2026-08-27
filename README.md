# Downloads to Dock

A GNOME Shell extension that adds a `Downloads` folder launcher to the dock.
When Dash-to-Dock has its trash/bin icon enabled, GNOME places this favorite
immediately before it.

## Install

```sh
uuid='downloads-to-dock@shoobyban'
gnome-extensions pack --force --extra-source=downloads-folder.desktop
gnome-extensions install --force "$uuid.shell-extension.zip"
gnome-extensions enable "$uuid"
```

The `install` command registers the extension with the running GNOME Shell
session before it is enabled. The extension supports GNOME Shell 45 through 49.

## Behavior

Enabling the extension installs a desktop launcher in
`~/.local/share/applications` and adds it to the GNOME favorites list.
Disabling it removes only the favorite it added, leaving the launcher available
for future use.