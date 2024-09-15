<script setup>
import { useRoute } from 'vue-router'
import Navigation from '@/views/pages/navigation/Navigation.vue'

const route = useRoute()
const activeTab = ref(route.params.tab)

</script>

<template>
  <div v-if="$i18n.locale=='zh'">
    <VTabs
      v-model="activeTab"
      show-arrows
    >
      <VTab
        v-for="item in tabs_ch"
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
  <div v-else>
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


<script>
export default {
  data() {
    return {
      tabs: [
        {
          title: 'Navigation',
          icon: 'bxs-add-to-queue',
          tab: 'navigation',
        },
      ],
      tabs_ch: [
        {
          title: '导航',
          icon: 'bxs-add-to-queue',
          tab: 'navigation',
        },
      ]
    }
  },
}
</script>
