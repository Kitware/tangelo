import itertools
import sys
import time

import selenium
from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import NoSuchElementException

from vtkwebtest import now, compare_images

if __name__ == "__main__":
    # Create a Chrome window driver.
    browser = webdriver.Chrome()
    browser.set_window_size(952, 718)

    # Load the vtkweb application page.
    url = "http://localhost:8080/examples/vtkweb"
    browser.get(url)
    
    # Click on the PhyloTree app launcher and wait for it to load.
    try:
        button = browser.find_element_by_link_text("Cone")
    except NoSuchElementException:
        print >>sys.stderr, "fatal error: could not find the 'Cone' button!"
        print >>sys.stderr, "(visit %s to diagnose the problem)" % (url)
        browser.quit()
        sys.exit(1)

    button.click()

    # Create signal classes to use for breaking out of the timeout loop below.
    class Found: pass
    class TimedOut: pass

    # Set a timeout limit of 10 seconds; try again every half second.
    timeout_limit = 10
    delay = 0.5
    try:
        for i in itertools.count():
            try:
                # If there is an element with attribute "__vtkweb_viewport__" it
                # means that the vtkweb process has started.
                canvas = browser.find_element_by_css_selector("[__vtkweb_viewport__=true]")
                raise Found()
            except NoSuchElementException:
                # If there is no such element, sleep for a short interval if we
                # have not already timed out.
                if delay * i > timeout_limit:
                    raise TimedOut()
                else:
                    time.sleep(delay)
    except TimedOut:
        print >>sys.stderr, "fatal error: timed out while waiting for vtkweb process to start"
        browser.quit()
        sys.exit(1)
    except Found:
        pass

    # Grab the viewport element so we know where to put the mouse.
    div = browser.find_element_by_id("viewport")

    # Click-and-drag on the cone to change its position a bit.
    drag = ActionChains(browser)
    drag.move_to_element(div)
    drag.click_and_hold()
    drag.move_by_offset(-300, 100)
    drag.release()
    drag.perform()

    # Give the page some time to update the image.
    time.sleep(1)

    # Take a screenshot.
    shot = "cone-%s.png" % (now())
    browser.save_screenshot(shot)

    # Compare the screenshot with the baseline, and report to stdout.
    print compare_images(shot, "baseline-cone.png")

    # Close the browser window.
    browser.quit()
