import argparse
import sys
import time

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains

import vtkwebtest


def found_viewport(browser):
    def func():
        try:
            browser.find_element_by_css_selector("[__vtkweb_viewport__=true]")
            return True
        except NoSuchElementException:
            return False

    return func


class TangeloVTKWebTest(vtkwebtest.CDashImageComparator):
    def __init__(self, name=None, **kwargs):
        if name is None:
            raise ValueError("'name' argument cannot be None")
        vtkwebtest.CDashImageComparator.__init__(self,
                                                 filepat="%s-%%s.png" % (name),
                                                 size=(952, 718), **kwargs)


class ConeTest(TangeloVTKWebTest):
    def __init__(self, **kwargs):
        TangeloVTKWebTest.__init__(self,
                                   name="cone",
                                   baseline="baseline-cone.png",
                                   **kwargs)

    def setup(self):
        try:
            button = self.window.find_element_by_link_text("Cone")
        except NoSuchElementException:
            print >>sys.stderr, ("fatal error: could not " +
                                 "find the 'Cone' button!")
            print >>sys.stderr, "(visit %s to diagnose the problem)" % (url)
            raise vtkwebtest.WebTest.Abort()

        button.click()

        # Wait for the vtkweb process to start (but time out after 10 seconds).
        if not vtkwebtest.wait_with_timeout(
                delay=0.5,
                limit=10,
                criterion=found_viewport(self.window)):
            print >>sys.stderr, ("fatal error: timed out while waiting " +
                                 "for vtkweb process to start")
            raise vtkwebtest.WebTest.Abort()

        # Grab the viewport element so we know where to put the mouse.
        div = self.window.find_element_by_id("viewport")

        # Click-and-drag on the cone to change its position a bit.
        drag = ActionChains(self.window)
        drag.move_to_element(div)
        drag.click_and_hold()
        drag.move_by_offset(-300, 100)
        drag.release()
        drag.perform()

        # Give the page some time to update the image.
        time.sleep(1)


class PhylotreeTest(TangeloVTKWebTest):
    def __init__(self, **kwargs):
        TangeloVTKWebTest.__init__(self,
                                   name="phylotree",
                                   baseline="baseline-phylotree.png",
                                   **kwargs)

    def setup(self):
        # Click on the PhyloTree app launcher and wait for it to load.
        try:
            button = self.window.find_element_by_link_text("PhyloTree")
        except NoSuchElementException:
            print >>sys.stderr, ("fatal error: could not " +
                                 "find the 'PhyloTree' button!")
            print >>sys.stderr, "(visit %s to diagnose the problem)" % (url)
            self.window.quit()
            sys.exit(1)

        button.click()

        # Wait for the vtkweb process to start (but time out after 10 seconds).
        if not vtkwebtest.wait_with_timeout(
                delay=0.5,
                limit=10,
                criterion=found_viewport(self.window)):
            print >>sys.stderr, ("fatal error: timed out while waiting " +
                                 "for vtkweb process to start")

        # Grab the body element to use as a positional reference.
        body = self.window.find_element_by_tag_name("body")

        # Double-click on a sub-tree to collapse it.
        dblclick = ActionChains(self.window)
        dblclick.move_to_element_with_offset(body, 475, 333)
        dblclick.double_click()
        dblclick.perform()

        # Give the page some time to update the image.
        time.sleep(1)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=("Run tests for Tangelo " +
                                             "VTKWeb service."))
    p.add_argument("-t", "--test", type=str, required=True,
                   metavar="[cone|phylotree]",
                   help="specifies which test to run")
    p.add_argument("-b", "--browser", type=str, required=True,
                   metavar="[chrome|firefox|ie]",
                   help="specifies which browser to test")
    args = p.parse_args()

    browser = None
    if args.browser == "chrome":
        browser = vtkwebtest.Browsers.chrome
    elif args.browser == "firefox":
        browser = vtkwebtest.Browsers.firefox
    elif args.browser == "ie":
        browser = vtkwebtest.Browsers.internet_explorer
    else:
        print >>sys.stderr, "error: unsupported browser '%s'" % (args.browser)
        sys.exit(1)

    url = "http://localhost:8080/examples/vtkweb"
    tester = None
    if args.test == "cone":
        tester = ConeTest(url=url, browser=browser)
    elif args.test == "phylotree":
        tester = PhylotreeTest(url=url, browser=browser)
    else:
        print >>sys.stderr, "error: unknown test '%s'" % (args.test)
        sys.exit(1)

    result = tester.run_test()
    sys.exit(result)
