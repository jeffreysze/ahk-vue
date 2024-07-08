<script setup>


</script>

<template>
  <v-container class="fill-height pa-0 ">
    <v-row class="no-gutters elevation-4">
      <v-col cols="12" sm="3" class="flex-grow-1 flex-shrink-0" style="border-right: 1px solid #0000001f;">
        <v-responsive class="overflow-y-auto fill-height" height="500">
          <v-list subheader>
            <v-list-item-group v-model="activeChat">
              <template>
                <v-list-item v-for="(item, index) in parents" :key="`parent${index}`" :value="item.id">
                  <v-list-item-avatar color="grey lighten-1 white--text">
                    <v-icon>
                      chat_bubble
                    </v-icon>
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title v-text="item.title" />
                    <v-list-item-subtitle v-text="'hi'" />
                  </v-list-item-content>
                  <v-list-item-icon>
                    <v-icon :color="item.active ? 'deep-purple accent-4' : 'grey'">
                      chat_bubble
                    </v-icon>
                  </v-list-item-icon>
                </v-list-item>
                <v-divider :key="`chatDivider${index}`" class="my-0" />
              </template>
            </v-list-item-group>
          </v-list>
        </v-responsive>
      </v-col>
      <v-col cols="auto" class="flex-grow-1 flex-shrink-0">
        <v-responsive v-if="activeChat" class="overflow-y-hidden fill-height" height="500">
          <v-card flat class="d-flex flex-column fill-height">
            <v-card-title>
              AI Chatbot
            </v-card-title>
            <v-card-text class="flex-grow-1 overflow-y-auto">
              <template v-for="(msg, i) in messages">
                <div :class="{ 'd-flex flex-row-reverse': msg.me }">
                  <v-menu offset-y>
                    <template v-slot:activator="{ on }">
                      <v-hover v-slot:default="{ hover }">
                        <v-chip :color="msg.me ? 'primary' : ''" dark style="height:auto;white-space: normal;"
                          class="pa-4 mb-2" v-on="on">
                          {{ msg.content }}
                          <sub class="ml-2" style="font-size: 0.5rem;">{{ msg.created_at }}</sub>
                          <v-icon v-if="hover" small>
                            expand_more
                          </v-icon>
                        </v-chip>
                      </v-hover>
                    </template>
                    <v-list>
                      <v-list-item>
                        <v-list-item-title>delete</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </template>
            </v-card-text>
            <v-card-text class="flex-shrink-1">
              <v-text-field v-model="messageForm.content" label="type a message" type="text" no-details outlined
                append-outer-icon="send" @keyup.enter="messages.push(messageForm)"
                @click:append-outer="messages.push(messageForm)" hide-details />
            </v-card-text>
          </v-card>
        </v-responsive>
      </v-col>
    </v-row>
  </v-container>
</template>
<script>
export default {
  data() {
    return {
      activeChat: 1,
      parents: [
        {
          id: 1,
          title: "john doe",
          active: true
        },
        {
          id: 3,
          title: "scarlett",
          active: false
        },
        {
          id: 4,
          title: "scarlett",
          active: false
        },
        {
          id: 5,
          title: "scarlett",
          active: false
        },
        {
          id: 6,
          title: "scarlett",
          active: false
        },
        {
          id: 7,
          title: "scarlett",
          active: false
        },
        {
          id: 8,
          title: "scarlett",
          active: false
        },
        {
          id: 9,
          title: "scarlett",
          active: false
        },
        {
          id: 10,
          title: "scarlett",
          active: false
        },
        {
          id: 11,
          title: "scarlett",
          active: false
        },
        {
          id: 12,
          title: "scarlett",
          active: false
        },
        {
          id: 13,
          title: "scarlett",
          active: false
        },
        {
          id: 14,
          title: "scarlett",
          active: false
        }
      ],
      messages: [
        {
          content: "Hello, is there a security robot available?",
          me: true,
          created_at: "11:11am"
        },
        {
          content: "Yes, I'm here to assist you. How can I help you with security?",
          me: false,
          created_at: "11:11am"
        },
        {
          content: "I'm concerned about the security of my home. What measures can I take to enhance it?",
          me: true,
          created_at: "11:11am"
        },
        {
          content: "Here are some general security tips for your home:",
          me: false,
          created_at: "11:11am"
        },
        {
          content: "Here are some general security tips for your home: \
                    1. Install a reliable security system with cameras and sensors. \
                    2. Ensure all doors and windows are properly locked, including using deadbolts. \
                    3. Consider reinforcing entry points with stronger materials, such as solid doors and shatter-resistant glass. \
                    4. Use outdoor lighting and motion sensors to deter potential intruders.",
          me: false,
          created_at: "11:11am"
        },
        {
          content: "Thank you for the tips! I'll make sure to implement them to improve the security of my home.",
          me: true,
          created_at: "11:11am"
        },
        {
          content: "You're welcome! I'm glad I could help. If you have any more questions or need further assistance, feel free to ask. Stay safe!",
          me: false,
          created_at: "11:12am"
        },
      ],
      messageForm: {
        content: "",
        me: true,
        created_at: "11:13am"
      }
    }
  },
}
</script>
