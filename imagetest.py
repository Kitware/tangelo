from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.keys import Keys
import Image, ImageChops
import time
import argparse
import cStringIO
import urllib2

def image_difference(im1, im2, threshold):
    px1 = im1.load()
    px2 = im2.load()
    if im1.size[0] > im2.size[0] or im1.size[1] > im1.size[1]:
        print "error: first image too small"
        return False
    diff = 0
    for x in range(im1.size[0]):
        for y in range(im2.size[1]):
            p1 = px1[x, y]
            p2 = px2[x, y]
            for i in range(3):
                diff += abs(p1[i] - p2[i])
    diffImage = ImageChops.subtract(im1, im2, 0.5, 128)
    diffImage.save('geodots-diff.png')
    if diff >= threshold:
        print "error: image difference too large (", diff, ")"
        return False
    return True

def check_url_image(browser, url, baseline_url, test_name, threshold=8000):
    browser.get(url)
    time.sleep(5)
    browser.save_screenshot(test_name + '.png')
    im1 = Image.open(test_name + '.png')
    f = cStringIO.StringIO(urllib2.urlopen(baseline_url).read())
    im2 = Image.open(f)
    return image_difference(im1, im2, threshold)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Test a webpage.')
    parser.add_argument('--url', help='URL for the test')
    parser.add_argument('--baseline-url', help='URL for the baseline image')
    parser.add_argument('--name', help='the test name')
    parser.add_argument('--threshold', help='the numeric threshold for the comparison image', type=int, default=8000)
    opt = parser.parse_args()
    try:
        browser = webdriver.Chrome()
        browser.set_window_size(600, 600)
        if check_url_image(browser, opt.url, opt.baseline_url, opt.name, threshold=opt.threshold):
            print "success"
    except Exception as e:
        print "error: exception -- ", e
    finally:
        browser.close()
