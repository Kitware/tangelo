import cherrypy
import os

import tangelo
import tangelo.server


class Directive(object):
    HTTPRedirect = 1
    InternalRedirect = 2
    ListPlugins = 3

    def __init__(self, t, argument=None):
        self.type = t
        self.argument = argument


class Content(object):
    NotFound = 1
    Directory = 2
    File = 3
    Service = 4
    Restricted = 5

    def __init__(self, t, path=None, pargs=None):
        self.type = t
        self.path = path
        self.pargs = pargs


class UrlAnalysis(object):
    def __init__(self):
        self.directive = None
        self.content = None
        self.reqpathcomp = None
        self.pathcomp = None


def analyze_url(reqpath):
    webroot = cherrypy.config.get("webroot")
    plugins = cherrypy.config.get("plugins")

    analysis = UrlAnalysis()

    # If the request path is blank, redirect to /.
    if reqpath == "":
        analysis.directive = Directive(Directive.HTTPRedirect, argument="/")
        return analysis

    if plugins is not None and reqpath[0] == "/" and reqpath.split("/")[1] == "plugin":
        plugin_comp = reqpath.split("/")
        if len(plugin_comp) < 3:
            analysis.directive = Directive(Directive.ListPlugins)
            return analysis

        plugin = plugin_comp[2]
        if plugin not in plugins.plugins:
            analysis.content = Content(Content.NotFound, path=reqpath)
            return analysis

        webroot = plugins.plugins[plugin].path + "/web"
        reqpath = "/" + "/".join(plugin_comp[3:])

    # Compute "parallel" path component lists based on the web root and the
    # disk root.
    if reqpath == "/":
        reqpathcomp = []
        pathcomp = [webroot]
    else:
        # Split the request path into path components, omitting the leading
        # slash.
        reqpathcomp = reqpath[1:].split("/")

        # Compute the disk path the URL corresponds to.
        #
        # First check to see whether the path is absolute (i.e. rooted at
        # webroot) or in a user home directory.
        if reqpathcomp[0][0] == "~" and len(reqpathcomp[0]) > 1:
            # Only treat this component as a home directory if there is
            # actually text following the tilde (rather than making the server
            # serve files from the home directory of whatever user account it
            # is using to run).
            pathcomp = [os.path.expanduser(reqpathcomp[0]) +
                        os.path.sep +
                        "tangelo_html"] + reqpathcomp[1:]
        else:
            pathcomp = [webroot] + reqpathcomp

    # Save the request path and disk path components in the thread storage,
    # slightly modifying the request path if it refers to an absolute path
    # (indicated by being one element shorter than the disk path).
    if len(reqpathcomp) == len(pathcomp) - 1:
        reqpathcomp_save = [""] + reqpathcomp
    elif len(reqpathcomp) == len(pathcomp):
        reqpathcomp_save = ["/" + reqpathcomp[0]] + reqpathcomp[1:]
    else:
        raise RuntimeError("reqpathcomp and pathcomp lengths are wonky")

    # If the path represents a directory and has a trailing slash, remove it
    # (this will make the auth update step easier).
    if (len(reqpathcomp_save) > 1 and
            reqpathcomp_save[-1] == "" or
            pathcomp[-1] == ""):
        assert reqpathcomp_save[-1] == "" and pathcomp[-1] == ""
        reqpathcomp_save = reqpathcomp_save[:-1]
        pathcomp_save = pathcomp[:-1]
    else:
        pathcomp_save = pathcomp

    analysis.reqpathcomp = reqpathcomp_save
    analysis.pathcomp = pathcomp_save

    # If pathcomp has more than one element, fuse the first two together.  This
    # makes the search for a possible service below much simpler.
    if len(pathcomp) > 1:
        pathcomp = [pathcomp[0] + os.path.sep + pathcomp[1]] + pathcomp[2:]

    # Form an actual path string.
    path = os.path.sep.join(pathcomp)

    # If the path is a directory, check for a trailing slash.  If missing,
    # perform a redirect to the path WITH the trailing slash.  Otherwise, check
    # for an index.html file in that directory; if found, perform an internal
    # redirect to that file.  Otherwise, leave the path alone - it now
    # represents a request for a directory listing.
    #
    # If instead the path isn't a directory, check to see if it's a regular
    # file.  If it is, save the path in thread local storage - this will let
    # the handler very quickly serve the file.
    #
    # If it is not a regular file, then check to see if it is a python service.
    #
    # Finally, if it is none of the above, then indicate a 404 error.
    if os.path.isdir(path):
        if reqpath[-1] != "/":
            analysis.directive = Directive(Directive.HTTPRedirect, argument=reqpath + "/")
            return analysis
        elif os.path.exists(path + os.path.sep + "index.html"):
            analysis.directive = Directive(Directive.InternalRedirect, argument=reqpath + "index.html")
            return analysis
        else:
            analysis.content = Content(Content.Directory, path=path)
    elif os.path.exists(path):
        # Don't serve Python files (if someone really wants to serve the program
        # text, they can create a symlink with a different file extension and
        # that will be served just fine).
        if len(path) > 3 and path[-3:] == ".py":
            analysis.content = Content(Content.Restricted, path=path)
        else:
            # Also do not serve config files that match up to Python files.
            if (len(path) > 5 and
                    path[-5:] == ".json" and
                    os.path.exists(path[:-5] + ".py")):
                analysis.content = Content(Content.Restricted, path=path)
            else:
                analysis.content = Content(Content.File, path=path)
    else:
        service_path = None
        pargs = None
        for i in range(len(pathcomp)):
            service_path = os.path.sep.join(pathcomp[:(i + 1)]) + ".py"
            if os.path.exists(service_path):
                pargs = pathcomp[(i + 1):]
                break

        if pargs is None:
            analysis.content = Content(Content.NotFound, path=path)
        else:
            analysis.content = Content(Content.Service, path=service_path, pargs=pargs)

    return analysis


