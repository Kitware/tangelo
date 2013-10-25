import sys
import time

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains

import vtkwebtest

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

    # Wait for the vtkweb process to start (but time out after 10 seconds).
    if not vtkwebtest.wait_with_timeout(delay=0.5, limit=10, criterion=vtkwebtest.found_viewport(browser)):
        print >>sys.stderr, "fatal error: timed out while waiting for vtkweb process to start"

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
    shot = "cone-%s.png" % (vtkwebtest.now())
    browser.save_screenshot(shot)

    # Compare the screenshot with the baseline, and report to stdout.
    vtkwebtest.compare_images(shot, "baseline-cone.png")

    # Close the browser window.
    browser.quit()
