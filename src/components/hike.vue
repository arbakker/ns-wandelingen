<template>
  <div id="container">
    <div id="main">
      <div id="map-2"></div>
     </div>
         <hike-info v-if="hike" :hike="hike"></hike-info>
          <toggle-color></toggle-color>
  </div>
</template>

<script>

import GPX from 'ol/format/GPX'
import { Vector as VectorLayer } from 'ol/layer'
import VectorSource from 'ol/source/Vector'
import axios from 'axios'
import { all } from 'ol/loadingstrategy'
import Geolocation from 'ol/Geolocation'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'

import index from '../assets/index.json'
import map from '../lib/map'
import HikeInfo from './hike-info.vue'
import ToggleColor from './toggle-color.vue'
import { DEVICE_PIXEL_RATIO } from 'ol/has'

export default {
  components: {
    HikeInfo,
    ToggleColor
  },
  name: 'Hike',
  props: {
  },
  data: () => ({
    geolocation: null,
    positionFeature: null,
    olMap: {},
    gpxLayer: null,
    hikeId: '',
    hike: null,
    style: map.styles
  }),
  methods: {
    getGPXLayer () {
      let urls = this.hike.properties.gpxfiles.split(',')
      urls = urls.map((x) => `../data/${x}`)
      const hikeLayer = new VectorLayer({
        zIndex: 100,
        declutter: true
      })
      const gpxSource = new VectorSource({
        attributions:
          ', wandeling: <a  rel="noopener" target="_blank" href="' + this.hike.properties.url +
          '">© ' + this.hike.properties.title + '</a>',
        format: new GPX(),
        loader: () => {
          async function getAllData (urls) {
            const networkRequestPromises = urls.map(fetchData)
            return await Promise.all(networkRequestPromises)
          }
          function fetchData (url) {
            return axios
              .get(url)
              .then(function (response) {
                return {
                  success: true,
                  data: response.data
                }
              })
              .catch(function () {
                return { success: false }
              })
          }
          getAllData(urls)
            .then((resps) => {
              resps.forEach((resp) => {
                gpxSource.addFeatures(
                  gpxSource.getFormat().readFeatures(resp.data, {
                    dataProjection: 'EPSG:4326',
                    featureProjection: 'EPSG:3857'
                  })
                )
                this.olMap
                  .getView()
                  .fit(gpxSource.getExtent(), { padding: [50, 50, 50, 50] })
              })
            })
            .catch((e) => {
              console.log(e)
            })
        },
        strategy: all
      })
      hikeLayer.setSource(gpxSource)
      hikeLayer.setStyle((feature, resolution) => {
        if (resolution < 10) {
          this.style.Label.getText().setText(feature.get('name'))
          return [this.style[feature.getGeometry().getType()], this.style.Label]
        }
        return [this.style[feature.getGeometry().getType()]]
      })
      return hikeLayer
    }
  },
  mounted () {
    this.hike = index.features.find(
      (x) => x.properties.name === this.$route.params.hikeId
    )
    this.olMap = map.getMap('map-2')
    this.gpxLayer = this.getGPXLayer()
    this.olMap.addLayer(this.gpxLayer)

    this.geolocation = new Geolocation({
    // enableHighAccuracy must be set to true to have the heading value.
      trackingOptions: {
        enableHighAccuracy: false
      },
      projection: this.olMap.getView().getProjection()
    })
    this.geolocation.on('error', function (error) {
      const info = document.getElementById('info')
      info.innerHTML = error.message
      info.style.display = ''
    })
    this.positionFeature = new Feature()
    this.positionFeature.setStyle(
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
    this.geolocation.on('change:position', () => {
      console.log('changepos')
      console.log(DEVICE_PIXEL_RATIO)
      const coordinates = this.geolocation.getPosition()
      this.positionFeature.setGeometry(
        coordinates ? new Point(coordinates) : null
      )
    })
    this.geolocation.setTracking(true)
    const geolocationLayer = new VectorLayer({
      source: new VectorSource({
        features: [this.positionFeature]
      })
    })
    this.olMap.addLayer(geolocationLayer)

    setTimeout(() => {
      this.olMap.updateSize()
    }, 200)
  }
}
</script>

<style scoped>
pre[class*="language-"] {
  text-align: left;
  padding: 0px;
  margin: 0px;
  height: 89vh;
  overflow: auto;
}
#container {
  height: 93vh;
  display: flex;
  flex: 0 0 100%;
}

#meta {
  width: 100%;
  overflow: auto;
}

#capbar {
  height: 4vh;
  text-align: left;
}

#capbar button {
  margin: 0.3em;
}
#capbar button {
  height: 2em;
}
#legend {
  padding: 0.2em;
  border: lightgrey dotted 1px;
}

</style>
