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

Suppose that all extant topic branches have been merged to ``develop``, and
suppose the last release's version number is *1.1*.  The following procedure
will produce a new release of Tangelo:

**1. Create a release branch.** A release branch needs to be created off of
develop:

.. code-block:: shell

    git checkout -b release-1.2 develop

Note that the version number mentioned in the branch name is the version number
of the release being created.

**2. Bump the version number.** Edit the file ``package.json`` in the top level
of the repository, updating the version number to *1.2.0*.  Be sure to use the
*major.minor.patch* format.

**3. Commit.** Make a commit on the release branch containing the version number
update:

.. code-block:: shell

    git commit -am "Bumping version number for release"

**3. Build Tangelo.** Issue the following commands to create a fresh build of
Tangelo from scratch:

.. code-block:: shell

    grunt clean:all
    npm install
    grunt

This should result in a virtual environment with a newly built Tangelo.

**4. Verify the version number.** Run

.. code-block:: shell

    tangelo --version

to make sure the version number was updated properly.  Additionally, start
Tangelo with

.. code-block:: shell

    grunt serve

then visit http://localhost:8080/plugin/tangelo/version to verify the version
number there.  Finally, load up any of the examples that uses *tangelo.js*
(e.g., http://localhost:8080/plugin/vis/examples/barchart), and, in the console,
issue ``tangelo.version()`` to verify the clientside version number as well.

**5. Run the tests.**

Issue this command:

.. code-block:: shell

    grunt test

To verify that the client and server side tests all pass.  If any tests fail,
fix the root causes, making commits and retesting as you go.

**6. Merge into master.** Switch to the ``master`` branch:

.. code-block:: shell

    git checkout master

and merge the release branch into it:

.. code-block:: shell

    git merge --no-ff release-1.2

Do not omit the ``--no-ff`` flag!  The commit message should read "Release
1.2".

**7. Tag the release.** Create a tag for the release as follows:

.. code-block:: shell

    git tag -a v1.2
    git push --tags

**8. Upload the package to PyPI.**  Unpack the built package file, and then use
the ``upload`` option to ``setup.py``:

.. code-block:: shell

    cd sdist
    tar xzvf tangelo-1.2.0.tar.gz
    ../venv/bin/python setup.py sdist upload

**9. Merge into develop.** The changes made on the release branch must be
merged back into ``develop`` as well, so that development may continue there:

.. code-block:: shell

    git checkout develop
    git merge --no-ff release-1.2

Again, do not forget the ``--no-ff`` flag.

**10. Bump the version number again.**  The version number on the ``develop``
branch needs to be changed again, to add a *-dev* suffix.  In our example, the
version number will now be *1.2.0-dev*.

**11. Commit.** Commit the change so that ``develop`` is ready to go:

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
