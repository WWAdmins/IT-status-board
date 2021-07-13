import Vue from 'vue'
import App from './App.vue'

import { BootstrapVue} from 'bootstrap-vue'

// Import Bootstrap an BootstrapVue CSS files (order is important)
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)

// Toasts
import VueToast from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-sugar.css';

Vue.use(VueToast);

// Scroller (prevent overloading on item cards)
import VueVirtualScroller from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

Vue.use(VueVirtualScroller)

import 'vue-simple-context-menu/dist/vue-simple-context-menu.css'

import VueSimpleContextMenu from 'vue-simple-context-menu'
Vue.component('vue-simple-context-menu', VueSimpleContextMenu)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
