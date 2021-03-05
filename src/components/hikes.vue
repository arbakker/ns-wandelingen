<template>
  <div id="container">
    <div id="main">
      <div id="map" ref="map-root"/>
      
      <div class="popup" ref="popup" v-show="showFeatureInfo" >
          <div class="content" v-html="featureInfo"></div>
        </div>
    </div>
  </div>
</template>

<script>
import View from "ol/View";
import Map from "ol/Map";
import { get as getProjection } from "ol/proj";
import { FullScreen, defaults as defaultControls } from "ol/control";
import "ol/ol.css";
import { fromLonLat } from "ol/proj";
import { getWidth } from "ol/extent";
import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import { Tile as TileLayer } from "ol/layer";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import Overlay from "ol/Overlay";
import index from "../assets/index.json";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { ref, onMounted  } from 'vue'
import Geolocation from "ol/Geolocation";
import Feature from "ol/Feature";

import Point from 'ol/geom/Point';

export default {
  name: "Hikes",
  setup() {
      const popup  = ref(null)
      onMounted(() => {
        // the DOM element will be assigned to the ref after initial render
      })
      return {
        popup 
      }
    },
  data: () => ({
    geolocation: null,
    positionFeature: null,
    hikes: [],
    olMap: {},
    overlay: null,
    featureInfo: "",
    showFeatureInfo: false,
    pointStyle: new Style({
        image: new CircleStyle({
          fill: new Fill({
            color: "#ff2626",
          }),
          radius: 5,
          stroke: new Stroke({
            color: "#ffffff",
            width: 2,
          }),
        }),
      })
  }),
  methods: {
    closePopup() {
      // Set the position of the pop-up window to undefined, and clear the coordinate data
      this.overlay.setPosition(undefined);
      this.showFeatureInfo = false;
    },
  },
  mounted() {
    const projection = getProjection("EPSG:3857");
    const projectionExtent = projection.getExtent();
    const size = getWidth(projectionExtent) / 256;
    const resolutions = new Array(20);
    const matrixIds = new Array(20);

    for (var z = 0; z < 20; ++z) {
      // generate resolutions and matrixIds arrays for this WMTS
      resolutions[z] = size / Math.pow(2, z);
      matrixIds[z] = z;
    }
    let vectorSource = new VectorSource({
      format: new GeoJSON(),
    });
    let fts = vectorSource
      .getFormat()
      .readFeatures(index, { dataProjection: "EPSG:3857" });
    vectorSource.addFeatures(fts);
    this.overlay = new Overlay({
      element: this.popup, // popup tag, in html
      autoPan: true, // If the pop-up window is at the edge of the base image, the base image will move
      autoPanAnimation: {
        // Basemap moving animation
        duration: 250,
      },
    });
    let vectorLayer = new VectorLayer({
          source: vectorSource,
        })
    vectorLayer.setStyle(()=>this.pointStyle)
    this.olMap = new Map({
      controls: defaultControls().extend([new FullScreen()]),
      target: this.$refs['map-root'],
       overlays: [this.overlay],
      layers: [
        new TileLayer({
          className: 'bw',
          source: new OSM(),
        }),
        vectorLayer
        ,
      ],
      view: new View({
        zoom: 8,
        center: fromLonLat([5.43, 52.18]),
      }),
    });

     this.olMap.on("singleclick", (evt) => {
       console.log('singleclick', evt)
      // const hdms = toStringHDMS(toLonLat(coordinate)); // Convert coordinate format
      let fts = this.olMap.getFeaturesAtPixel(evt.pixel);
      let ft = fts.length > 0 ? fts[0] : null;
      console.log(ft, 'ft')
      if (ft) {
        let props = ft.getProperties();
        const name = props['name']
        console.log('click', name)
        this.$router.push({ name: 'ns-wandeling', params: { hikeId: name } })
      }
    });

    this.olMap.on("pointermove", (evt) => {
      const coordinate = evt.coordinate; // get coordinates
      // const hdms = toStringHDMS(toLonLat(coordinate)); // Convert coordinate format
      let fts = this.olMap.getFeaturesAtPixel(evt.pixel);
      let ft = fts.length > 0 ? fts[0] : null;

      if (ft) {
        let props = ft.getProperties();
        const title = props['title']
        if (!title){
          this.showFeatureInfo = false;
          this.featureInfo = "";
          return;
        }
        this.featureInfo = `<div><h3>${title}</h3></div>`;
        this.showFeatureInfo = true;
      } else {
        this.showFeatureInfo = false;
        this.featureInfo = "";
        return;
      }
      setTimeout(() => {
        // Set the position of the pop-up window
        // Set the timer here, otherwise the pop-up window will appear for the first time, and the base map will be off-track
        this.overlay.setPosition([coordinate[0],coordinate[1]+100]);
      }, 0);
    });

     this.geolocation = new Geolocation({
        // enableHighAccuracy must be set to true to have the heading value.
        trackingOptions: {
          enableHighAccuracy: true,
        },
        projection:  this.olMap.getView().getProjection(),
      });
      this.geolocation.on("error", function (error) {
        var info = document.getElementById("info");
        info.innerHTML = error.message;
        info.style.display = "";
      });
      this.positionFeature = new Feature();
      this.positionFeature.setStyle(
        new Style({
        image: new CircleStyle({
          fill: new Fill({
            color: "#2BC0F1",
          }),
          radius: 8,
          stroke: new Stroke({
            color: "#ffffff",
            width: 2,
          }),
        }),
      })
      );

       this.geolocation.on("change:position", ()=>{
        var coordinates = this.geolocation.getPosition();
        this.positionFeature.setGeometry(
          coordinates ? new Point(coordinates) : null
        );
      });

       this.geolocation.setTracking(true);

      var geolocationLayer = new VectorLayer({
        source: new VectorSource({
          features: [this.positionFeature],
        }),
      });
      this.olMap.addLayer(geolocationLayer);

    setTimeout(() => {
      this.olMap.updateSize();
    }, 200);
  },
};
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
.popup {
  pointer-events: inherit;
  min-width: 280px;
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
</style>