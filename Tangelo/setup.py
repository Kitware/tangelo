import distutils.core
import os

# Recursively collect all files in a given directory.
def rcollect(path):
    if not os.path.exists(path):
        raise IOError("%s does not exist" % (path))
    return sum(map(lambda x: map(lambda y: x[0] + "/" + y, x[2]), os.walk(path)), [])

def copy_with_dir(files, base):
    return [(base + "/" + os.path.dirname(f), [f]) for f in files]

# Build up a list of extra files to install.
#
# Include the example configuration files.
data_files_list = [("share/tangelo/conf", ["conf/tangelo.conf.global", "conf/tangelo.conf.local"])]

# If documentation was generated, include all of those files.
try:
    doc_files = rcollect("doc")
except IOError:
    pass
else:
    data_files_list += copy_with_dir(doc_files, "share/doc/tangelo")

# Include the website base files.
data_files_list += copy_with_dir(rcollect("web"), "share/tangelo")

# Create the package.
distutils.core.setup(name="Tangelo",
                     version="0.3",
                     author="Kitware, Inc.",
                     author_email="tangelo-users@public.kitware.com",
                     url="http://tangelo.kitware.com",
                     packages=["tangelo"],
                     scripts=["bin/tangelo", "bin/tangelo-passwd", "bin/vtkweb-launcher.py"],
                     data_files=data_files_list,
                     description="Tangelo Web Framework",
                     requires=["cherrypy(>=3.2)"])
