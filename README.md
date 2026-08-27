# Downloads to Dock

A GNOME Shell extension that adds a `Downloads` folder launcher to the dock.
When Dash-to-Dock has its trash/bin icon enabled, GNOME places this favorite
immediately before it.

## Install

```sh
uuid='downloads-to-dock@sam'
target="$HOME/.local/share/gnome-shell/extensions/$uuid"
mkdir -p "$target"
cp metadata.json extension.js downloads-folder.desktop "$target"
gnome-extensions enable "$uuid"
```

Log out and back in if your GNOME Shell session does not load the extension
immediately. The extension supports GNOME Shell 45 through 49.

## Behavior

Enabling the extension installs a desktop launcher in
`~/.local/share/applications` and adds it to the GNOME favorites list.
Disabling it removes only the favorite it added, leaving the launcher available
for future use.