# Downloads to Dock

A GNOME Shell extension that adds a `Downloads` folder launcher to the dock.
When Dash-to-Dock has its trash/bin icon enabled, GNOME places this favorite
immediately before it.

## Install

```sh
uuid='downloads-to-dock@shoobyban'
gnome-extensions pack --force --extra-source=downloads-folder.desktop
gnome-extensions install --force "$uuid.shell-extension.zip"
```

Log out, then log back in. The `install` command makes the extension available
to the next GNOME Shell session, not the current one. Then enable it:

```sh
gnome-extensions enable 'downloads-to-dock@shoobyban'
```

The extension supports GNOME Shell 45 through 49, including Ubuntu 24.04's
GNOME Shell 46.

## Behavior

Enabling the extension installs a desktop launcher in
`~/.local/share/applications` and adds it to the GNOME favorites list.
Disabling it removes only the favorite it added, leaving the launcher available
for future use.