===================
    Basic Usage
===================

Once it is set up and running, Tangelo's basic usage is relatively
straightforward.  This chapter explains how Tangelo serves web content, a best
practices guide for organizing your content, and how to use HTTP authentication
to protect your content.

Serving Web Content
===================

Tangelo's most basic purpose is **to serve web content**.  Once Tangelo is
running, it will serve content it finds in several places.

**User home directories.** If you visit a URL whose first path component begins
with a tilde ("~"), such as http://localhost:8080/~spock, Tangelo will attempt
to serve content from the ``tangelo_html`` directory of user ``spock``'s home
directory.  On a Linux system, this might be the directory
``/home/spock/tangelo_html``.

**Web root directory.** Visiting other URLs (that do not begin with a tilde)
will cause Tangelo to serve content out of the *web root directory*, which is
set in the Tangelo configuration file, or by the ``-r`` (or ``--root``) flag
when Tangelo is launched (see :doc:`setup`).  For example, if the web root
directory is set to ``/srv/tangelo/root``, visiting http://localhost:8080/ would
serve content from that directory, and visiting http://localhost:8080/foobar
would serve content from ``/srv/tangelo/root/foobar``, etc.

**The streaming and VTKWeb APIs.** The URLs :root:`/stream` and
:root:`/vtkweb` are **reserved**; they are the interfaces to the
Streaming and VTKWeb APIs, respectively.  Files in the web root directory named
``stream`` and ``vtkweb`` *will not be served by Tangelo*.  (For more
information about these APIs, see :ref:`streaming` and :ref:`vtkweb`.)

The foregoing examples demonstrate how Tangelo associates URLs to directories
and files in the filesystem.  URLs referencing particular files will cause
Tangelo to serve that file immediately.  URLs referencing a directory behave
according to the following cascade of rules:

#. If the directory contains a file named ``index.html``, that file will be
   served.

#. Otherwise, if the directory contains a file named ``index.htm``, that file
   will be served.

#. Otherwise, Tangelo will generate a directory listing for that directory and
   serve that.  This listing will include hyperlinks to the files contained
   therein.

As mentioned already, the URLs :root:`/stream` and
:root:`/vtkweb` are special and do not serve any static content
from disk.  Similarly, a URL referring to a Python script, but lacking the final
``.py``, names a *web service*; such URLs do not serve static content, but
rather run the referred Python script and serve the results (see
:doc:`python-services`).

The following table summarizes Tangelo's URL types:

=================== =========================================== ================================================================================
 URL type                             Example                                     Behavior
=================== =========================================== ================================================================================
Home directory      http://localhost:8080/~troi/schedule.html   serve ``/home/troi/tangelo_html/schedule.html``
Web root            http://localhost:8080/holodeck3/status.html serve ``/srv/tangelo/root/holodeck3/status.html``
Indexed directory   http://localhost:8080/tenforward            serve ``/srv/tangelo/root/tenforward/index.html``
Unindexed directory http://localhost:8080/warpdrive             serve directory listing for ``/srv/tangelo/root/warpdrive``
Web service         http://localhost:8080/lcars/lookup          serve result of executing ``run()`` function of ``/srv/tangelo/lcars/lookup.py``
Streaming           http://localhost:8080/stream/id12345        serve result of running stream ``id12345`` for one step
VTKWeb              http://localhost:8080/vtkweb/id23456        serve readouts of ``stdout`` and ``stderr`` from VTK process ``id23456``
=================== =========================================== ================================================================================

HTTP Authentication
===================

Tangelo supports `HTTP Digest Authentication
<http://www.ietf.org/rfc/rfc2617.txt>`_ to password protect web directories.
The process to protect a directory is as follows:

#. Go to the directory you wish to protect: ::

    cd ~laforge/tangelo_html/DilithiumChamberStats

   The idea is, this directory (which is accessible on the web as
   http://localhost:8080/~laforge/DilithiumChamberStats) contains sensitive
   information, and should be restricted to just certain people who have a
   password.

#. Create a file there called ``.htaccess`` and make it look like the following
   example, customizing it to fit your needs: ::

    AuthType digest
    AuthRealm USS Enterprise NCC-1701-D
    AuthPasswordFile /home/laforge/secret/dilithiumpw.txt

   This file requestes digest authnetication on the directory, sets the
   *authentication realm* to be the string "USS Enterprise NCC-1701-D", and
   specifies that the acceptable usernames and passwords will be found in the
   file ``/home/laforge/secret/dilithiumpw.txt``.

   Currently, the only supported authentication type is digest.  The realm will
   be displayed to the user when prompted for a username and password.

#. Create the password file, using the ``tangelo-passwd`` program (see
   :doc:`tangelo-passwd-manpage`): ::

    $ tangelo-passwd -c ~laforge/secret/dilithiumpw.txt "USS Enterprise NCC-1701-D" picard
    Enter password for picard@USS Enterprise NCC-1701-D: <type password here>
    Re-enter password: <retype password here>

   This will create a new password file.  If you inspect the file, you will see
   a user ``picard`` associated with an md5 hash of the password that was
   entered.  You can add more users by repeating the command without the ``-c``
   flag, and changing the username.

   At this point, the directory is password protected - when you visit the page,
   you will be prompted for a username and password, and access to the page will
   be restricted until you provide valid ones.
