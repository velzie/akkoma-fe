<template>
  <Popover
    class="ExtraButtons"
    trigger="click"
    placement="top"
    :offset="{ y: 5 }"
    :bound-to="{ x: 'container' }"
    remove-padding
  >
    <template #content="{close}">
      <div class="dropdown-menu">
        <button
          v-if="!ownStatus"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="biteNote"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="tooth"
          /><span>{{ $t("status.bite_note") }}</span>
        </button>
        <button
          v-if="canMute && !status.thread_muted"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="muteConversation"
        >
          <FAIcon
            fixed-width
            icon="eye-slash"
          /><span>{{ $t("status.mute_conversation") }}</span>
        </button>
        <button
          v-if="canMute && status.thread_muted"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="unmuteConversation"
        >
          <FAIcon
            fixed-width
            icon="eye-slash"
          /><span>{{ $t("status.unmute_conversation") }}</span>
        </button>
        <button
          v-if="!status.pinned && canPin"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="pinStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="thumbtack"
          /><span>{{ $t("status.pin") }}</span>
        </button>
        <button
          v-if="status.pinned && canPin"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="unpinStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="thumbtack"
          /><span>{{ $t("status.unpin") }}</span>
        </button>
        <button
          v-if="!status.bookmarked"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="bookmarkStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            :icon="['far', 'bookmark']"
          /><span>{{ $t("status.bookmark") }}</span>
        </button>
        <button
          v-if="status.bookmarked"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="unbookmarkStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="bookmark"
          /><span>{{ $t("status.unbookmark") }}</span>
        </button>
        <button
          v-if="ownStatus && editingAvailable"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="editStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="pen"
          /><span>{{ $t("status.edit") }}</span>
        </button>
        <button
          v-if="isEdited && editingAvailable"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="showStatusHistory"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="history"
          /><span>{{ $t("status.edit_history") }}</span>
        </button>
        <button
          v-if="ownStatus"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="redraftStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="file-pen"
          /><span>{{ $t("status.redraft") }}</span>
        </button>
        <button
          v-if="canDelete"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="deleteStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="times"
          /><span>{{ $t("status.delete") }}</span>
        </button>
        <button
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="copyLink"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="share-alt"
          /><span>{{ $t("status.copy_link") }}</span>
        </button>
        <a
          v-if="!status.is_local"
          class="button-default dropdown-item dropdown-item-icon"
          title="Source"
          :href="status.external_url"
          target="_blank"
        >
          <FAIcon
            fixed-width
            icon="external-link-alt"
          /><span>{{ $t("status.external_source") }}</span>
        </a>
        <button
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="reportStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            :icon="['far', 'flag']"
          /><span>{{ $t("user_card.report") }}</span>
        </button>
        <button
          v-if="canTranslate"
          class="button-default dropdown-item dropdown-item-icon"
          @click.prevent="translateStatus"
          @click="close"
        >
          <FAIcon
            fixed-width
            icon="globe"
          /><span>{{ $t("status.translate") }}</span>

          <template v-if="noTranslationTargetSet">
            <span class="dropdown-item-icon__badge warning">
              <FAIcon
                fixed-width
                icon="exclamation-triangle"
                name="test"
              />
            </span>
          </template>
        </button>
      </div>
    </template>
    <template #trigger>
      <button class="button-unstyled popover-trigger">
        <FAIcon
          class="fa-scale-110 fa-old-padding"
          icon="ellipsis-h"
        />
      </button>
      <teleport to="#modal">
        <ConfirmModal
          v-if="showingDeleteDialog"
          :title="$t('status.delete_confirm_title')"
          :cancel-text="$t('status.delete_confirm_cancel_button')"
          :confirm-text="$t('status.delete_confirm_accept_button')"
          @cancelled="hideDeleteStatusConfirmDialog"
          @accepted="doDeleteStatus"
        >
          {{ $t('status.delete_confirm') }}
        </ConfirmModal>
        <ConfirmModal
          v-if="showingRedraftDialog"
          :title="$t('status.redraft_confirm_title')"
          :cancel-text="$t('status.redraft_confirm_cancel_button')"
          :confirm-text="$t('status.redraft_confirm_accept_button')"
          @cancelled="hideRedraftStatusConfirmDialog"
          @accepted="doRedraftStatus"
        >
          {{ $t('status.redraft_confirm') }}
        </ConfirmModal>
      </teleport>
    </template>
  </Popover>
</template>

<script src="./extra_buttons.js"></script>

<style lang="scss">
@import '../../_variables.scss';

.ExtraButtons {
  /* override of popover internal stuff */
  .popover-trigger-button {
    width: auto;
  }

  .popover-trigger {
    position: static;
    padding: 10px;
    margin: -10px;

    &:hover .svg-inline--fa {
      color: $fallback--text;
      color: var(--text, $fallback--text);
    }
  }
}
</style>
