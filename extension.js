import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

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
        applicationsDirectory.make_directory_with_parents(null);

        const source = this.dir.get_child(DESKTOP_FILE);
        const destination = applicationsDirectory.get_child(DESKTOP_FILE);

        source.copy(destination, Gio.FileCopyFlags.OVERWRITE, null, null);

        if (!this._wasFavorite)
            this._favorites.addFavorite(this._appId);
    }

    disable() {
        if (!this._wasFavorite)
            this._favorites.removeFavorite(this._appId);

        this._favorites = null;
        this._wasFavorite = null;
    }
}