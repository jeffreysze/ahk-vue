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
              AI聊天机器人
            </v-card-title>
            <v-card-text class="flex-grow-1 overflow-y-auto">
              <template v-for="(msg, i) in messages">
                <div :class="{ 'd-flex flex-row-reverse': msg.me }">
                  <v-menu offset-y>
                    <template v-slot:activator="{ on }">
                      <v-hover v-slot:default="{ hover }">
                        <v-chip :color="msg.me ? 'primary' : ''" dark style="height:auto;white-space: normal;"
                          class="pa-4 mb-2" v-on="on">
                          <h3>{{ msg.content }}</h3>
                          <sub class="ml-2" style=""><h4>{{ msg.created_at }}</h4></sub>
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
              <v-text-field v-model="messageForm.content" label="输入信息" type="text" no-details outlined
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
          content: "你好，请问有空闲安保机器人吗？",
          me: true,
          created_at: "11:11am"
        },
        {
          content: "是的，我是来帮助你的。在安保方面我能为您提供什么帮助？",
          me: false,
          created_at: "11:11am"
        },
        {
          content: "我很担心家里的安全。我可以采取什么措施来增强安保？",
          me: true,
          created_at: "11:11am"
        },
        {
          content: "以下是一些针对您家居的一般安全提示：",
          me: false,
          created_at: "11:11am"
        },
        {
          content: "以下是一些适用于您家庭的一般安全提示： \
                    1. 安装带有摄像头和传感器的可靠安全系统。 \
                    2. 确保所有门窗均已正确锁定，包括使用门闩。 \
                    3. 考虑使用更坚固的材料加固入口点，例如实心门和防碎玻璃。 \
                    4. 使用户外照明和运动传感器来阻止潜在的入侵者。",
          me: false,
          created_at: "11:11am"
        },
        {
          content: "谢谢你的建议！我会实施这些建议来提高我家的安全性。",
          me: true,
          created_at: "11:11am"
        },
        {
          content: "不用客气！我很高兴能帮到您。如果您还有其他问题或需要进一步帮助，请随时询问。注意安全！",
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
