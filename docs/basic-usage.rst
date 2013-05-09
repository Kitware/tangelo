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
the ``web`` subdirectory of the directory where Tangelo is deployed (see
:doc:`installation`).  For example, if Tangelo has been deployed to
``/opt/tangelo``, the web root directory would be ``/opt/tangelo/web``, visiting
http://localhost:8080/ would serve content from ``/opt/tangelo/web``, and
visiting http://localhost:8080/app would serve content from
``/opt/tangelo/web/app``, etc.

**The streaming API.** The URL http://localhost:8080/stream is **reserved**; it
is the interface to the Streaming API.  If there is a file or directory in the
web root directory named ``stream``, *it will not be served by Tangelo*.

The foregoing examples demonstrate how Tangelo associates URLs to directories
and files in the filesystem.  URLs referencing particular files will cause
Tangelo to serve that file immediately.  URLs reference a directory behave
according to the following cascade of rules:

#. If the directory contains a file named ``index.html``, that file will be
   served.

#. Otherwise, if the directory contains a file named ``index.htm``, that file
   will be served.

#. Otherwise, Tangelo will generate a directory listing for that directory and
   serve that.  This listing will include hyperlinks to the files contained
   therein.

As mentioned already, the URL http://localhost:8080/stream is special and does
not serve any static content from disk.  Similarly, a URL referring to a Python
script, but lacking the final ``.py``, names a *web service*; such URLs do not
serve static content, but rather run the referred Python script and serve the
results (see :doc:`python-services`).

.. todo::
    Summarize the URL types in a table.

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
