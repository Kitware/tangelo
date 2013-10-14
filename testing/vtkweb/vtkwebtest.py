import datetime
import itertools

import vtk

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
