from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.common.keys import Keys
import selenium.common.exceptions as excs
from bs4 import BeautifulSoup
import re
import pandas as pd
import os
import requests
import json
import zipfile

def main():
    url = "https://www.ns.nl/dagje-uit/wandelen#/"
    driver = webdriver.Firefox()
    driver.implicitly_wait(30)
    driver.get(url)

    WebDriverWait(driver, 5, poll_frequency=0.25).until(ec.frame_to_be_available_and_switch_to_it(driver.find_element_by_xpath("//iframe[@id='r42CookieBar']")))
    driver.find_element_by_css_selector("a.button.accept").click()
    driver.switch_to_default_content()

    hike_anchors = driver.find_elements_by_css_selector(".tile.tile--clickable.is-clickable>div>p>a")
    current_window = driver.current_window_handle
    
    result = []
    for anchor in hike_anchors:
        href = anchor.get_attribute('href')
        driver.execute_script('window.open(arguments[0]);', href)
        WebDriverWait(driver, 20).until(ec.number_of_windows_to_be(2))
        new_window = [window for window in driver.window_handles if window != current_window][0]
        driver.switch_to.window(new_window)
        title = driver.find_element_by_css_selector("h1.headingXL").get_attribute("innerText")
        downloads = driver.find_elements_by_xpath("//a[contains(@href, '.zip')]")
        item = {}
        item["url"] = href
        item["title"] = title
        item["downloads"] = []
        for download in downloads:
            gpx_url = download.get_attribute("href")
            gpx_zipfile = requests.get(gpx_url, allow_redirects=True)
            zipfile_name = os.path.basename(gpx_url)
            zipfile_path = os.path.join("data", zipfile_name)
            with open(zipfile_path, 'wb') as f:
                f.write(gpx_zipfile.content)

            with zipfile.ZipFile(zipfile_path, 'r') as zip_ref:
                zip_ref.extractall("data")
                gpx_filename = zip_ref.namelist()[0]
            # os.remove(zipfile_path)

            item["downloads"].append(os.path.join("data", gpx_filename))

        if item["downloads"]:
            result.append(item)
        driver.close()
        driver.switch_to.window(current_window)

    with open(os.path.join("data", "index.json"), 'w') as f:
        f.write(json.dumps(result, indent=4))

if __name__ == "__main__":
    main()