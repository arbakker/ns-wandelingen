<template>
  <div id="container">
    <div id="map" ref="map"></div>
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

import index from '../assets/index.json'
import map from '../lib/map'
import HikeInfo from './hike-info.vue'
import ToggleColor from './toggle-color.vue'

export default {
  components: {
    HikeInfo,
    ToggleColor
  },
  name: 'Hike',
  props: {},
  data: () => ({
    olMap: {},
    gpxLayer: null,
    hikeId: '',
    hike: null,
    style: map.styles
  }),
  methods: {
    getGPXLayer () {
      let urls = this.hike.properties.gpxfiles.split(',')
      urls = urls.map((x) => `./data/${x}`)
      const hikeLayer = new VectorLayer({
        zIndex: 100,
        declutter: true
      })
      const gpxSource = new VectorSource({
        // attributions:
        //   ', wandeling: <a  rel="noopener" target="_blank" href="' +
        //   this.hike.properties.url +
        //   '">© ' +
        //   this.hike.properties.title +
        //   '</a>',
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
          return [
            this.style[feature.getGeometry().getType()],
            this.style.Label
          ]
        }
        return [this.style[feature.getGeometry().getType()]]
      })
      return hikeLayer
    }
  },
  unmounted () {
    this.olMap.setTarget(null)
    this.olMap = null
  },
  mounted () {
    this.hike = index.features.find(
      (x) => x.properties.name === this.$route.params.hikeId
    )
    this.olMap = map.getMap(this.$refs.map)
    this.gpxLayer = this.getGPXLayer()
    this.olMap.addLayer(this.gpxLayer)
    setTimeout(() => {
      this.olMap.updateSize()
    }, 200)
  }
}
</script>

<style scoped>
</style>
