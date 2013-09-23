import time

import selenium
from selenium import webdriver

from vtkwebtest import now, compare_images

if __name__ == "__main__":
    # Create a Chrome window driver.
    browser = webdriver.Chrome()
    browser.set_window_size(952, 718)

    # Load the vtkweb application page.
    browser.get("http://localhost:8080/app/vtkweb")
    
    # Click on the PhyloTree app launcher and wait for it to load.
    button = browser.find_element_by_link_text("PhyloTree")
    button.click()
    time.sleep(3)

    # Grab the body element to use as a positional reference.
    body = browser.find_element_by_tag_name("body")

    # Double-click on a sub-tree to collapse it.
    dblclick = webdriver.common.action_chains.ActionChains(browser)
    dblclick.move_to_element_with_offset(body, 475, 333)
    dblclick.double_click()
    dblclick.perform()

    # Give the page some time to update the image.
    time.sleep(1)

    # Take a screenshot.
    shot = "phylotree-%s.png" % (now())
    browser.save_screenshot(shot)

    # Compare the screenshot with the baseline, and report to stdout.
    print compare_images(shot, "baseline-phylotree.png")

    # Close the browser window.
    browser.quit()
