Coding Style Guidelines
=======================

JavaScript is
`notorious <http://shop.oreilly.com/product/9780596517748.do>`__ for its
mix of powerful, expressive programming constructs and its poor,
sometimes broken language features. It is therefore prone to easily
hidden, difficult to track programming errors. To mitigate this problem,
Tangelo avoids many of the poor practices by using
`JSLint <http://www.jslint.com>`__ to enforce strict coding practices.
JSLint is a static analysis tool that warns about several such poor
coding practices, as well as a particular stylistic convention, which is
documented in this article.

Though JSLint is used as something of a gold standard, there are other
conventions that JSLint has no opinion on, such as programming patterns
for implementing namespaces or constructing objects. The preferred
practices for Tangelo are also listed here.

Code style
----------

This section concerns written code *format*, with the goal of clear,
readbale, and consistent code.

Indentation
~~~~~~~~~~~

Indentation is used to provide visual cues about the syntactic scope
containing particular line of code. Good indentation practice
dramaticaly improves code readability.

**Four-space indentation.** Each additional indentation level shall be
exactly four spaces.

**Indentation policy.** The following structures shall require
incrementing the indentation level:

*Statements belonging to any block.*

*Chained function calls:*

::

    obj.call1()
        .call2()
        .call3();

*Properties in a literal object:*

::

    obj = {
        prop1: 10,
        prop2: 3
    };

**Curly bracket placement.** The left curly bracket that introduces a
new indentation level shall appear at the end of the line that uses it;
the right curly bracket that delimits the indented statements shall
appear on the line following the last indented statement, at the
decremented indentation:

::

    [some statement...] {
                        ^
        .
        .
        .
    }
    ^

Naming
~~~~~~

Use ``camelCase`` for visualization, property, method, and local variable names.

Curly brackets
~~~~~~~~~~~~~~

JavaScript uses curly brackets to delimit blocks. Blocks are required by
the language when functions are defined. They are also required for
executing more than one statement within control flow constructs such as
``if`` and ``while``. While the option exists *not* to use curly
brackets for a single statement in such cases, that practice can lead to
errors (when, e.g., a new feature requires the single statement to be
replaced by several statements).

**Always use blocks in control flow statements.** Every use of control
flow operators (``if``, ``while``, ``do``) shall use curly brackets for
its associated statement block, even if only a single statement appears
therein.

Space placement
~~~~~~~~~~~~~~~

Parentheses are required in several places in JavaScript. Proper space
placement can help make such constructs more readable.

**Keyword-condition separation.** A single space shall appear in the
following situations.

*Between a control-flow operator and its parenthesized condition:*

::

    if (condition...) {
      ^

*Between a parenthesized condition and its following curly bracket:*

::

    if (condition...) {
                     ^

*Between a function argument list and its following curly bracket:*

::

    function foobar(x, y, z) {
                            ^

*Between the* ``function`` *keyword and the argument list, in anonymous
functions:*

::

    f = function (a, b) {
                ^

*After every comma.*

*On either side of a binary operator:*

::

    x = 3 + 4;
         ^ ^

**Extraneous spaces.** The last character in any given line shall not be
a space.

**Blank lines.** Blank lines should be used to set apart sequences of
statements that logically belong together.

Chained if/else-if/else statements.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A common programming pattern is to test a sequence of conditions,
selecting a single action to take when one of them is satisfied. In
JavaScript, this is accomplished with an ``if`` block followed by a
number of ``else if`` blocks, followed by an ``else`` block.
``try catch`` blocks have a similar syntax.

**Single line** ``else if``, ``else``, **and** ``catch``. The ``else if``,
``else``, and ``catch`` keyword phrases shall appear on a single line,
with a right curly bracket on their left and a left curly bracket on
their right:

::

    if (condition) {
        action();
    } else if {
        other_action();
    } else {
        default_action();
    }

``new Array`` and ``new Object``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The ``new`` keyword is problematic in JavaScript. If it is omitted by
mistake, the code will run without error, but will not do the right
thing. Furthermore, built in constructors like ``Array`` and ``Object``
can be reimplemented by other code.

**Use** ``[]`` **and** ``{}``. All construction of arrays and objects shall
use the literal ``[]`` and ``{}`` syntax. The sequence of statements
``x = [];``, then ``x.length = N;`` shall replace ``new Array(N)``.

Code structure
--------------

This section concerns the structure of functions and modules, how
constructs at a larger scale than individual statements and expressions
should be handled.

JSLint directives
~~~~~~~~~~~~~~~~~

JSLint reads two special comments appearing at the top of files it is
working on. The first appears in the following form:

::

    /*jslint browser: true */

and specifies options to JSLint. Because Tangelo is a web project,
every JavaScript file should have the comment that appears above as the
first line. The other recognized directive in the global name list:

::

    /*globals d3, $, FileReader */

This directive prevents JSLint from complaining that the listed names
are global variables, or undefined. It is meant for valid names, such as
standard library objects or linked libraries used in the file.

Lexical scopes
~~~~~~~~~~~~~~

JavaScript has only two scope levels: *global* and *function*. In
particular, blocks following, e.g., ``for`` and ``if`` statements *do
not introduce an inner scope*. Despite this fact, JavaScript allows for
variables to be declared within such blocks, causing seasoned C and C++
programmers to assume something false about the lifetime of such
variables.

**Single** ``var`` **declaration.** Every function shall contain a single
``var`` declaration as its first statement, which shall list every local
variable used by that function, listed one per line.

::

    function foobar(){
        var width,
            height,
            i;
        .
        .
        .
    }

This declaration statement shall **not** include any initializers (this
promotes clearer coding, as the "initializers" can be moved below the
declaration, and each one can retain its own comment to explain the
initialization).

**Global variables.** Global variables shall **not** be used, unless as
a namespace-like container for variables and names that would otherwise
have to be global. When such namespace-like containers are used in a
JavaScript file, they shall appear in the JSLint global name specifier.

Strict Mode
~~~~~~~~~~~

JavaScript has a "strict mode" that disallows certain actions
technically allowed by the language. These are such things as using
variables before they are defined, etc. It can be enabled by including
``"use strict";`` as the first statement in any function:

::

    function foobaz() {
        "use strict";
        .
        .
        .
    }

**Strict mode functions.** All functions shall be written to use strict
mode.

A note on ``try...catch`` blocks
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

JSLint complains if the exception name bound to a ``catch`` block is the
same as the exception name bound to a previous ``catch`` block. This is
due to an ambiguity in the ECMAScript standard regarding the semantics
of ``try...catch`` blocks. Because using a unique exception name in each
``catch`` block just to avoid errors from JSLint seems to introduce just
as much confusion as it avoids, the current practice is **not** to use
unique exception names for each ``catch`` block.

**Use** ``e`` **for exception name.** ``catch`` blocks may all use the name
``e`` for the bound exception, to aid in scanning over similar messages
in the JSLint output. **This rule is subject to change in the future.**

A note on *"eval is evil"*
~~~~~~~~~~~~~~~~~~~~~~~~~~

JSLint claims that ``eval`` is evil. However, it is actually
*dangerous*, and not evil. Accordingly, ``eval`` should be kept away
from most JavaScript code. However, to take one example, one of 
Tangelo's main dependencies, Vega, makes use of compiler technology that generates
JavaScript code. ``eval``\ ing this code is reasonable and necessary in
this instance.

**eval is misunderstood.** If a JavaScript file needs to make use of
``eval``, it shall insert an ``evil: true`` directive into the JSLint
options list. All other JavaScript files shall **not** make use of
``eval``.
