import sys
import time

from selenium import webdriver
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
        button = browser.find_element_by_link_text("PhyloTree")
    except NoSuchElementException:
        print >>sys.stderr, "fatal error: could not find the 'PhyloTree' button!"
        print >>sys.stderr, "(visit %s to diagnose the problem)" % (url)
        browser.quit()
        sys.exit(1)

    button.click()

    # Wait for the vtkweb process to start (but time out after 10 seconds).
    if not vtkwebtest.wait_with_timeout(delay=0.5, limit=10, criterion=vtkwebtest.found_viewport(browser)):
        print >>sys.stderr, "fatal error: timed out while waiting for vtkweb process to start"

    # Grab the body element to use as a positional reference.
    body = browser.find_element_by_tag_name("body")

    # Double-click on a sub-tree to collapse it.
    dblclick = ActionChains(browser)
    dblclick.move_to_element_with_offset(body, 475, 333)
    dblclick.double_click()
    dblclick.perform()

    # Give the page some time to update the image.
    time.sleep(1)

    # Take a screenshot.
    shot = "phylotree-%s.png" % (vtkwebtest.now())
    browser.save_screenshot(shot)

    # Compare the screenshot with the baseline, and report to stdout.
    vtkwebtest.compare_images(shot, "baseline-phylotree.png")

    # Close the browser window.
    browser.quit()
