import datetime
import itertools
import time
import types

import vtk

from selenium.common.exceptions import NoSuchElementException

def now():
    return datetime.datetime.now().strftime("%Y-%m-%d-%H:%M:%S")

def compare_images(test_img, baseline_img):
    # Create a vtkTesting object, and tell it to use the current directory as
    # the "baseline root directory", and specify the name of the baseline image
    # file itself.
    t = vtk.vtkTesting()
    t.AddArgument("-B")
    t.AddArgument(".")
    t.AddArgument("-V")
    t.AddArgument(baseline_img)

    # Perform the image comparison test and print out the result.
    t.RegressionTest(test_img, 0.0)

def wait_with_timeout(delay=None, limit=None, criterion=None):
    for i in itertools.count():
        if criterion():
            return True
        elif delay * i > limit:
            return False
        else:
            time.sleep(delay)

def found_viewport(browser):
    def func():
        try:
            browser.find_element_by_css_selector("[__vtkweb_viewport__=true]")
            return True
        except NoSuchElementException:
            return False

    return func
