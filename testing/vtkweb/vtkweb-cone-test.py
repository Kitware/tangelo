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
    button = browser.find_element_by_link_text("Cone")
    button.click()
    time.sleep(3)

    # Grab the viewport element so we know where to put the mouse.
    div = browser.find_element_by_id("viewport")

    # Click-and-drag on the cone to change its position a bit.
    drag = webdriver.common.action_chains.ActionChains(browser)
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
