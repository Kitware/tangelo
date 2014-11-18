// Export a global module.
window.tangelo = {};

(function (tangelo) {
    "use strict";

    // Tangelo version number.
    tangelo.version = function () {
        var version = "0.7.0-dev";
        return version;
    };

    // The root url for Tangelo plugins.
    tangelo.pluginRoot = "/plugin";

    // A namespace for plugins.
    tangelo.plugin = {};

    // Check for the required version number.
    tangelo.requireCompatibleVersion = function (reqvstr) {
        var reqv,
            tanv,
            compatible,
            parse;

        // This function parses out the structure of a version string.
        //
        // Major version 0 version numbers contain only two parts: 0.MINOR
        //
        // Major version 1 version numbers contain three parts:
        // MAJOR.MINOR.PATCH
        //
        // Any version number may also have a trailing hyphen followed by one or
        // more non-space, non-hyphen characters: 0.MINOR-TAG, or
        // MAJOR.MINOR.PATCH-TAG
        //
        // The minor and patch numbers may be omitted; they will be filled in
        // with 0s as appropriate.
        //
        // Negative numbers and non-number strings are not allowed in the
        // version number components.
        parse = function (s) {
            var parts,
                ver,
                tag,
                i,
                components;

            parts = s.split("-");
            if (parts.length > 1) {
                ver = parts.slice(0, -1).join("-");
                tag = parts.slice(-1)[0];
            } else {
                ver = parts[0];
                tag = parts[1];
            }

            if (!ver) {
                return null;
            }

            if (tag !== undefined && (tag.length === 0 || tag.indexOf(" ") !== -1)) {
                return null;
            }

            ver = ver.split(".").map(function (x) {
                return Number(x);
            });

            if (ver.length === 0) {
                return null;
            }

            for (i = 0; i < ver.length; i += 1) {
                if (isNaN(ver[i]) || ver[i] < 0) {
                    return null;
                }
            }

            components = ver[0] === 0 ? 2 : 3;
            if (ver.length > components) {
                return null;
            }

            for (i = ver.length; i < components; i += 1) {
                ver[i] = 0;
            }

            return {
                version: ver,
                tag: tag
            };
        };

        // Parse out the structures of the required version string, and the
        // current Tangelo version string.
        reqv = parse(reqvstr);
        tanv = parse(tangelo.version());

        // If either of them fails to parse, raise a fatal error.
        if (!tanv) {
            throw new Error("tangelo version number is invalid: " + tangelo.version());
        } else if (!reqv) {
            throw new Error("invalid version string: " + reqvstr);
        }

        // Run the compatibility rules.
        if (reqv.tag || tanv.tag || reqv.version[0] === 0 || tanv.version[0] === 0) {
            // If either version has a tag, or if the major version is 0, then
            // the versions must match exactly.
            compatible = reqv.tag === tanv.tag &&
                         reqv.version[0] === tanv.version[0] &&
                         reqv.version[1] === tanv.version[1] &&
                         reqv.version[2] === tanv.version[2];
        } else {
            // If there are no tags, and the major version is greater than 0,
            // then the major versions MUST match, and the required minor
            // version MUST be at most the Tangelo minor version.  If the minor
            // versions are equal, then the required patch level MUST be at most
            // the Tangelo patch level.
            compatible = reqv.version[0] === tanv.version[0] &&
                         (reqv.version[1] < tanv.version[1] || (reqv.version[1] === tanv.version[1] && reqv.version[2] <= tanv.version[2]));
        }

        return compatible;
    };
}(window.tangelo));
