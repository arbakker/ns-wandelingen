import { createApp } from 'vue'
import App from './App.vue'
import { createWebHashHistory, createRouter } from 'vue-router'

import Hikes from './components/hikes'
import Hike from './components/hike'

const routes = [
  { path: '/', component: Hikes, name: 'ns-wandelingen' },
  { path: '/wandeling/:hikeId', component: Hike, name: 'ns-wandeling' },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]
//
const router = createRouter({
  history: createWebHashHistory(

  ),
  routes: routes
})
createApp(App).use(router).mount('#app')
