<script setup>
import { useRoute } from 'vue-router'
import Timetable from '@/views/pages/timetable/Timetable.vue'

const route = useRoute()
const activeTab = ref(route.params.tab)

// tabs

</script>

<template>
  <div v-if="$i18n.locale == 'zh'">
    <VTabs v-model="activeTab" show-arrows>
      <VTab v-for="item in tabs_ch" :key="item.icon" :value="item.tab">
        <VIcon size="20" start :icon="item.icon" />
        {{ item.title }}
      </VTab>
    </VTabs>
    <VDivider />

    <VWindow v-model="activeTab" class="mt-5 disable-tab-transition">
      <!-- Account -->
      <VWindowItem value="timetable">
        <Timetable />
      </VWindowItem>
    </VWindow>
  </div>
  <div v-else>
    <VTabs v-model="activeTab" show-arrows>
      <VTab v-for="item in tabs" :key="item.icon" :value="item.tab">
        <VIcon size="20" start :icon="item.icon" />
        {{ item.title }}
      </VTab>
    </VTabs>
    <VDivider />

    <VWindow v-model="activeTab" class="mt-5 disable-tab-transition">
      <!-- Account -->
      <VWindowItem value="timetable">
        <Timetable />
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
          title: 'Timetable',
          icon: 'mdi-timetable',
          tab: 'timetable',
        },
      ],
      tabs_ch: [
        {
          title: '时间表',
          icon: 'mdi-timetable',
          tab: 'timetable',
        },
      ]
    }
  },
}
</script>
