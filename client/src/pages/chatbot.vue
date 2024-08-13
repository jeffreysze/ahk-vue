<script setup>
import { useRoute } from 'vue-router'
import Chatbot from '@/views/pages/chatbot/Chatbot.vue'

const route = useRoute()
const activeTab = ref(route.params.tab)

// tabs

</script>

<template>
  <div v-if="$i18n.locale=='zh'">
    <VTabs v-model="activeTab" show-arrows>
      <VTab v-for="item in tabs_ch" :key="item.icon" :value="item.tab">
        <VIcon size="20" start :icon="item.icon" />
        {{ item.title }}
      </VTab>
    </VTabs>
    <VDivider />

    <VWindow v-model="activeTab" class="mt-5 disable-tab-transition">
      <!-- Account -->
      <VWindowItem value="chatbot">
        <Chatbot />
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
      <VWindowItem value="chatbot">
        <Chatbot />
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
          title: 'AI Chatbot',
          icon: 'mdi-message',
          tab: 'chatbot',
        },
      ],
      tabs_ch: [
        {
          title: 'AI聊天机器人',
          icon: 'mdi-message',
          tab: 'chatbot',
        },
      ]
    }
  },
}
</script>
