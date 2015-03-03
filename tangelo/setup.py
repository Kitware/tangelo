from setuptools import setup
import os
import os.path


# Recursively collect all files in a given directory.
def rcollect(path):
    return sum(map(lambda x: map(lambda y: x[0] + "/" + y, x[2]), os.walk(path)), [])

# Create the package.
setup(name="tangelo",
      version="0.9.0",
      author="Kitware, Inc.",
      author_email="tangelo-users@public.kitware.com",
      url="http://kitware.github.io/tangelo",
      packages=["tangelo"],
      entry_points={"console_scripts": ["tangelo = tangelo.__main__:main",
                                        "tangelo-passwd = tangelo.__main__:tangelo_passwd",
                                        "tangelo-pkgdata = tangelo.__main__:tangelo_pkgdata"]},
      data_files=[("share/tangelo/conf", ["assets/conf/tangelo.global.conf",
                                          "assets/conf/tangelo.local.conf"]),
                  ("share/tangelo/data", ["assets/data/get-flickr-data.py"])],
      include_package_data=True,
      package_data={"tangelo": rcollect("tangelo/pkgdata")},
      description="Tangelo Web Framework",
      long_description="Tangelo is a Python-based web " +
      "server framework bundled with clientside tools " +
      "to help you supercharge your web applications " +
      "with the power of Python",
      license="Apache License, Version 2.0",
      platforms=["Linux", "OS X", "Windows"],
      install_requires=["cherrypy>=3.2, <4.0",
                        "PyYAML==3.11",
                        "ws4py==0.3.2"])
