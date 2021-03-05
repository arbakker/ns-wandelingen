<template>
  <div id="container">
    <div id="main">
      <div id="map" ref="map-root"></div>
    </div>
  </div>
</template>

<script>
// ol
import View from "ol/View";
import Map from "ol/Map";
import { get as getProjection } from "ol/proj";
import { FullScreen, defaults as defaultControls } from "ol/control";

import { fromLonLat } from "ol/proj";
import { getWidth } from "ol/extent";
import OSM from "ol/source/OSM";
import Raster from "ol/source/Raster";
import GPX from "ol/format/GPX";
import { Vector as VectorLayer, Image as ImageLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import axios from "axios";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import { all } from "ol/loadingstrategy";
import Geolocation from "ol/Geolocation";
import Feature from "ol/Feature";
import index from "../assets/index.json";

import Point from 'ol/geom/Point';

export default {
  name: "Hike",
  data: () => ({
    geolocation: null,
    positionFeature: null,
    hike: null,
    olMap: {},
    gpxLayer: null,
    hikeId: "",
    style: {
      Point: new Style({
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
      }),
      LineString: new Style({
        stroke: new Stroke({
          color: "#ff2626",
          lineDash: [0.1, 5],
          width: 4,
        }),
      }),
      MultiLineString: new Style({
        stroke: new Stroke({
          color: "#ff2626",
          lineDash: [0.1, 5],
          width: 4,
        }),
      }),
    },
    labelStyle: new Style({
      text: new Text({
        offsetX: 12,
        offsetY: -12,
        textAlign: "left",
        font:
          "small-caps bold  13px NS Sans,Segoe UI,Myriad,Verdana,sans-serif",
        overflow: false,
        fill: new Fill({
          color: "#000",
        }),
        stroke: new Stroke({
          color: "#fff",
          width: 3,
        }),
      }),
    }),
  }),
  methods: {
    getGPXLayer() {
      let urls = this.hike["properties"]["gpxfiles"].split(",");
      urls = urls.map((x) => `/data/${x}`);
      console.log(`urls: ${urls}`);
      const hikeLayer = new VectorLayer({
        zIndex: 100,
        declutter: true,
      });
      var gpxSource = new VectorSource({
        attributions:
          'Wandelroutes © <a target="_blank" href="https://www.ns.nl/dagje-uit/wandelen#/' +
          '">NS Wandelingen</a>',
        format: new GPX(),
        loader: () => {
          async function getAllData(urls) {
            console.log("alldata");
            let networkRequestPromises = urls.map(fetchData);
            return await Promise.all(networkRequestPromises);
          }
          function fetchData(url) {
            return axios
              .get(url)
              .then(function (response) {
                return {
                  success: true,
                  data: response.data,
                };
              })
              .catch(function () {
                return { success: false };
              });
          }
          getAllData(urls)
            .then((resps) => {
              resps.forEach((resp) => {
                console.log(resp);
                gpxSource.addFeatures(
                  gpxSource.getFormat().readFeatures(resp.data, {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:3857",
                  })
                );
                this.olMap
                  .getView()
                  .fit(gpxSource.getExtent(), { padding: [50, 50, 50, 50] });
              });
            })
            .catch((e) => {
              console.log(e);
            });
        },
        strategy: all,
      });
      hikeLayer.setSource(gpxSource);

      let index = 0;
      hikeLayer.setStyle((feature, resolution) => {
        console.log(feature);
        console.log(resolution);

        if (resolution < 10) {
          this.labelStyle.getText().setText(feature.get("name"));
          // this.labelStyle.setZIndex(index);
          index = index == Number.MAX_VALUE ? 0 : index + 1;
          return [this.style[feature.getGeometry().getType()], this.labelStyle];
        }
        return [this.style[feature.getGeometry().getType()]];
      });
      return hikeLayer;
    },
  },
  mounted() {
    this.hike = index["features"].find(
      (x) => x["properties"]["name"] === this.$route.params.hikeId
    );
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
    // let vectorSource = new VectorSource({
    //     format: new GeoJSON(),
    //   })
    // console.log(hikes.features)

    // let fts = vectorSource.getFormat().readFeatures(hikes, { dataProjection: 'EPSG:3857' })
    // vectorSource.addFeatures(fts)
    var rasterSource = new Raster({
      sources: [new OSM()],
      operation: (pixels) => {
        var pixel = pixels[0];
        var lightness = pixel[0] * 0.3 + pixel[1] * 0.59 + pixel[2] * 0.11;
        return [lightness, lightness, lightness, pixel[3]];
      },
    });

    this.olMap = new Map({
      controls: defaultControls().extend([new FullScreen()]),
      target: this.$refs["map-root"],
      layers: [
        new ImageLayer({
          source: rasterSource,
        }),
      ],
      view: new View({
        zoom: 8,
        center: fromLonLat([5.43, 52.18]),
      }),
    });
    this.gpxLayer = this.getGPXLayer();
    this.olMap.addLayer(this.gpxLayer);

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