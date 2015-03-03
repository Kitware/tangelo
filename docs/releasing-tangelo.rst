=================================
    Creating Tangelo Releases
=================================

Tangelo is developed on GitHub using the `Git Flow
<http://nvie.com/posts/a-successful-git-branching-model/>`_ work style.  The
main development branch is named ``develop``, while all commits on ``master``
correspond to tagged releases.  Topic, hotfix, and release branches are all used
as described in the discussion in the link above.

This page documents the careful steps to take in creating a new release, meaning
that a new commit is made on ``master``, and a package is uploaded to the Python
Package Index.

Release Procedure
=================

Suppose for the sake of example that the last release's version number is *1.1*.
The following procedure will produce a new release of Tangelo:

**1. Merge all topic branches to develop.** Be sure that ``develop`` contains
the code from which you wish to create the new release.

**2. Create a release branch.** A release branch needs to be created off of
develop:

.. code-block:: shell

    git checkout -b release-1.2 develop

Note that the version number mentioned in the branch name is the version number
of the release being created.

**3. Bump the version number.** Edit the file ``package.json`` in the top level
of the repository, updating the version number to *1.2.0*.  Be sure to use the
*major.minor.patch* format.

Also edit ``js/tests/tangelo-version.js``, ``tests/tangelo-version.py``, and
``tests/commandline-version.py`` to bump the version numbers there manually (in
each file, the expected version string is contained in a variable named
``expected``).  This is done by hand to ensure that the version tests are
deployed correctly for step 6 below.

Finally, edit the file ``CHANGELOG.md`` in the root of the codebase.  Change the
``[Unreleased] - [unreleased]`` line near the top of the file to something like
``[1.2.0] - 2014-12-18``.  Look over the specified changes.  Edit these if
necessary, making sure that the list is up to date.

**4. Build Tangelo.** Issue the following commands to create a fresh build of
Tangelo from scratch:

.. code-block:: shell

    grunt clean:all
    npm install
    grunt

This should result in a virtual environment with a newly built Tangelo.  Bumping
the version number in the previous step means that Grunt should have also
updated the version string in all parts of the code that require it.

**5. Commit.** Make a commit on the release branch containing the version number
update:

.. code-block:: shell

    git commit -am "Bumping version number for release"

then visit http://localhost:8080/plugin/tangelo/version to verify the version
number there.  Finally, load up any of the examples that uses *tangelo.js*
(e.g., http://localhost:8080/plugin/vis/examples/barchart), and, in the console,
issue ``tangelo.version()`` to verify the clientside version number as well.

**6. Run the tests.**

Issue this command to verify that the client and server side tests all pass:

.. code-block:: shell

    grunt test

If any tests fail, fix the root causes, making commits and retesting as you go.
In particular, the tests regarding Tangelo version numbers will fail if the
version number bump or build process did not work properly for any reason.

**7. Merge into master.** Switch to the ``master`` branch and merge the release
branch into it:

.. code-block:: shell

    git checkout master
    git merge --no-ff release-1.2

Do not omit the ``--no-ff`` flag!  You can use the default merge commit message.

**8. Tag the release.** Create a tag for the release as follows:

.. code-block:: shell

    git tag -a v1.2

Use a commit message like "Release v1.2".  Be sure to push the tag so it becomes
visible to GitHub:

.. code-block:: shell

    git push --tags

**9. Upload the package to PyPI.**  Unpack the built package file, and then use
the ``upload`` option to ``setup.py``:

.. code-block:: shell

    cd sdist
    tar xzvf tangelo-1.2.0.tar.gz
    ../venv/bin/python setup.py sdist upload

**10. Merge into develop.** The changes made on the release branch must be
merged back into ``develop`` as well, so that development may continue there:

.. code-block:: shell

    git checkout develop
    git merge release-1.2

This is one of the few times you should not use the ``--no-ff`` flag.  We want
both ``master`` and ``develop`` to thread through the release branch to simplify
the graph view of the release.  After the next step, this leaves both ``master``
and ``develop`` one commit ahead of the same, prepared release branch point.

**11. Bump the version number again.**  The version number on the ``develop``
branch needs to be changed again, to add a *-dev* suffix.  In our example, the
version number will now be *1.2.0-dev*.  This entails editing ``package.json``
once more, as well as ``js/tests/tangelo-version.js``,
``tests/tangelo-version.py``, and ``tests/commandline-version.py``.

Also edit ``CHANGELOG.md`` again, reproducing a skeleton of a new changes
section, copying the following::

    ## [Unreleased] - [unreleased]
    ### Added

    ### Changed

    ### Deprecated

    ### Removed

    ### Fixed

    ### Security

This will allow developers to update the appropriate section easily whenever a
topic branch is merged to ``develop``.

**12. Test again.**  Run the tests one more time, to verify that the version
number bump happened correctly, and to catch anything weird that may have
happened as well.

**13. Commit.** Commit the change so that ``develop`` is ready to go:

.. code-block:: shell

    git commit -am "Bumping version number"

Summary
=======

You now have

* a new Tangelo package on PyPI.  Installing with ``pip install tangelo`` will
  install the new version to the system.

* a new, tagged commit on ``master`` that corresponds exactly to the new
  release, and the new package in PyPI.  Anyone who checks this out and builds
  it will have the same Tangelo they would have if installing via ``pip`` as
  above.

* a new commit on ``develop`` representing a starting point for further
  development.  Be sure to create topic branches off of ``develop`` to implement
  new features and bugfixes.
