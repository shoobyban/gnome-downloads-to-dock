import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';
import Clutter from 'gi://Clutter';
import St from 'gi://St';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const DESKTOP_FILE = 'downloads-folder.desktop';
const FILE_ATTRIBUTES = [
    'standard::name',
    'standard::display-name',
    'standard::icon',
    'standard::type',
    'time::created',
    'time::modified',
].join(',');
const RECENT_FILE_LIMIT = 10;

export default class DownloadsToDockExtension extends Extension {
    enable() {
        this._appId = DESKTOP_FILE;
        this._downloadsDirectory = Gio.File.new_for_path(
            GLib.build_filenamev([GLib.get_home_dir(), 'Downloads'])
        );
        this._favorites = AppFavorites.getAppFavorites();
        this._wasFavorite = this._favorites.isFavorite(this._appId);
        this._capturedEventId = global.stage.connect('captured-event',
            (_stage, event) => this._onCapturedEvent(event));

        const applicationsDirectory = Gio.File.new_for_path(
            GLib.build_filenamev([GLib.get_user_data_dir(), 'applications'])
        );
        try {
            applicationsDirectory.make_directory_with_parents(null);
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                throw e;
        }

        const source = this.dir.get_child(DESKTOP_FILE);
        const destination = applicationsDirectory.get_child(DESKTOP_FILE);

        source.copy(destination, Gio.FileCopyFlags.OVERWRITE, null, null);

        if (this._wasFavorite)
            return;

        // The copy above is not visible to the app system until it rescans,
        // so defer the favorite until the launcher is actually known.
        this._appSystem = Shell.AppSystem.get_default();
        if (this._appSystem.lookup_app(this._appId)) {
            this._favorites.addFavorite(this._appId);
            return;
        }

        this._installedChangedId = this._appSystem.connect('installed-changed', () => {
            if (!this._appSystem.lookup_app(this._appId))
                return;

            this._appSystem.disconnect(this._installedChangedId);
            this._installedChangedId = null;
            this._favorites.addFavorite(this._appId);
        });
    }

    disable() {
        if (this._capturedEventId) {
            global.stage.disconnect(this._capturedEventId);
            this._capturedEventId = null;
        }
        this._closeMenu();

        if (this._installedChangedId) {
            this._appSystem.disconnect(this._installedChangedId);
            this._installedChangedId = null;
        }
        this._appSystem = null;

        if (!this._wasFavorite)
            this._favorites.removeFavorite(this._appId);

        this._favorites = null;
        this._wasFavorite = null;
    }

    _onCapturedEvent(event) {
        if (event.type() !== Clutter.EventType.BUTTON_PRESS ||
            event.get_button() !== Clutter.BUTTON_PRIMARY)
            return Clutter.EVENT_PROPAGATE;

        const appIcon = this._findDownloadsAppIcon(event.get_source());
        if (!appIcon)
            return Clutter.EVENT_PROPAGATE;

        this._showMenu(appIcon);
        return Clutter.EVENT_STOP;
    }

    _findDownloadsAppIcon(actor) {
        while (actor) {
            const delegate = actor._delegate;
            if (delegate?.app?.get_id() === this._appId)
                return delegate;

            actor = actor.get_parent();
        }

        return null;
    }

    _showMenu(appIcon) {
        this._closeMenu();

        this._menu = new PopupMenu.PopupMenu(appIcon, 0.5, St.Side.TOP);
        Main.uiGroup.add_child(this._menu.actor);

        this._addMenuItem('Open Downloads', 'folder-download-symbolic', () => {
            Gio.AppInfo.launch_default_for_uri(this._downloadsDirectory.get_uri(), null);
        });

        const files = this._getRecentFiles();
        if (files.length > 0)
            this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        for (const file of files) {
            this._addMenuItem(file.name, file.icon, () => {
                Gio.AppInfo.launch_default_for_uri(file.uri, null);
            });
        }

        this._menu.open();
    }

    _closeMenu() {
        if (!this._menu)
            return;

        this._menu.destroy();
        this._menu = null;
    }

    _addMenuItem(label, icon, activate) {
        const item = new PopupMenu.PopupBaseMenuItem();
        item.add_child(new St.Icon({
            gicon: typeof icon === 'string' ? Gio.icon_new_for_string(icon) : icon,
            icon_size: 16,
        }));
        item.add_child(new St.Label({ text: label }));
        item.connect('activate', activate);
        this._menu.addMenuItem(item);
    }

    _getRecentFiles() {
        const files = [];

        let enumerator;
        try {
            enumerator = this._downloadsDirectory.enumerate_children(
                FILE_ATTRIBUTES,
                Gio.FileQueryInfoFlags.NONE,
                null
            );

            let info;
            while ((info = enumerator.next_file(null))) {
                if (info.get_file_type() === Gio.FileType.DIRECTORY)
                    continue;

                const created = info.get_attribute_uint64('time::created');
                const modified = info.get_attribute_uint64('time::modified');
                files.push({
                    name: info.get_display_name(),
                    icon: info.get_icon(),
                    uri: this._downloadsDirectory.get_child(info.get_name()).get_uri(),
                    timestamp: created || modified,
                });
            }
        } catch (error) {
            logError(error, 'Unable to read the Downloads folder');
        } finally {
            enumerator?.close(null);
        }

        return files
            .sort((first, second) => first.timestamp - second.timestamp)
            .slice(-RECENT_FILE_LIMIT);
    }
}