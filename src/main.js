import { createApp } from 'vue'
import App from './App.vue'
import { createWebHistory,createRouter } from 'vue-router'

import Hikes from './components/hikes';
import Hike from './components/hike'

const routes = [
    { path: '/', component: Hikes },
    { path: '/ns-wandeling/:hikeId', component: Hike, name: 'ns-wandeling', },
    { path: '/:pathMatch(.*)*', redirect:  '/' }
  ]
//  
const router = createRouter({
    history: createWebHistory(),
    routes: routes
})
createApp(App).use(router).mount('#app')

