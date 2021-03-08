<template>
  <div id="hike-info" class="ol-control">
    <h2>{{hike.properties.title}}</h2>
    <p>
      <ul>
        <li><a :href="hike.properties.url" rel="noopener" target="_blank" >Wandeling op de NS website</a></li>
        <li v-for="(item, index) in hike.properties.gpxfiles.split(',')" :key="item">
           <a download :href="'./data/' + item" rel="noopener" target="_blank" >
             Download GPX bestand {{ hike.properties.gpxfiles.split(',').length > 1 ? index + 1 : '' }}
             </a>
        </li>
      </ul>
    </p>
  </div>
</template>

<script>
export default {
  name: 'HikeInfo',
  props: {
    hike: { required: true, type: Object }
  },
  methods: {},
  mounted () {
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
h2{
  margin-top:0.5em;
}
#hike-info:hover{
  background-color: rgba(255,255,255,0.4);
}
ul {
  list-style: none;
  padding-left: 10px;
}

@media only screen and (max-width: 600px) {
  #hike-info  {
    display: none;
  }
}
</style>
