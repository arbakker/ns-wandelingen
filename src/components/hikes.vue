<template>
  <div id="container">
      <div class="popup" ref="popup" v-show="showFeatureInfo" >
          <div class="content" v-html="featureInfo"></div>
        </div>
    <div id="map" ref="map-root-hikes"></div>
    <toggle-color></toggle-color>
    <div id="hike-info" class="ol-control" v-if="updated">
      <h2>NS-Wandelingen</h2>
      <p>{{ count }} wandelingen<br/>laatste update: {{ updated }}</p>
    </div>
  </div>
</template>

<script>
import 'ol/ol.css'
import GeoJSON from 'ol/format/GeoJSON'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Overlay from 'ol/Overlay'
import index from '../assets/index.json'
import map from '../lib/map'
import ToggleColor from './toggle-color.vue'

export default {
  components: {
    ToggleColor
  },
  name: 'Hikes',
  unmounted () {
    this.olMap.setTarget(null)
    this.olMap = null
  },
  data: () => ({
    olMap: {},
    overlay: null,
    featureInfo: '',
    showFeatureInfo: false,
    style: map.styles,
    updated: '',
    count: ''
  }),
  methods: {
    closePopup () {
      // Set the position of the pop-up window to undefined, and clear the coordinate data
      // this.overlay.setPosition(undefined)
      this.showFeatureInfo = false
    },
    labelStyleFunction (feature, resolution) {
      this.style.Label.getText().setText(feature.get('title'))
      return [this.style[feature.getGeometry().getType()], this.style.Label]
    },
    styleFunction (feature, resolution) {
      if (resolution < 50) {
        return this.labelStyleFunction(feature, resolution)
      }
      return [this.style[feature.getGeometry().getType()]]
    }
  },
  mounted () {
    this.updated = index['@context'].updated
    this.count = index['@context'].count

    const attribution = ', wandelingen: © <a rel="noopener" target="_blank" href="https://www.ns.nl/dagje-uit/wandelen">NS-Wandelingen</a>'
    const vectorSource = new VectorSource({
      format: new GeoJSON(),
      attributions: attribution
    })

    const fts = vectorSource
      .getFormat()
      .readFeatures(index, { dataProjection: 'EPSG:3857' })
    vectorSource.addFeatures(fts)
    this.overlay = new Overlay({
      element: this.$refs.popup, // popup tag, in html
      autoPan: true, // If the pop-up window is at the edge of the base image, the base image will move
      autoPanAnimation: {
        // Basemap moving animation
        duration: 250
      }
    })
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 100,
      declutter: true
    })

    this.olMap = map.getMap(this.$refs['map-root-hikes'])

    this.olMap.addOverlay(this.overlay)
    this.olMap.addLayer(vectorLayer)

    vectorLayer.setStyle(this.styleFunction)

    this.olMap.on('singleclick', (evt) => {
      // const hdms = toStringHDMS(toLonLat(coordinate)); // Convert coordinate format
      const fts = this.olMap.getFeaturesAtPixel(evt.pixel)
      const ft = fts.length > 0 ? fts[0] : null
      if (ft) {
        const props = ft.getProperties()
        const name = props.name
        this.$router.push({ name: 'ns-wandeling', params: { hikeId: name } })
      }
    })

    this.olMap.on('pointermove', (evt) => {
      const coordinate = evt.coordinate // get coordinates
      // const hdms = toStringHDMS(toLonLat(coordinate)); // Convert coordinate format
      const fts = this.olMap.getFeaturesAtPixel(evt.pixel)
      const ft = fts.length > 0 ? fts[0] : null
      if (this.olMap.getView().getResolution() < 50) {
        return
      }
      const hit = this.olMap.hasFeatureAtPixel(evt.pixel)
      if (hit) {
        this.olMap.getViewport().style.cursor = 'pointer'
        const props = ft.getProperties()
        const title = props.title
        if (!title) {
          this.showFeatureInfo = false
          this.featureInfo = ''
          return
        }
        this.featureInfo = `<div><b>${title}</b></div>`
        this.showFeatureInfo = true
      } else {
        this.olMap.getViewport().style.cursor = ''
        this.showFeatureInfo = false
        this.featureInfo = ''
      }

      setTimeout(() => {
        // Set the position of the pop-up window
        // Set the timer here, otherwise the pop-up window will appear for the first time, and the base map will be off-track
        this.overlay.setPosition([coordinate[0], coordinate[1]])
      }, 0)
    })
    setTimeout(() => {
      this.olMap.updateSize()
    }, 200)
  }
}
</script>

<style scoped>
#hike-info {
  position: absolute;
  left: 0.5em;
  bottom: 0.5em;
  padding-left: 0.5em;
  padding-right: 0.5em;
}
.popup {
  pointer-events: inherit;
  position: relative;
  background: #fff;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  transform: translate(-50%, calc(-100% - 12px));
}
.popup::after {
  pointer-events: inherit;
  display: block;
  content: "";
  width: 0;
  height: 0;
  position: absolute;
  border: 12px solid transparent;
  border-top-color: #fff;
  bottom: -23px;
  left: 50%;
  transform: translateX(-50%);
}
.icon-close {
  cursor: pointer;
  align-self: flex-end;
  margin-bottom: 10px;
}

 .styled-table  tr:nth-child(even) {
    background-color: #f2f2f2;
  }
  .styled-table  {
    table-layout: auto;
    border-collapse: separate;
    white-space: nowrap;
    margin: 1em;
    border-spacing: 0.2em;
  }
  .styled-table td{
    padding: 0.3em;
  }
  .styled-table tr td:nth-child(1){
    font-weight: 600;
  }
  @media only screen and (max-width: 600px) {
  #hike-info  {
    display: none;
  }
}
</style>
