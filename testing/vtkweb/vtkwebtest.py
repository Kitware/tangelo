import datetime
import itertools
import time
import types

from selenium import webdriver

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


def wait_with_timeout(delay=None, limit=None, criterion=None):
    for i in itertools.count():
        if criterion():
            return True
        elif delay * i > limit:
            return False
        else:
            time.sleep(delay)

browsers = ["firefox", "chrome", "internet_explorer"]
Browsers = type("Enum", (), {k: i for i, k in enumerate(browsers)})


class WebTest(object):
    class Abort:
        pass

    def __init__(self, size=None, url=None, browser=None):
        self.size = size
        self.url = url
        self.browser = browser

        self.window = None

    def run_test(self):
        result = None
        try:
            self.initialize()
            self.setup()
            self.capture()
            result = self.postprocess()
        except WebTest.Abort:
            result = 1

        self.cleanup()
        return result

    def initialize(self):
        if self.browser is None or self.browser == Browsers.chrome:
            self.window = webdriver.Chrome()
        elif self.browser == Browsers.firefox:
            self.window = webdriver.Firefox()
        elif self.browser == Browsers.internet_explorer:
            self.window = webdriver.Ie()
        else:
            raise ValueError("self.browser argument has illegal value %r" %
                             (self.browser))

        if self.size is not None:
            self.window.set_window_size(self.size[0], self.size[1])

        if self.url is not None:
            self.window.get(self.url)

    def setup(self):
        pass

    def capture(self):
        self.filename = "%s-%s.png" % (self.__class__name, now())
        self.window.save_screenshot(filename)

    def postprocess(self):
        pass

    def cleanup(self):
        self.window.quit()


class CDashImageComparator(WebTest):
    def __init__(self, filepat=None, baseline=None, **kwargs):
        if filepat is None:
            raise TypeError("missing argument 'filepat'")
        if baseline is None:
            raise TypeError("missing argument 'baseline'")

        WebTest.__init__(self, **kwargs)
        self.filepat = filepat
        self.baseline = baseline

    def capture(self):
        self.filename = self.filepat % (now())
        self.window.save_screenshot(self.filename)

    def postprocess(self):
        compare_images(self.filename, self.baseline)
