import 'ol/ol.css';
import {Map, View} from 'ol';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import Point from 'ol/geom/Point';
import GPX from 'ol/format/GPX';
import VectorSource from 'ol/source/Vector';
import {fromLonLat} from 'ol/proj';
import axios from 'axios';
import {Circle as CircleStyle, RegularShape, Fill, Stroke, Style, Text} from 'ol/style';
import WMTS from 'ol/source/WMTS';
import {get as getProjection} from 'ol/proj';
import {getWidth, getTopLeft} from 'ol/extent';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {defaults as defaultControls, Control} from 'ol/control';
import {bbox} from 'ol/loadingstrategy';
import Geolocation from 'ol/Geolocation';
import Feature from 'ol/Feature';

const projection = getProjection('EPSG:3857');

const projectionExtent = projection.getExtent();
const size = getWidth(projectionExtent) / 256;
const resolutions = new Array(20);
const matrixIds = new Array(20);
for (let z = 0; z < 20; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}





function string_to_slug(str) {
  const separator = '-';
  str = str.trim();
  str = str.toLowerCase();

  // remove accents, swap ñ for n, etc
  const from = "åàáãäâèéëêìíïîòóöôùúüûñç·/_,:;";
  const to = "aaaaaaeeeeiiiioooouuuunc------";

  for (let i = 0, l = from.length; i < l; i++) {
      str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
  }

  return str
      .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
      .replace(/\s+/g, "-") // collapse whitespace and replace by -
      .replace(/-+/g, "-") // collapse dashes
      .replace(/^-+/, "") // trim - from start of text
      .replace(/-+$/, "") // trim - from end of text
      .replace(/-/g, separator);
}

var SelectHikeControl = /*@__PURE__*/(function (Control) {
  function SelectHikeControl(opt_options) {
    var options = opt_options || {};
    var button = document.createElement('select');
    button.id = 'hikeSelect';
    var element = document.createElement('div');
    element.className = 'rotate-north ol-unselectable ol-control';
    element.appendChild(button);
    element.style = 'right:0.5em;top:0.5em;'

    Control.call(this, {
      element: element,
      target: options.target
    });
  }

  if ( Control ) SelectHikeControl.__proto__ = Control;
  SelectHikeControl.prototype = Object.create( Control && Control.prototype );
  SelectHikeControl.prototype.constructor = SelectHikeControl;

  SelectHikeControl.prototype.handleRotateNorth = function handleRotateNorth () {
    this.getMap().getView().setRotation(0);
  };

  return SelectHikeControl;
}(Control));


const labelStyle = new Style({
  text: new Text({
    offsetX: 4,
    offsetY: -4,
    textAlign: 'left', 
    font: '12px Calibri,sans-serif',
    overflow: true,
    fill: new Fill({
      color: '#000'
    }),
    stroke: new Stroke({
      color: '#fff',
      width: 3
    })
  })
});

const style = {
  'Point': new Style({
    image: new CircleStyle({
      fill: new Fill({
        color: '#FFC917'
      }),
      radius: 5,
      stroke: new Stroke({
        color: '#003082',
        width: 1
      })
    })
  }),
  'LineString': new Style({
    stroke: new Stroke({
      color: '#003082',
      width: 4
    })
  }),
  'MultiLineString': new Style({
    stroke: new Stroke({
      color: '#003082',
      width: 4
    })
  })
};


const tileLayer = new TileLayer({
  source: new WMTS({
    attributions: 'Tiles © <a href="https://www.pdok.nl/introductie/-/article/basisregistratie-topografie-achtergrondkaarten-brt-a-' +
        '">BRT-Achtergrondkaart PDOK</a>',
    url: 'https://geodata.nationaalgeoregister.nl/tiles/service/wmts',
    layer: 'brtachtergrondkaartgrijs',
    matrixSet: 'EPSG:3857',
    format: 'image/png',
    projection: projection,
    tileGrid: new WMTSTileGrid({
      origin: getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds
    }),
    style: 'default',
    wrapX: true
  })
});

const hikeLayer = new VectorLayer();

const map = new Map({
  target: document.getElementById('map'),
  controls: defaultControls().extend([
    new SelectHikeControl()
  ]),
  layers: [
    tileLayer,
    hikeLayer
  ],
  view: new View({
    center: fromLonLat([0, 0]),
    zoom: 2
  })
});

var geolocation = new Geolocation({
  // enableHighAccuracy must be set to true to have the heading value.
  trackingOptions: {
    enableHighAccuracy: true
  },
  projection: map.getView().getProjection()
});

