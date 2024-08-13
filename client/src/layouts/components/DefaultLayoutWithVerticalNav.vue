<script setup>
import { useTheme } from 'vuetify'
import VerticalNavSectionTitle from '@/@layouts/components/VerticalNavSectionTitle.vue'
import upgradeBannerDark from '@images/pro/upgrade-banner-dark.png'
import upgradeBannerLight from '@images/pro/upgrade-banner-light.png'
import VerticalNavLayout from '@layouts/components/VerticalNavLayout.vue'
import VerticalNavLink from '@layouts/components/VerticalNavLink.vue'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'

const vuetifyTheme = useTheme()

const upgradeBanner = computed(() => {
  return vuetifyTheme.global.name.value === 'light' ? upgradeBannerLight : upgradeBannerDark
})
</script>

<template>
  <VerticalNavLayout>
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <!-- 👉 Vertical nav toggle in overlay mode -->
        <IconBtn
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="bx-menu" />
        </IconBtn>

        <!-- 👉 Search -->
        <!--h1 class="leading-normal" style="color:blue">
          <i>I-Robotics</i>
        </h1-->

        <VSpacer />

        <!--IconBtn
          class="me-2"
          href="https://github.com/themeselection/sneat-vuetify-vuejs-admin-template-free"
          target="_blank"
          rel="noopener noreferrer"
        >
          <VIcon icon="bxl-github" />
        </IconBtn>

        <IconBtn class="me-2">
          <VIcon icon="bx-bell" />
        </IconBtn>

        <NavbarThemeSwitcher class="me-2" />

        <UserProfile /-->
      </div>
    </template>


  <!-- SideNav when showing Simplified Chinese -->

    <template #vertical-nav-content v-if="$i18n.locale=='zh'">
      <!--VerticalNavLink
        :item="{
          title: '仪表板',
          icon: 'bx-home',
          to: '/dashboard',
        }"
      /-->
      <VerticalNavLink
        :item="{
          title: '创建地图',
          icon: 'mdi-plus-box-multiple',
          to: '/create-map',
        }"
      />
      <VerticalNavLink
        :item="{
          title: '导航',
          icon: 'mdi-map-marker-multiple',
          to: '/navigation',
        }"
      />
      <VerticalNavLink
        :item="{
          title: '时间表',
          icon: 'mdi-timetable',
          to: '/timetable',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'AI聊天机器人',
          icon: 'mdi-message-processing',
          to: '/chatbot',
        }"
      />

      <!-- 👉 Pages -->
      <!--VerticalNavSectionTitle
        :item="{
          heading: '授权',
        }"
      />
      <VerticalNavLink
        :item="{
          title: '登录',
          icon: 'bx-log-in',
          to: '/login',
        }"
      />
      <VerticalNavLink
        :item="{
          title: '注册',
          icon: 'bx-user-plus',
          to: '/register',
        }"
      /-->
    </template>

  <!-- SideNav when NOT showing Simplified Chinese -->
    <template #vertical-nav-content v-else>
      <VerticalNavLink
        :item="{
          title: 'Dashboard',
          icon: 'bx-home',
          to: '/dashboard',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Create Map',
          icon: 'mdi-plus-box-multiple',
          to: '/create-map',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Navigation',
          icon: 'mdi-map-marker-multiple',
          to: '/navigation',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'AI Chatbot',
          icon: 'mdi-message-processing',
          to: '/chatbot',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Timetable',
          icon: 'mdi-timetable',
          to: '/timetable',
        }"
      />

      <!-- 👉 Pages -->
      <VerticalNavSectionTitle
        :item="{
          heading: 'Auth',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Login',
          icon: 'bx-log-in',
          to: '/login',
        }"
      />
      <VerticalNavLink
        :item="{
          title: 'Register',
          icon: 'bx-user-plus',
          to: '/register',
        }"
      />
    </template>


    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>
  </VerticalNavLayout>
</template>
<script>
export default {
  data() {
    return {
      sideBar: {

      }
    }
  }
}
</script>



<style lang="scss" scoped>
.meta-key {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  block-size: 1.5625rem;
  line-height: 1.3125rem;
  padding-block: 0.125rem;
  padding-inline: 0.25rem;
}
</style>
