import Popover from '../popover/popover.vue'
import ConfirmModal from '../confirm_modal/confirm_modal.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faEllipsisH,
  faBookmark,
  faEyeSlash,
  faThumbtack,
  faShareAlt,
  faExternalLinkAlt,
  faHistory,
  faFilePen,
  faTooth
} from '@fortawesome/free-solid-svg-icons'
import {
  faBookmark as faBookmarkReg,
  faFlag
} from '@fortawesome/free-regular-svg-icons'
import { mapState } from 'vuex'

library.add(
  faEllipsisH,
  faBookmark,
  faBookmarkReg,
  faEyeSlash,
  faThumbtack,
  faShareAlt,
  faExternalLinkAlt,
  faFlag,
  faHistory,
  faFilePen,
  faTooth
)

const ExtraButtons = {
  props: ['status'],
  components: {
    Popover,
    ConfirmModal
  },
  data () {
    return {
      expanded: false,
      showingDeleteDialog: false,
      showingRedraftDialog: false
    }
  },
  methods: {
    deleteStatus () {
      if (this.shouldConfirmDelete) {
        this.showDeleteStatusConfirmDialog()
      } else {
        this.doDeleteStatus()
      }
    },
    doDeleteStatus () {
      this.$store.dispatch('deleteStatus', { id: this.status.id })
      this.hideDeleteStatusConfirmDialog()
    },
    showDeleteStatusConfirmDialog () {
      this.showingDeleteDialog = true
    },
    hideDeleteStatusConfirmDialog () {
      this.showingDeleteDialog = false
    },
    translateStatus () {
      if (this.noTranslationTargetSet) {
        this.$store.dispatch('pushGlobalNotice', { messageKey: 'toast.no_translation_target_set', level: 'info' })
      }
      const translateTo = this.$store.getters.mergedConfig.translationLanguage || this.$store.state.instance.interfaceLanguage
      this.$store.dispatch('translateStatus', { id: this.status.id, language: translateTo })
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    pinStatus () {
      this.$store.dispatch('pinStatus', this.status.id)
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    unpinStatus () {
      this.$store.dispatch('unpinStatus', this.status.id)
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    muteConversation () {
      this.$store.dispatch('muteConversation', this.status.id)
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    unmuteConversation () {
      this.$store.dispatch('unmuteConversation', this.status.id)
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    copyLink () {
      navigator.clipboard.writeText(this.statusLink)
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    bookmarkStatus () {
      this.$store.dispatch('bookmark', { id: this.status.id })
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    unbookmarkStatus () {
      this.$store.dispatch('unbookmark', { id: this.status.id })
        .then(() => this.$emit('onSuccess'))
        .catch(err => this.$emit('onError', err.error.error))
    },
    reportStatus () {
      this.$store.dispatch('openUserReportingModal', { userId: this.status.user.id, statusIds: [this.status.id] })
    },
    editStatus () {
      this.$store.dispatch('fetchStatusSource', { id: this.status.id })
        .then(data => this.$store.dispatch('openEditStatusModal', {
          statusId: this.status.id,
          subject: data.spoiler_text,
          statusText: data.text,
          statusIsSensitive: this.status.nsfw,
          statusPoll: this.status.poll,
          statusFiles: [...this.status.attachments],
          visibility: this.status.visibility,
          statusContentType: data.content_type
        }))
    },
    showStatusHistory () {
      const originalStatus = { ...this.status }
      const stripFieldsList = ['attachments', 'created_at', 'emojis', 'text', 'raw_html', 'nsfw', 'poll', 'summary', 'summary_raw_html']
      stripFieldsList.forEach(p => delete originalStatus[p])
      this.$store.dispatch('openStatusHistoryModal', originalStatus)
    },
    redraftStatus () {
      if (this.shouldConfirmDelete) {
        this.showRedraftStatusConfirmDialog()
      } else {
        this.doRedraftStatus()
      }
    },
    doRedraftStatus () {
      this.$store.dispatch('fetchStatusSource', { id: this.status.id })
        .then(data => {
          let repliedUserId = this.status.in_reply_to_user_id;
          let repliedUser = this.status.attentions.filter(user =>
            user.id === repliedUserId);
          this.$store.dispatch('openPostStatusModal', {
            isRedraft: true,
            attentions: this.status.attentions,
            statusId: this.status.id,
            subject: data.spoiler_text,
            statusText: data.text,
            statusIsSensitive: this.status.nsfw,
            statusPoll: this.status.poll,
            statusFiles: [...this.status.attachments],
            statusScope: this.status.visibility,
            statusLanguage: this.status.language,
            statusContentType: data.content_type,
            replyTo: this.status.in_reply_to_status_id,
            repliedUser: repliedUser
          })
        })
      this.doDeleteStatus()
    },
    showRedraftStatusConfirmDialog () {
      this.showingRedraftDialog = true
    },
    hideRedraftStatusConfirmDialog () {
      this.showingRedraftDialog = false
    },
    biteNote () {
      this.$store.dispatch('biteNote', this.status.id)
    }
  },
  computed: {
    currentUser () { return this.$store.state.users.currentUser },
    canDelete () {
      if (!this.currentUser) { return }
      const superuser = this.currentUser.rights.moderator || this.currentUser.rights.admin
      return superuser || this.status.user.id === this.currentUser.id
    },
    ownStatus () {
      return this.status.user.id === this.currentUser.id
    },
    canPin () {
      return this.ownStatus && (this.status.visibility === 'public' || this.status.visibility === 'unlisted')
    },
    canMute () {
      return !!this.currentUser
    },
    canTranslate () {
      return this.$store.state.instance.translationEnabled === true
    },
    noTranslationTargetSet () {
      return this.$store.getters.mergedConfig.translationLanguage === undefined
    },
    statusLink () {
      if (this.status.is_local) {
        return `${this.$store.state.instance.server}${this.$router.resolve({ name: 'conversation', params: { id: this.status.id } }).href}`
      } else {
        return this.status.external_url
      }
    },
    shouldConfirmDelete () {
      return this.$store.getters.mergedConfig.modalOnDelete
    },
    isEdited () {
      return this.status.edited_at !== null
    },
    editingAvailable () { return this.$store.state.instance.editingAvailable },
  }
}

export default ExtraButtons
