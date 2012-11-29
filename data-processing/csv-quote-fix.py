import argparse
import sys

if __name__ == '__main__':
    # Parse command line arguments.
    parser = argparse.ArgumentParser(description="Attempt to fix incorrectly escape quotation marks in CSV files.")

    parser.add_argument("-i", "--input", nargs='?', type=argparse.FileType('r'), default=sys.stdin, help="input file (defaults to stdin)")
    parser.add_argument("-o", "--output", nargs='?', type=argparse.FileType('w'), default=sys.stdout, help="output file (defaults to stdout")
    parser.add_argument("-c", "--continue", action='store_true', help="continues processing even upon finding a bad line")

    args = vars(parser.parse_args())

    # Extract argument values.
    infile = args['input']
    outfile = args['output']
    stop = not args['continue']

    # Convenience variable for error messages.
    progname = sys.argv[0]

    # Define some states.
    UNQUOTED = 0     # The base state - each line should begin and end in this state.
    QUOTED = 1       # Enter this state upon encountering a quotation mark.
    QUOTED_AGAIN = 2 # Enter this state upon seeing a quotation mark while in the QUOTED state.

    # Process the input line by line.
    count = 0
    for line in infile:
        state = UNQUOTED
        count = count + 1
        out = ''

        for c in line:
            # When a quoted string has not appeared yet, a quotation mark puts
            # us into the QUOTED state.  Regardless of what character appears,
            # it is echoed in the output.
            if state == UNQUOTED:
                if c == '"':
                    state = QUOTED
                out = out + c

            # When a quotation mark appears in a quoted string, we drop into the
            # QUOTED_AGAIN state (that state handles what exactly to do based on
            # the *next* character in the stream).  The character seen is echoed
            # immediately to the output.
            elif state == QUOTED:
                if c == '"':
                    state = QUOTED_AGAIN
                out = out + c

            # In the QUOTED_AGAIN state, the next character always brings us to
            # a different state (and possibly generating extra characters for
            # the output stream), depending on what character is seen.
            # Regardless of which character it is, it will be echoed to the
            # output.
            elif state == QUOTED_AGAIN:
                if c == '"':
                    # If the character is a quotation mark, this represents a
                    # correctly escaped embedded qutation mark, and nothing
                    # needs to be done (aside from dropping back into the QUOTED
                    # state).
                    state = QUOTED
                elif c == ',' or c == '\n':
                    # If the character is a comma or an EOL, the preceding
                    # quotation mark signals the "closing" of a quoted string,
                    # so move back into the UNQUOTED state.
                    state = UNQUOTED
                else:
                    # Any other character following a single quotation mark
                    # while in the QUOTED state is assumed to signal an
                    # improperly escaped, embedded qutation mark.  To fix it,
                    # emit a quotation mark and move back into the QUOTED state.
                    out = out + '"'
                    state = QUOTED
                out = out + c

            else:
                # This branch represents an unknown state.
                raise RuntimeError("illegal state value '%d'" % (state))

        # After processing the line, the state should be UNQUOTED - if it is
        # not, it means there is a severe problem in the line that needs to be
        # reported.
        if state != UNQUOTED:
            print >>sys.stderr, "%s: fatal error on line %d: <<%s>> (final state %d)" % (progname, count, line.strip(), state)
            if stop:
                sys.exit(1)

        # Write the output line to the output.
        outfile.write(out)