geolocation.on('error', function(error) {
  var info = document.getElementById('info');
  info.innerHTML = error.message;
  info.style.display = '';
});
var positionFeature = new Feature();
positionFeature.setStyle([new Style({
  image: new CircleStyle({
    radius: 6,
    // fill: new Fill({
    //   color: '#003082'
    // }),
    stroke: new Stroke({
      color: '#003082',
      width: 2
    })
  })
}),new Style({
    image: new RegularShape({
      // fill: new Fill({
      //   color: '#003082'
      // }),
      stroke: new Stroke({
        color: '#003082',
        width: 2
      }),
      points: 4,
      radius: 10,
      radius2: 0,
      angle: 0
    })
  })
]);


geolocation.on('change:position', function() {
  var coordinates = geolocation.getPosition();
  positionFeature.setGeometry(coordinates ?
    new Point(coordinates) : null);
});

geolocation.setTracking(true);

var geolocationLayer = new VectorLayer({
  source: new VectorSource({
    features: [positionFeature]
  })
});

map.addLayer(geolocationLayer);

function getData() {
  return axios.get('data/index.json')
    .then(response => {
      response.data.sort(function(a, b) {
        if (a.title < b.title) {
          return -1;
        }
        if (a.title > b.title) {
          return 1;
        }
        return 0;
      });
      response = response.data;
      return response;
    });
}

function fillSelect(data) {
  const arrayLength = data.length;
  for (let i = 0; i < arrayLength; i++) {
    const opt = document.createElement('option');
    opt.value = data[i].url;
    opt.text = data[i].title;
    const hikes = document.getElementById('hikeSelect');
    hikes.add(opt, null);
  }
}
function getEntryBySlug(data, slug) {
  const arrayLength = data.length;
  for (let i = 0; i < arrayLength; i++) {
    if (string_to_slug(data[i].title) === slug) {
      return data[i];
    }
  }
  return null;
}

function getEntryByUrl(data, url) {
  const arrayLength = data.length;
  for (let i = 0; i < arrayLength; i++) {
    if (data[i].url === url) {
      return data[i];
    }
  }
  return null;
}

function loadGPXToMap(urls) {
  var gpxSource = new VectorSource({
    format: new GPX(),
    loader: function() {
      async function getAllData(urls) {
        let networkRequestPromises = urls.map(fetchData);
        return await Promise.all(networkRequestPromises);
      }
      function fetchData(url) {
        return axios
          .get(url)
          .then(function(response) {
            return {
              success: true,
              data: response.data
            };
          })
          .catch(function(error) {
            return { success: false };
          });
      }
      getAllData(urls).then(resps=>{
        resps.forEach(function(resp) {
            gpxSource.addFeatures(gpxSource.getFormat().readFeatures(resp.data, {
              dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:3857'
            }));
          })
      }).catch(e=>{
        console.log(e)
      })
     },
     strategy: bbox
   });
  hikeLayer.setSource(gpxSource);
  hikeLayer.setStyle(function(feature, resolution) {
    if (resolution < 10) {
      labelStyle.getText().setText(feature.get('name'));
      return [style[feature.getGeometry().getType()], labelStyle];
    }
    return [style[feature.getGeometry().getType()]];
  });
  hikeLayer.addEventListener('change', function(event) {
    map.getView().fit(hikeLayer.getSource().getExtent(), (map.getSize()));
  });
}

function addEventListener(data) {
  const hikes = document.getElementById('hikeSelect');
  hikes.addEventListener('change', function() {
    const el = getEntryByUrl(data, hikes.value);
    const slug = string_to_slug(el.title);
    window.location.hash = slug;
    loadGPXToMap(el.downloads);
  });
}

function initApp(data){
  const hikes = document.getElementById('hikeSelect');
  const hash = window.location.hash.substr(1);
  let selectedIndex = 0;
  if (hash){
    const el = getEntryBySlug(data, hash);
    if (el){
      let i = 0;
      const arrayLength =  hikes.options.length;
      for (let i = 0; i < arrayLength; i++) {
        if (hikes.options[i].value == el.url){
          selectedIndex = i
        }
      }
    }
  }
  hikes.selectedIndex = selectedIndex;
  const event = new Event('change');
  hikes.dispatchEvent(event);
}

getData()
  .then(data => {
    fillSelect(data);
    addEventListener(data);
    initApp(data);
  });


const displayFeatureInfo = function(pixel) {
  const features = [];
  map.forEachFeatureAtPixel(pixel, function(feature) {
    features.push(feature);
  });
  if (features.length > 0) {
    const info = [];
    let i, ii;
    for (i = 0, ii = features.length; i < ii; ++i) {
      info.push(features[i].get('desc'));
    }
    // document.getElementById('info').innerHTML = info.join(', ') || '(unknown)';
    map.getTarget().style.cursor = 'pointer';
  } else {
    // document.getElementById('info').innerHTML = '&nbsp;';
    map.getTarget().style.cursor = '';
  }
};

map.on('pointermove', function(evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function(evt) {
  displayFeatureInfo(evt.pixel);
});


map.setView(new View({
  center: [610273.27, 6812067.91],
  zoom: 7
}));



