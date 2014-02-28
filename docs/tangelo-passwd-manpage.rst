==========================
    ``tangelo-passwd``
==========================

tangelo-passwd [-h] [-c] passwordfile realm user

Edit .htaccess files for Tangelo

=================== ====================
Positional argument Meaning
=================== ====================
passwordfile        Password file
realm               Authentication realm
user                Username
=================== ====================

================= ===============================
Optional argument Effect
================= ===============================
-h, --help        Show this help message and exit
-c, --create      Create new password file
================= ===============================

Example Usage
=============

To create a new password file: ::

    tangelo-passwd -c secret.txt romulus tomalak

(Then type in the password as prompted.)

To add a user to the file: ::

    tangelo-passwd secret.txt Qo\'noS martok

(Again, type in password.)

To overwrite a new password file on top of the old one: ::

    tangelo-passwd -c secret.txt betazed troi
