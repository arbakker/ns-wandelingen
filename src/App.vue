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
body{
  margin:0;
  font-family: NS Sans,Segoe UI,Myriad,Verdana,sans-serif;
}
#map, #map-2{
  width: 100vw;
  height: 100vh;
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
}
.ol-attribution{
  bottom: 2em !important;
}
</style>
