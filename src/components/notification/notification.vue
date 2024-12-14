<template>
  <Status
    v-if="notification.type === 'mention'"
    class="Notification"
    :compact="true"
    :statusoid="notification.status"
  />
  <div v-else>
    <div
      v-if="needMute && !unmuted"
      class="Notification container -muted"
    >
      <small>
        <router-link :to="userProfileLink">
          {{ notification.from_profile.screen_name_ui }}
        </router-link>
      </small>
      <button
        class="button-unstyled unmute"
        @click.prevent="toggleMute"
      >
        <FAIcon
          class="fa-scale-110 fa-old-padding"
          icon="eye-slash"
        />
      </button>
    </div>
    <div
      v-else
      class="Notification non-mention"
      :class="[userClass, { highlighted: userStyle }, '-type--' + notification.type]"
      :style="[ userStyle ]"
    >
      <a
        class="avatar-container"
        :href="$router.resolve(userProfileLink).href"
        @click.stop.prevent.capture="toggleUserExpanded"
      >
        <UserAvatar
          :compact="true"
          :better-shadow="betterShadow"
          :user="notification.from_profile"
        />
      </a>
      <div class="notification-right">
        <UserCard
          v-if="userExpanded"
          :user-id="getUser(notification).id"
          :rounded="true"
          :bordered="true"
        />
        <span class="notification-details">
          <div class="name-and-action">
            <!-- eslint-disable vue/no-v-html -->
            <bdi v-if="!!notification.from_profile.name_html">
              <RichContent
                class="username"
                :title="'@'+notification.from_profile.screen_name_ui"
                :html="notification.from_profile.name_html"
                :emoji="notification.from_profile.emoji"
              />
            </bdi>
            <!-- eslint-enable vue/no-v-html -->
            <span
              v-else
              class="username"
              :title="'@'+notification.from_profile.screen_name_ui"
            >
              {{ notification.from_profile.name }}
            </span>
            {{ ' ' }}
            <span v-if="notification.type === 'like'">
              <FAIcon
                class="type-icon"
                icon="star"
              />
              {{ ' ' }}
              <small>{{ $t('notifications.favorited_you') }}</small>
            </span>
            <span v-if="notification.type === 'repeat'">
              <FAIcon
                class="type-icon"
                icon="retweet"
                :title="$t('tool_tip.repeat')"
              />
              {{ ' ' }}
              <small>{{ $t('notifications.repeated_you') }}</small>
            </span>
            <span v-if="notification.type === 'follow'">
              <FAIcon
                class="type-icon"
                icon="user-plus"
              />
              {{ ' ' }}
              <small>{{ $t('notifications.followed_you') }}</small>
            </span>
            <span v-if="notification.type === 'follow_request'">
              <FAIcon
                class="type-icon"
                icon="user"
              />
              {{ ' ' }}
              <small>{{ $t('notifications.follow_request') }}</small>
            </span>
            <span v-if="notification.type === 'bite'">
              <FAIcon
                class="type-icon"
                icon="tooth"
              />
              {{ ' ' }}
              <small>{{ $t('notifications.bit') }}</small>
            </span>
            <span v-if="notification.type === 'move'">
              <FAIcon
                class="type-icon"
                icon="suitcase-rolling"
              />
              {{ ' ' }}
              <small>{{ $t('notifications.migrated_to') }}</small>
            </span>
            <span v-if="notification.type === 'pleroma:emoji_reaction'">
              <small>
                <i18n-t
                  scope="global"
                  keypath="notifications.reacted_with"
                >
                  <still-image
                    v-if="notification.emoji_url !== null"
                    class="notification-reaction-emoji"
                    :src="notification.emoji_url"
                    :title="notification.emoji"
                    :alt="notification.emoji"
                  />
                  <span
                    v-else
                    class="emoji-reaction-emoji"
                  >
                    {{ notification.emoji }}
                  </span>
                </i18n-t>
              </small>
            </span>
            <span v-if="notification.type === 'poll'">
              <FAIcon
                class="type-icon"
                icon="poll-h"
              />
              {{ ' ' }}
              <small>{{ $t('notifications.poll_ended') }}</small>
            </span>
          </div>
          <div
            v-if="isStatusNotification"
            class="timeago"
          >
            <router-link
              v-if="notification.status"
              :to="{ name: 'conversation', params: { id: notification.status.id } }"
              class="faint-link"
            >
              <Timeago
                :time="notification.created_at"
                :auto-update="240"
              />
            </router-link>
          </div>
          <div
            v-else
            class="timeago"
          >
            <span class="faint">
              <Timeago
                :time="notification.created_at"
                :auto-update="240"
              />
            </span>
          </div>
          <button
            v-if="needMute"
            class="button-unstyled"
            @click.prevent="toggleMute"
          >
            <FAIcon
              class="fa-scale-110 fa-old-padding"
              icon="eye-slash"
            />
          </button>
        </span>
        <div
          v-if="notification.type === 'follow' || notification.type === 'follow_request'"
          class="follow-text"
        >
          <router-link
            :to="userProfileLink"
            class="follow-name"
          >
            @{{ notification.from_profile.screen_name_ui }}
          </router-link>
          <div
            v-if="notification.type === 'follow_request'"
            style="white-space: nowrap;"
          >
            <button
              class="button-unstyled"
              :title="$t('tool_tip.accept_follow_request')"
              @click="approveUser()"
            >
              <FAIcon
                icon="check"
                class="fa-scale-110 fa-old-padding follow-request-accept"
              />
            </button>
            <button
              class="button-unstyled"
              :title="$t('tool_tip.reject_follow_request')"
              @click="denyUser()"
            >
              <FAIcon
                icon="times"
                class="fa-scale-110 fa-old-padding follow-request-reject"
              />
            </button>
          </div>
        </div>
        <div
          v-else-if="notification.type === 'move'"
          class="move-text"
        >
          <router-link :to="targetUserProfileLink">
            @{{ notification.target.screen_name_ui }}
          </router-link>
        </div>
        <div
          v-else-if="notification.type === 'bite'"
          class="move-text"
        >
          <router-link :to="targetUserProfileLink">
            @{{ notification.target.screen_name_ui }}
          </router-link>
        </div>
        <template v-else>
          <StatusContent
            class="faint"
            :compact="true"
            :status="notification.action"
          />
        </template>
      </div>
    </div>
    <teleport to="#modal">
      <confirm-modal
        v-if="showingApproveConfirmDialog"
        :title="$t('user_card.approve_confirm_title')"
        :confirm-text="$t('user_card.approve_confirm_accept_button')"
        :cancel-text="$t('user_card.approve_confirm_cancel_button')"
        @accepted="doApprove"
        @cancelled="hideApproveConfirmDialog"
      >
        {{ $t('user_card.approve_confirm', { user: user.screen_name_ui }) }}
      </confirm-modal>
      <confirm-modal
        v-if="showingDenyConfirmDialog"
        :title="$t('user_card.deny_confirm_title')"
        :confirm-text="$t('user_card.deny_confirm_accept_button')"
        :cancel-text="$t('user_card.deny_confirm_cancel_button')"
        @accepted="doDeny"
        @cancelled="hideDenyConfirmDialog"
      >
        {{ $t('user_card.deny_confirm', { user: user.screen_name_ui }) }}
      </confirm-modal>
    </teleport>
  </div>
</template>

<script src="./notification.js"></script>
<style src="./notification.scss" lang="scss"></style>
