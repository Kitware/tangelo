import __builtin__
import imp
import os
import sys
import tangelo

builtin_import = __builtin__.__import__
tangelo_module_cache_get = tangelo.util.module_cache_get


WatchList = {}


def latest_submodule_time(module, mtime=0, processed=[]):
    """
    Determine the latest time stamp of all submodules of a module.  This should
    be called from a thread that has acquired the import lock to be thread
    safe.

    :param module: the module name.  The WatchList is checked for modules that
                   list this as a parent.
    :param mtime: the latest module time known to this point.
    :param processed: a list of modules that were processed (to avoid infinite
                      recursion).
    :returns: the latest module mtime.
    """
    if module.endswith('.py'):
        module = module[:-3]
    if module in processed:
        return mtime
    processed.append(mtime)
    for key in WatchList:
        if WatchList[key]['parent'] == module:
            filemtime = module_getmtime(WatchList[key]['file'])
            if filemtime:
                mtime = max(mtime, filemtime)
            mtime = latest_submodule_time(key, mtime, processed)
    return mtime


def module_getmtime(filename):
    """
    Get the mtime associated with a module.  If this is a .pyc or .pyo file and
    a corresponding .py file exists, the time of the .py file is returned.

    :param filename: filename of the module.
    :returns: mtime or None if the file doesn't exist.
    """
    if os.path.splitext(filename)[1].lower() in ('.pyc', '.pyo') and os.path.exists(filename[:-1]):
        return os.path.getmtime(filename[:-1])
    if os.path.exists(filename):
        return os.path.getmtime(filename)
    return None


def module_reload_changed(key):
    """
    Reload a module if it has changed since we last imported it.  This is
    necssary if module a import script b, script b is changed, and the module
    c asks to import script b.

    :param key: our key used in the WatchList.
    :returns: True if reloaded.
    """
    imp.acquire_lock()
    try:
        modkey = module_sys_modules_key(key)
        if not modkey:
            return False
        found = None
        if modkey:
            for second in WatchList:
                secmodkey = module_sys_modules_key(second)
                if secmodkey and sys.modules[modkey] == sys.modules[secmodkey]:
                    found = second
                    foundmodkey = secmodkey
                    break
        if not found:
            return
        filemtime = module_getmtime(WatchList[found]['file'])
        if filemtime > WatchList[found]['time']:
            tangelo.log('Reloaded %s' % found)
            reload(sys.modules[foundmodkey])
            for second in WatchList:
                if WatchList[second]['file'] == WatchList[found]['file']:
                    WatchList[second]['time'] = filemtime
    finally:
        imp.release_lock()
    return True


def module_sys_modules_key(key):
    """
    Check if a module is in the sys.modules dictionary in some manner.  If so,
    return the key used in that dictionary.

    :param key: our key to the module.
    :returns: the key in sys.modules or None.
    """
    moduleparts = key.split('.')
    for partnum, part in enumerate(moduleparts):
        modkey = '.'.join(moduleparts[partnum:])
        if modkey in sys.modules:
            return modkey
    return None


def reload_recent_submodules(module, mtime=0, processed=[]):
    """
    Recursively reload submodules which are more recent than a specified
    timestamp.  To be called from a thread that has acquired the import lock to
    be thread safe.

    :param module: the module name.  The WatchList is checked for modules that
                   list this as a parent.
    :param mtime: the latest module time known to this point.
    :param processed: a list of modules that were processed (to avoid infinite
                      recursion).
    :returns: True if any submodule was reloaded.
    """
    if module.endswith('.py'):
        module = module[:-3]
    if module in processed:
        return False
    any_reloaded = False
    for key in WatchList:
        if WatchList[key]['parent'] == module:
            reloaded = reload_recent_submodules(key, mtime, processed)
            filemtime = module_getmtime(WatchList[key]['file'])
            any_reloaded = any_reloaded or reloaded
            if reloaded or filemtime > WatchList[key]['time']:
                WatchList[key]['time'] = filemtime
                for second in WatchList:
                    if second != key and WatchList[second]['file'] == WatchList[key]['file']:
                        WatchList[second]['time'] = filemtime
                modkey = module_sys_modules_key(key)
                if modkey:
                    try:
                        reload(sys.modules[modkey])
                        tangelo.log('Reloaded %s' % modkey)
                    except ImportError:
                        del sys.modules[modkey]
                        tangelo.log('Asking %s to reimport' % modkey)
                    any_reloaded = True
    return any_reloaded


