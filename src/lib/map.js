// import OSM from 'ol/source/OSM'
import Map from 'ol/Map'
import { Attribution, FullScreen, defaults as defaultControls, ScaleLine } from 'ol/control'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import View from 'ol/View'
import { fromLonLat } from 'ol/proj'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
import XYZ from 'ol/source/XYZ'
// import OSM from 'ol/source/OSM'
import Geolocation from 'ol/Geolocation'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import VectorSource from 'ol/source/Vector'

// use for hidpi tiles
// import { DEVICE_PIXEL_RATIO } from 'ol/has'
// const hiDPI = DEVICE_PIXEL_RATIO > 1
// const tilePixelRatio = hiDPI ? 2 : 1
// const urlString = hiDPI ? '@2x' : ''

const basemapLayer = new TileLayer({
  className: 'bw basemapLayer',
  preload: Infinity,
  source: new XYZ({
    url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attributions: 'achtergrondkaart: <a rel="noopener" target="_blank" href="https://www.openstreetmap.org">© OpenStreetMap contributors</a>'
  })
})

const geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true
  },
  projection: 'EPSG:3857'
})
geolocation.on('error', function (error) {
  const info = document.getElementById('info')
  info.innerHTML = error.message
  info.style.display = ''
})
const positionFeature = new Feature()
positionFeature.setStyle(
  new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: '#2BC0F1'
      }),
      radius: 8,
      stroke: new Stroke({
        color: '#ffffff',
        width: 2
      })
    })
  })
)
geolocation.on('change:position', () => {
  const coordinates = geolocation.getPosition()
  positionFeature.setGeometry(
    coordinates ? new Point(coordinates) : null
  )
  const newSource = new VectorSource({
    features: [positionFeature]
  })
  geolocationLayer.setSource(newSource)
})
geolocation.setTracking(true)
const geolocationLayer = new VectorLayer({})

const attribution = new Attribution({
  collapsible: true
})
attribution.setCollapsed(true)
const getMap = function (ref) {
  const map = new Map({
    controls: defaultControls({ attribution: false }).extend([attribution, new FullScreen(), new ScaleLine({
      units: 'metric'
    })]),
    target: ref,
    layers: [
      basemapLayer,
      geolocationLayer
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
      width: 3
    })
  }),
  MultiLineString: new Style({
    stroke: new Stroke({
      color: symbolColor,
      lineDash: [2, 6, 6],
      lineCap: 'square',
      width: 3
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
