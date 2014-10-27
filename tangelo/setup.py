import distutils.core
import os


# Recursively collect all files in a given directory.
def rcollect(path):
    if not os.path.exists(path):
        raise IOError("%s does not exist" % (path))
    return sum(map(lambda x: map(lambda y: x[0] + "/" + y, x[2]),
                   os.walk(path)),
               [])


def copy_with_dir(files, base):
    return [(base + "/" + os.path.dirname(f), [f]) for f in files]

# Build up a list of extra files to install.
#
# Include the example configuration files.
data_files_list = [("share/tangelo/conf", ["assets/conf/tangelo.global.conf",
                                           "assets/conf/tangelo.local.conf"]),
                   ("share/tangelo/daemon/systemd/system", ["assets/daemon/systemd/system/tangelo@.service"]),
                   ("share/tangelo/daemon/systemd/scripts", ["assets/daemon/systemd/scripts/launch-tangelo.sh"]),
                   ("share/tangelo/data", ["assets/data/get-flickr-data.py"]),
                   ("share/tangelo", ["assets/images/tangelo.ico"])]

# Include the website base files, excluding generated tests and compiled python
# files.
web_files = filter(lambda f: not (f.startswith("www/tests") or f.endswith(".pyc")),
                   rcollect("www"))
data_files_list += copy_with_dir(web_files, "share/tangelo")

# Create the package.
distutils.core.setup(name="tangelo",
                     version="0.7.0-dev",
                     author="Kitware, Inc.",
                     author_email="tangelo-users@public.kitware.com",
                     url="http://kitware.github.io/tangelo",
                     packages=["tangelo",
                               "tangelo.autobahn",
                               "tangelo.ws4py",
                               "tangelo.ws4py.server"],
                     scripts=["scripts/tangelo",
                              "scripts/tangelo-passwd",
                              "scripts/vtkweb-launcher.py"],
                     data_files=data_files_list,
                     description="Tangelo Web Framework",
                     long_description="Tangelo is a Python-based web " +
                     "server framework bundled with clientside tools " +
                     "to help you supercharge your web applications " +
                     "with the power of Python",
                     license="Apache License, Version 2.0",
                     platforms=["Linux", "OS X", "Windows"],
                     install_requires=["cherrypy == 3.2.4",
                                       "Twisted >= 13.2"])