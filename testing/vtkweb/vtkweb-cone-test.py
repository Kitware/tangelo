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

class ConeTest(vtkwebtest.CDashImageComparator):
    def __init__(self, **kwargs):
        vtkwebtest.CDashImageComparator.__init__(self, filepat="cone-%s.png", baseline="baseline-cone.png", size=(952, 718), **kwargs)

    def setup(self):
        try:
            button = self.window.find_element_by_link_text("Cone")
        except NoSuchElementException:
            print >>sys.stderr, "fatal error: could not find the 'Cone' button!"
            print >>sys.stderr, "(visit %s to diagnose the problem)" % (url)
            raise vtkwebtest.WebTest.Abort()

        button.click()

        # Wait for the vtkweb process to start (but time out after 10 seconds).
        if not vtkwebtest.wait_with_timeout(delay=0.5, limit=10, criterion=found_viewport(self.window)):
            print >>sys.stderr, "fatal error: timed out while waiting for vtkweb process to start"
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

if __name__ == "__main__":
    tester = ConeTest(url="http://localhost:8080/examples/vtkweb", browser=vtkwebtest.Browsers.chrome)
    result = tester.run_test()
    sys.exit(result)
