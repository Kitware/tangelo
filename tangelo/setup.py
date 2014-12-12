import distutils.core
import os
import os.path


# Recursively collect all files in a given directory.
def rcollect(path):
    if not os.path.exists(path):
        raise IOError("%s does not exist" % (path))
    return sum(map(lambda x: map(lambda y: x[0] + "/" + y, x[2]),
                   os.walk(path)),
               [])


def copy_with_dir(files, base):
    return [(os.path.join(base, os.path.dirname(f)), [f]) for f in files]

# Build up a list of extra files to install.
#
# Include the example configuration files.
data_files_list = [("share/tangelo/conf", ["assets/conf/tangelo.global.conf",
                                           "assets/conf/tangelo.local.conf"]),
                   ("share/tangelo/daemon/systemd/system", ["assets/daemon/systemd/system/tangelo@.service"]),
                   ("share/tangelo/daemon/systemd/scripts", ["assets/daemon/systemd/scripts/launch-tangelo.sh"]),
                   ("share/tangelo/data", ["assets/data/get-flickr-data.py"]),
                   ("share/tangelo", ["assets/images/tangelo.ico"])]

# Include the website base files.
data_files_list += copy_with_dir(rcollect("web"), "share/tangelo")

# Include the bundled plugins.
data_files_list += copy_with_dir(rcollect("plugin"), "share/tangelo")

# Create the package.
distutils.core.setup(name="tangelo",
                     version="0.8.0",
                     author="Kitware, Inc.",
                     author_email="tangelo-users@public.kitware.com",
                     url="http://kitware.github.io/tangelo",
                     packages=["tangelo"],
                     scripts=["scripts/tangelo",
                              "scripts/tangelo-passwd"],
                     data_files=data_files_list,
                     description="Tangelo Web Framework",
                     long_description="Tangelo is a Python-based web " +
                     "server framework bundled with clientside tools " +
                     "to help you supercharge your web applications " +
                     "with the power of Python",
                     license="Apache License, Version 2.0",
                     platforms=["Linux", "OS X", "Windows"],
                     install_requires=["cherrypy==3.2.4",
                                       "PyYAML==3.11",
                                       "ws4py==0.3.2"])
