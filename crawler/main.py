#!/usr/bin/env python3
import re
import os
import json
import glob
import zipfile
import shutil
import json
from statistics import mean 
from collections import OrderedDict
from pathlib import Path
import requests
from slugify import slugify
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver.common.keys import Keys
import selenium.common.exceptions as excs
from selenium.webdriver.firefox.options import Options
from bs4 import BeautifulSoup
from pyproj import Proj, transform
import fiona
from fiona.crs import from_epsg
from fiona.crs import from_epsg

IN_PROJ = Proj(init='epsg:4326')
OUT_PROJ = Proj(init='epsg:3857')


DATA_DIR = './data'
URL = "https://www.ns.nl/dagje-uit/wandelen#/"

def init():
    shutil.rmtree(DATA_DIR, ignore_errors=True)
    os.mkdir(DATA_DIR)

def clean():
    files = glob.glob(f"{DATA_DIR}/*.zip")
    for f in files:
        os.remove(f)
    [os.rmdir(name) for name in os.listdir(DATA_DIR) if os.path.isdir(name)]

def download_and_unzip_gpx(result):
    for item in result:
        item["gpxfiles"] = []
        for dl in item["zipfiles"]:
            gpx_zipfile = requests.get(dl, allow_redirects=True)
            zipfile_name = os.path.basename(dl)
            zipfile_path = os.path.join("data", zipfile_name)
            with open(zipfile_path, 'wb') as f:
                f.write(gpx_zipfile.content)

            with zipfile.ZipFile(zipfile_path, 'r') as zip_ref:
                zip_ref.extractall(DATA_DIR)
                gpx_filename = zip_ref.namelist()[0]
            
            slug = slugify(os.path.basename(os.path.splitext(gpx_filename)[0]))
            old_filename = os.path.join(DATA_DIR, gpx_filename)
            new_filename = os.path.join(DATA_DIR, f"{slug}.gpx")
            os.rename(old_filename, new_filename)
            [os.rmdir(name) for name in os.listdir(DATA_DIR) if os.path.isdir(name)]
            files = glob.glob(f"{DATA_DIR}/*.zip")
            for f in files:
                os.remove(f)
            item["gpxfiles"].append(os.path.basename(new_filename))

def explode(coords):
    """Explode a GeoJSON geometry's coordinates object and yield coordinate tuples.
    As long as the input is conforming, the type of the geometry doesn't matter."""
    for e in coords:
        if isinstance(e, (float, int)):
            yield coords
            break
        else:
            for f in explode(e):
                yield f

def center_geom(f):
    x, y = zip(*list(explode(f['geometry']['coordinates'])))
    return min(x)+((max(x)-min(x))/2),min(y)+((max(y)-min(y))/2)

def calculate_center_hike(gpx_files):
    centers=[]
    for gpx in gpx_files:
        gpx_path = os.path.join(DATA_DIR, gpx)
        with fiona.open(gpx_path,  layer="tracks") as src:
            for f in src:
                centers.append(center_geom(f))
    return [float(sum(l))/len(l) for l in zip(*centers)]


def write_geojson_index(result):
    schema = {
      'geometry': 'Point',
      'properties': OrderedDict([
        ('name', 'str'),
        ('title', 'str'),
        ('url', 'str'),
        ('gpxfiles', 'str'),
      ])
    }
    output_driver = "GeoJSON"
    json_crs = from_epsg(3857)
    with fiona.open(
        os.path.join(DATA_DIR, 'index.json'),
        'w',
        driver=output_driver,
        crs=json_crs,
        schema=schema) as c:

        for item in result:
            v_proj = transform(IN_PROJ,OUT_PROJ,item["center"][0], item["center"][1])
            feature =  {
                'geometry': {
                    'type': 'Point',
                    'coordinates': (v_proj[0], v_proj[1])
                },
                'properties': OrderedDict([
                    ('name', item["name"]),      
                    ('title', item["title"]),      
                    ('url', item["url"]),      
                    ('gpxfiles', ",".join(item["gpxfiles"])),            
                ])
                }
            c.write(feature)

def crawl():
    # options = Options()
    # options.headless = True
    driver = webdriver.Firefox()
    driver.implicitly_wait(30)
    driver.get(URL)
    WebDriverWait(driver, 5, poll_frequency=0.25).until(
        ec.visibility_of_element_located((By.CSS_SELECTOR, ".cookie-notice__btn-accept.hide-in-settings"))
    )
    driver.find_element(By.CSS_SELECTOR, ".cookie-notice__btn-accept.hide-in-settings").click()
    driver.switch_to.default_content()
    hike_anchors = driver.find_elements(By.CSS_SELECTOR, ".tile.tile--clickable.is-clickable>div>p>a")
    
    current_window = driver.current_window_handle
    
    result = []
    for anchor in hike_anchors:
        href = anchor.get_attribute('href')
        driver.execute_script('window.open(arguments[0]);', href)
        WebDriverWait(driver, 20).until(ec.number_of_windows_to_be(2))
        new_window = [window for window in driver.window_handles if window != current_window][0]
        driver.switch_to.window(new_window)
        title = driver.find_element(By.CSS_SELECTOR, "h1.headingXL").get_attribute("innerText")
        downloads = driver.find_elements(By.XPATH, "//a[contains(@href, '.zip')]")

        item = {}
        item["url"] = href
        item["title"] = title
        item["name"] = slugify(title)
        item["zipfiles"] = []
        for download in downloads:
            zipfile = download.get_attribute("href")
            item["zipfiles"].append(zipfile)
        
        driver.close()
        driver.switch_to.window(current_window)

        if len(item["zipfiles"]) == 0:
            continue
        result.append(item)
    
        
    return result
            

def main():
    init()
    result = crawl()
    # print(json.dumps(result, indent=4))
    download_and_unzip_gpx(result)
    for item in result:
        center = calculate_center_hike(item["gpxfiles"])
        item["center"] = center
    write_geojson_index(result)
    clean()

if __name__ == "__main__":
    main()