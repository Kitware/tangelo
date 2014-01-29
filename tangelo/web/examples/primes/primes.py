import itertools
import math

def is_prime(v):
    for i in range(2, int(math.ceil(math.sqrt(v))+1)):
        if v % i == 0:
            return False
    return True

def primes():
    yield 2
    yield 3

    for i in itertools.count(start=5, step=2):
        if is_prime(i):
            yield i

def run():
    return primes()
