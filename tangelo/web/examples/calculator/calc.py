allowed = ["add", "subtract", "multiply", "divide"]

def run(operation, a=None, b=None):
    if a is None:
        return "Parameter 'a' is missing!"
    elif b is None:
        return "Parameter 'b' is missing!"

    try:
        a = float(a)
    except ValueError:
        return "Argument 'a' ('%s') must be a number!" % (a)

    try:
        b = float(b)
    except ValueError:
        return "Argument 'b' ('%s') must be a number!" % (b)

    try:
        if operation == "add":
            return a + b
        elif operation == "subtract":
            return a - b
        elif operation == "multiply":
            return a * b
        elif operation == "divide":
            return a / b
        else:
            return "Unsupported operation: %s\nAllowed operations are: %s" % (operation, ", ".join(allowed))
    except ValueError:
        return "Could not %s '%s' and '%s'" % (operation, a, b)
    except ZeroDivisionError:
        return "Can't divide by zero!"
