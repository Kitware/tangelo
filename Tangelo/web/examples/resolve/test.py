from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.keys import Keys
import time

browser = webdriver.Chrome()

browser.get("http://localhost:8080/app/testing/resolve/")
assert "App Viewer" in browser.title
time.sleep(10)
try:
	elem = browser.find_element_by_id("slider")
except NoSuchElementException:
    print "error: can't find slider"
try:
	browser.find_element_by_xpath("//canvas")
except NoSuchElementException:
	print "error: can't find canvas"
browser.close()
print "success"