def watch_import(name, globals=None, *args, **kwargs):
    """
    When a module is asked to be imported, check if we have previously imported
    it.  If so, check if the time stamp of it, a companion yaml file, or any
    modules it imports have changed.  If so, reimport the module.

    :params: see __builtin__.__import__
    """
    # Don't monitor builtin modules.  types seem special, so don't monitor it
    # either.
    monitor = not imp.is_builtin(name) and name not in ('types', )
    # Don't monitor modules if we don't know where they came from
    monitor = monitor and isinstance(globals, dict) and globals.get('__name__')
    if not monitor:
        return builtin_import(name, globals, *args, **kwargs)
    # This will be the dotted module name except for service modules where it
    # will be the absolute file path.
    parent = globals['__name__']
    key = parent + '.' + name
    module_reload_changed(key)
    try:
        module = builtin_import(name, globals, *args, **kwargs)
    except ImportError:
        raise
    if getattr(module, '__file__', None):
        if key not in WatchList:
            tangelo.log_debug('WATCH', 'Monitoring import %s from %s' % (name, parent))
        imp.acquire_lock()
        try:
            if key not in WatchList:
                WatchList[key] = {
                    'time': module_getmtime(module.__file__) or 0
                }
            WatchList[key].update({
                'parent': parent,
                'name': name,
                'file': module.__file__
            })
        finally:
            imp.release_lock()
    return module


def watch_module_cache_get(cache, module):
    """
    When we ask to fetch a module with optional config file, check time stamps
    and dependencies to determine if it should be reloaded or not.

    :param cache: the cache object that stores whether to check for config
                  files and which files have been loaded.
    :param module: the path of the module to load.
    :returns: the loaded module.
    """
    imp.acquire_lock()
    try:
        if not hasattr(cache, 'timestamps'):
            cache.timestamps = {}
        mtime = os.path.getmtime(module)
        mtime = latest_submodule_time(module, mtime)
        if getattr(cache, 'config', False):
            config_file = module[:-2] + "yaml"
            if os.path.exists(config_file):
                # Our timestamp is the latest time of the config file or the
                # module.
                mtime = max(mtime, os.path.getmtime(config_file))
            # If we have a config file and the timestamp is more recent than
            # the recorded timestamp, remove the config file from the list of
            # loaded files so that it will get loaded again.
            if config_file in cache.config_files and mtime > cache.timestamps.get(module, 0):
                del cache.config_files[config_file]
                tangelo.log('WATCH', 'Asking to reload config file %s' % config_file)
        # If the timestamp is more recent than the recorded value, remove the
        # the module from our records so that it will be loaded again.
        if module in cache.modules and mtime > cache.timestamps.get(module, 0):
            del cache.modules[module]
            tangelo.log('WATCH', 'Asking to reload module %s' % module)
        if module not in cache.timestamps:
            tangelo.log_debug('WATCH', 'Monitoring module %s' % module)
        reload_recent_submodules(module, mtime)
        cache.timestamps[module] = mtime
        service = tangelo_module_cache_get(cache, module)
        # Update our time based on all the modules that we may have just
        # imported.  The times can change from before because python files are
        # compiled, for instance.
        mtime = latest_submodule_time(module, mtime)
        cache.timestamps[module] = mtime
    finally:
        imp.release_lock()
    return service


__builtin__.__import__ = watch_import
tangelo.util.module_cache_get = watch_module_cache_get
tangelo.log_info('WATCH', 'Starting plugin watch')
