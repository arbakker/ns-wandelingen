<template>  
  <router-view></router-view>
</template>

<script>
// import Hikes from './components/hikes.vue'

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
#map {
  width: 100vw;
  height: 100vh;
}
.ol-overlay-container{
  pointer-events: inherit  !important;
}
.bw{
        filter: grayscale(100%);
  }
</style>
