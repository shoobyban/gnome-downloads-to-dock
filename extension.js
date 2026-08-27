import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';

const DESKTOP_FILE = 'downloads-folder.desktop';

export default class DownloadsToDockExtension extends Extension {
    enable() {
        this._appId = DESKTOP_FILE;
        this._favorites = AppFavorites.getAppFavorites();
        this._wasFavorite = this._favorites.isFavorite(this._appId);

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
}