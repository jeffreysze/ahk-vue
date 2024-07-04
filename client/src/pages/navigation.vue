<script setup>
import { useRoute } from 'vue-router'
import Navigation from '@/views/pages/navigation/Navigation.vue'

const route = useRoute()
const activeTab = ref(route.params.tab)

// tabs
const tabs = [
  {
    title: 'Navigation',
    icon: 'mdi-map-marker-multiple',
    tab: 'navigation',
  },
]
</script>

<template>
  <div>
    <VTabs
      v-model="activeTab"
      show-arrows
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
      >
        <VIcon
          size="20"
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>
    <VDivider />

    <VWindow
      v-model="activeTab"
      class="mt-5 disable-tab-transition"
    >
      <!-- Account -->
      <VWindowItem value="navigation">
        <Navigation />
      </VWindowItem>
    </VWindow>
  </div>
</template>
