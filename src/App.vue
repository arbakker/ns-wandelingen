<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'App',
  components: {
  }
}
</script>

<style>
html, body, #app {
    height: 100%;
}

body{
  margin:0;
  font-family: NS Sans,Segoe UI,Myriad,Verdana,sans-serif;
}
#container, #map{
  width: 100vw;
  height: 100%;
}
.ol-overlay-container{
  pointer-events: inherit  !important;
}
.bw{
    filter: grayscale(100%);
  }
.ol-scale-line{
  right: 0.5em !important;
  left:unset !important;
  bottom: 2.7em !important;
}
/* .ol-attribution{
  bottom: 2em !important;
} */
</style>
