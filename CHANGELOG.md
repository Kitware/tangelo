# Change Log
A list of per-release changes in the Tangelo codebase.  Tangelo uses [semantic
versioning](http://semver.org).

## [Unreleased] - [unreleased]
### Added
- Traceback is logged when a service module can't be imported
- Improvements to release cycle documentation
- Configuration parameter for ``$.controlPanel`` to set height of open panel
  explicitly
- Documentation has an explicit "hello world" example in the Quick Start section
- Quiet option reduces verbosity
- "Watch" plugin controls whether services and dependent modules are
  automatically reloaded when they change
- ``tangelo.ensurePlugin()`` function that avoids JavaScript parsing problems
- Service functions ``tangelo.redirect()`` and ``tangelo.internal_redirect()``
  to allow services to redirect to other resources
- Service function ``tangelo.file()`` to serve arbitrary files
- Process settings from configuration during startup.  Settings can be used to pass information to the server.
- Change some settings while running.

### Changed
- Documentation introduction is more focused; tutorials are more
  front-and-center
- Updated bundled version of GeoJS
- Support Travis containers for better automated testing
- Verbose option can be specified multiple times to increase application
  verbosity
- ``--config`` option can now accept either a YAML filename or a raw JSON string
- Tangelo no longer automatically reloads changed service modules, unless the
  ``--watch`` option is specified to load the new watch plugin
- Bundled Mongo plugin updated to use PyMongo 3.2

### Deprecated
- ``tangelo.getPlugin()`` - use ``tangelo.ensurePlugin()`` instead

### Removed
- "System Architecture" section in README

### Fixed
- ``tangelo.paths(".")`` hack no longer necessary to import modules in same
  directory as service
- Persistent store no longer cleared when reloading service
- Verbose option (``-v``) properly increases application verbosity
- Plugins are now imported using the ``imp`` module, eliminating some spurious
  error messages

### Security
- ``Server`` response header now reads "Tangelo" instead of "CherryPy" with a
  version string
- Runtime exceptions no longer send tracebacks to the client; instead, an error
  report code is sent, which can be matched up to a traceback appearing in the
  server log

## [0.9] - 2015-03-03
### Added
- This change log file
- Improvements to style testing
- Improvements to coverage testing
- Serverside and command line version tests
- New security features: by default Tangelo no longer serves directory contents,
  Python source code, and web service configuration files
- ``--examples`` flag causes example applications to be served; default web root
  is now ``.`` (i.e. directory from which Tangelo was invoked)
- SQLAlchemy-based visualization tutorial
- Plugins can now be specified without a path, causing Tangelo to look for a
  bundled plugin of that name
- New ``tangelo-pkgdata`` executable reports filesystem path to Tangelo package
  data

### Changed
- Cross-platform generation of ``tangelo`` and ``tangelo-passwd`` executable
  files (tested on Linux, Windows, and OS X)
- Loosened dependency requirement on CherryPy
- System path is no longer modified to make service module available to import
  system; instead, the current working directory is changed to that of the service file
- Configuration file is now typechecked at load time, including reporting of
  unexpected options, with errors resulting in fail-fast
- Plugins are now specified in the ``plugins`` entry of the main configuration
  file
- Plugins no longer require an ``enabled`` property; all plugins listed in the
  configuration file will be loaded
- Build process uses ``setuptools`` instead of ``distutils``
- Example webpage and bundled plugins are now treated as package data (i.e.,
  stored directly in ``site-packages``, etc.)

### Removed
- Service of web content from home directories
- ``tangelo.abspath()`` - web services should instead use
  ``tangelo.server.analyze_url()`` to learn the disk path for a given web resource
- ``systemd`` support materials, as well as plans to provide other system
  service helpers

### Fixed
- ``tangelo.plugin_config()`` works
- Python module path behaves correctly in plugin web directories
- ``tangelo.server.analyze()`` works better, especially for plugin development
- Informational log output now goes unilaterally to ``sys.stderr`` while access
  logs go to ``sys.stdout``
- Nodelink example fixed so that contents are visible

## [0.8.1] - 2015-01-16
### Fixed
- Search logic for default examples no longer fails on certain systems

## [0.8] - 2014-12-12
This release breaks backward compatibility with Tangelo 0.7 and previous.
Future releases will be described in this file as a change log against previous
releases, with 0.8 being the earliest such documented point.

### Added
- Plugin system
- Assorted API functions

### Changed
- Assorted API functions

### Removed
- Assorted API functions