def treat_url():
    analysis = analyze_url(cherrypy.request.path_info)

    cherrypy.thread_data.content = analysis.content
    cherrypy.thread_data.do_auth = analysis.content is None or analysis.content.type != Content.NotFound
    cherrypy.thread_data.reqpathcomp = analysis.reqpathcomp
    cherrypy.thread_data.pathcomp = analysis.pathcomp

    if analysis.directive is not None:
        if analysis.directive.type == Directive.HTTPRedirect:
            raise cherrypy.HTTPRedirect(analysis.directive.argument)
        elif analysis.directive.type == Directive.InternalRedirect:
            raise cherrypy.InternalRedirect(analysis.directive.argument)
        else:
            raise RuntimeError("fatal internal error:  illegal directive type code %d" % (analysis.directive.type))


class AuthUpdate(cherrypy.Tool):
    # A list of acceptable authentication types.
    allowed_auth_types = ["digest"]

    def __init__(self, point="before_handler", priority=50, app=None):
        # cherrypy.Tool attributes.
        self._name = None
        self._point = point
        self._priority = priority

        # Private attributes.
        self.app = app

        # A record of installed auth tools.
        self.security = {}

    @staticmethod
    def parse_htaccess(filename):
        result = {"msg": None,
                  "auth_type": None,
                  "user_file": None,
                  "realm": None,
                  "userpass": None}

        # Try to open and parse the file.
        try:
            with open(filename) as f:
                lines = filter(lambda x: len(x) > 0,
                               map(lambda x: x.strip().split(), f.readlines()))
                keys = map(lambda x: x[0], lines)
                values = map(lambda x: " ".join(x[1:]), lines)

                for i, (k, v) in enumerate(zip(keys, values)):
                    if k == "AuthType":
                        if v not in AuthUpdate.allowed_auth_types:
                            allowed = ", ".join(AuthUpdate.allowed_auth_types)
                            result["msg"] = (
                                "%s is not a supported " +
                                "authentication type.  The " +
                                "supported types are: %s") % (v, allowed)
                            return result
                        else:
                            result["auth_type"] = v
                    elif k in ["AuthPasswordFile", "AuthUserFile"]:
                        result["user_file"] = v
                    elif k == "AuthRealm":
                        result["realm"] = v
                    else:
                        result["msg"] = (
                            "Unknown key '%s' on " +
                            "line %d of file '%s'") % (k, i + 1, filename)
                        return result
        except IOError:
            result["msg"] = "Could not open file '%s'" % (filename)
            return result

        # Open the user file and parse out the username/passwords of those
        # users in the correct realm.
        recs = None
        if result["user_file"] is not None:
            try:
                with open(result["user_file"]) as f:
                    recs = filter(lambda x: x[1] == result["realm"],
                                  map(lambda x: x.strip().split(":"),
                                      f.readlines()))
            except IOError:
                result["msg"] = ("Could not open user " +
                                 "password file '%s'") % (result["user_file"])
                return result
            except IndexError:
                result["msg"] = ("Malformed content in user password file " +
                                 "'%s' (some line has too " +
                                 "few fields)") % (result["user_file"])
                return result

        try:
            result["userpass"] = {x[0]: x[2] for x in recs}
        except IndexError:
            result["msg"] = ("Malformed content in user password file " +
                             "'%s' (some line has too " +
                             "few fields)") % (result["user_file"])
            return result

        return result

    def htaccess(self, htfile, reqpath):
        changed = False
        if htfile is None:
            if reqpath in self.security:
                del self.security[reqpath]

                cfg = self.app.config[reqpath]
                for a in AuthUpdate.allowed_auth_types:
                    key = "tools.auth_%s.on" % (a)
                    if key in cfg:
                        cfg[key] = False
                    self.app.merge({reqpath: cfg})
                    changed = True
        else:
            # Get the mtime of the htfile.
            ht_mtime = os.stat(htfile).st_mtime

            if (reqpath not in self.security or
                    ht_mtime > self.security[reqpath]):
                # We have either a new .htaccess file, or one that has
                # been modified list the last request to this path.
                htspec = AuthUpdate.parse_htaccess(htfile)
                if htspec["msg"] is not None:
                    tangelo.log("TANGELO", "[AuthUpdate] Could not register %s: %s" %
                                (reqpath, htspec["msg"]))
                    return changed, htspec["msg"]

                # Create an auth config tool using the values in the htspec.
                toolname = "tools.auth_%s." % (htspec["auth_type"])
                passdict = (
                    lambda realm, username: htspec["userpass"].get(username))
                # TODO(choudhury): replace "deadbeef" with a nonce created
                # randomly in the __init__() method.
                auth_conf = {toolname + "on": True,
                             toolname + "realm": htspec["realm"],
                             toolname + "get_ha1": passdict,
                             toolname + "key": "deadbeef"}

                self.app.merge({reqpath: auth_conf})

                # Store the mtime in the security table.
                self.security[reqpath] = ht_mtime

                changed = True

        return changed, None

    def callable(self, reqpathcomp, pathcomp):
        # The lengths of the lists should be equal.
        assert len(reqpathcomp) == len(pathcomp)

        # Create a list of paths to search, starting with the requested
        # resource and moving towards the root.
        paths = reversed(map(lambda i: ("/".join(reqpathcomp[:(i + 1)]) or "/",
                                        os.path.sep.join(pathcomp[:(i + 1)])),
                             range(len(reqpathcomp))))

        # Check each path that represents a directory for a .htaccess file,
        # then decide what to do based on the current auth state for that path.
        for rpath, dpath in paths:
            if os.path.isdir(dpath):
                htfile = dpath + os.path.sep + ".htaccess"
                if not os.path.exists(htfile):
                    htfile = None

                changed, msg = self.htaccess(htfile, rpath)
                if msg is not None:
                    raise cherrypy.HTTPError(401,
                                             "There was an error in the " +
                                             "HTTP authentication " +
                                             "process: %s" % (msg))

                # TODO(choudhury): I really don't understand why this hack is
                # necessary.  Basically, when the auth_* tool is installed on
                # the path in the htaccess() method, it doesn't seem to take
                # hold until the next time the page is loaded.  So this hack
                # forces a page reload, but it would be better to simply make
                # the new config "take hold" instead.
                if changed:
                    raise cherrypy.HTTPRedirect(cherrypy.request.path_info)

                # Don't bother updating the security table for higher paths -
                # we'll process those later, when they are requested.
                break
