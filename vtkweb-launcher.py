r"""
    This module is a VTK Web server application.
    The following command line illustrate how to use it::

        $ vtkpython .../vtk_web_tree.py

    Any VTK Web executable script come with a set of standard arguments that
    can be overriden if need be::

        --port 8080
             Port number on which the HTTP server will listen to.

        --content /path-to-web-content/
             Directory that you want to server as static web content.
             By default, this variable is empty which mean that we rely on another server
             to deliver the static content and the current process only focus on the
             WebSocket connectivity of clients.

        --authKey vtk-secret
             Secret key that should be provided by the client to allow it to make any
             WebSocket communication. The client will assume if none is given that the
             server expect "vtk-secret" as secret key.
"""

# import to process args
import sys
import os

# import vtk modules.
#import vtk
from vtkweb import web, vtkweb_wamp, vtkweb_protocols

# import annotations
from autobahn.wamp import exportRpc

try:
    import argparse
except ImportError:
    # since  Python 2.6 and earlier don't have argparse, we simply provide
    # the source for the same as _argparse and we use it instead.
    import _argparse as argparse

# =============================================================================
# Create custom File Opener class to handle clients requests
# =============================================================================

class VTKWebApp(vtkweb_wamp.ServerProtocol):
    # Application configuration
    view    = None
    authKey = "vtkweb-secret"

    def __init__(self, args):
        self.args = args

    def initialize(self):
        #global renderer, renderWindow, renderWindowInteractor, cone, mapper, actor

        # Bring used components
        self.registerVtkWebProtocol(vtkweb_protocols.vtkWebMouseHandler())
        self.registerVtkWebProtocol(vtkweb_protocols.vtkWebViewPort())
        self.registerVtkWebProtocol(vtkweb_protocols.vtkWebViewPortImageDelivery())
        self.registerVtkWebProtocol(vtkweb_protocols.vtkWebViewPortGeometryDelivery())

        # Update authentication key to use
        self.updateSecret(VTKWebApp.authKey)

        if "initialize" in usermod.__dict__:
            usermod.initialize(self, VTKWebApp, self.args)

# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    # Get the full path to the user's application file.
    if len(sys.args) < 2:
        sys.exit(1)
    userfile = args[1]

    # Import the user file as a module.
    try:
        usermod = imp.load_source("usermod", userfile)
    except ImportError:
        sys.exit(2)

    # Create argument parser
    parser = argparse.ArgumentParser(description="Tangelo/VTKWeb application")

    # Add default arguments
    web.add_arguments(parser)

    # Add local arguments, if any are specified in the user module.
    try:
        usermod.add_arguments(parser)
    except AttributeError:
        pass

    # Extract arguments (dropping the "usermodule" argument first).
    args = parser.parse_args([sys.argv[0]] + [sys.argv[2:]])

    # Configure our current application
    VTKWebApp.authKey = args.authKey

    # Start server
    web.start_webserver(options=args, protocol=VTKWebApp)
