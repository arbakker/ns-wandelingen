// import OSM from 'ol/source/OSM'
import Map from 'ol/Map'
import { FullScreen, defaults as defaultControls, ScaleLine } from 'ol/control'
import { Tile as TileLayer } from 'ol/layer'
import View from 'ol/View'
import { fromLonLat } from 'ol/proj'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
// import { DEVICE_PIXEL_RATIO } from 'ol/has'
import XYZ from 'ol/source/XYZ'

// const hiDPI = DEVICE_PIXEL_RATIO > 1
// const tilePixelRatio = hiDPI ? 2 : 1
// const tiles2x = hiDPI ? '@2x' : ''
const tileUrl = 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}@2x.png?apikey=7d5495f3d58a43fc8d42f962bded0cd8'
// console.log('tilePixelRatio', tilePixelRatio)
const basemapLayer = new TileLayer({
  className: 'ol-layer basemapLayer bw',
  preload: Infinity,
  source: new XYZ({
    url: tileUrl,
    tilePixelRatio: 2,
    attributions: 'achtergrondkaart: <a rel="noopener" target="_blank" href="https://www.openstreetmap.org">© OpenStreetMap contributors</a>'
  })
})
const getMap = function (ref) {
  const map = new Map({
    controls: defaultControls().extend([new FullScreen(), new ScaleLine({
      units: 'metric'
    })]),
    target: ref,
    layers: [
      basemapLayer
    ],
    view: new View({
      zoom: 8,
      center: fromLonLat([5.43, 52.18])
    })
  })

  return map
}
const symbolColor = 'red'
const styles = {
  Point: new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: symbolColor
      }),
      radius: 5,
      stroke: new Stroke({
        color: '#ffffff',
        width: 2
      })
    })
  }),
  LineString: new Style({
    stroke: new Stroke({
      color: symbolColor,
      lineDash: [2, 6, 6],
      width: 4
    })
  }),
  MultiLineString: new Style({
    stroke: new Stroke({
      color: symbolColor,
      lineDash: [2, 6, 6],
      lineCap: 'square',
      width: 4
    })
  }),
  Label: new Style({
    text: new Text({
      offsetX: 12,
      offsetY: -12,
      textAlign: 'left',
      font:
        'small-caps bold  13px NS Sans,Segoe UI,Myriad,Verdana,sans-serif',
      overflow: false,
      fill: new Fill({
        color: '#000'
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 3
      })
    })
  })
}

export default { getMap, styles }
