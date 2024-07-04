<script setup>
import { useRoute } from 'vue-router'
import CreateMap from '@/views/pages/create-map/CreateMap.vue'

const route = useRoute()
const activeTab = ref(route.params.tab)

// tabs
const tabs = [
  {
    title: 'Create Map',
    icon: 'bxs-add-to-queue',
    tab: 'create-map',
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
      <VWindowItem value="create-map">
        <CreateMap />
      </VWindowItem>
    </VWindow>
  </div>
</template>
