# Change Log
A list of per-release changes in the Tangelo codebase.  Tangelo uses [semantic
versioning](http://semver.org).

## [Unreleased] - [unreleased]
### Added
- This change log file
- Improvements to style testing
- Improvements to coverage testing
- Serverside and command line version tests
- Cross-platform generation of ``tangelo`` and ``tangelo-passwd`` executable
  files (tested on Linux, Windows, and OS X)

### Changed

### Deprecated

### Removed
- Service of web content from home directories
- ``tangelo.abspath()`` - web services should instead use
  ``tangelo.server.analyze_url()`` to learn the disk path for a given web resource

### Fixed
- ``tangelo.plugin_config()`` works
- Python module path behaves correctly in plugin web directories

### Security

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
