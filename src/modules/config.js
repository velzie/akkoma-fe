import Cookies from 'js-cookie'
import { setPreset, applyTheme } from '../services/style_setter/style_setter.js'
import messages from '../i18n/messages'
import localeService from '../services/locale/locale.service.js'

const BACKEND_LANGUAGE_COOKIE_NAME = 'userLanguage'

const browserLocale = (window.navigator.language || 'en').split('-')[0]

/* TODO this is a bit messy.
 * We need to declare settings with their types and also deal with
 * instance-default settings in some way, hopefully try to avoid copy-pasta
 * in general.
 */
export const multiChoiceProperties = [
  'postContentType',
  'subjectLineBehavior',
  'conversationDisplay', // tree | linear
  'conversationOtherRepliesButton', // below | inside
  'mentionLinkDisplay' // short | full_for_remote | full
]

export const defaultState = {
  profile: 'default',
  profileVersion: 0, // internal fe copy of server-side version
  expertLevel: 0, // used to track which settings to show and hide
  colors: {},
  theme: undefined,
  customTheme: undefined,
  customThemeSource: undefined,
  hideISP: false,
  hideInstanceWallpaper: false,
  // bad name: actually hides posts of muted USERS
  hideMutedPosts: undefined, // instance default
  hideMutedThreads: undefined, // instance default
  hideThreadsWithBlockedUsers: undefined, // instance default
  hideWordFilteredPosts: undefined, // instance default
  muteBotStatuses: undefined, // instance default
  collapseMessageWithSubject: true, // instance default
  padEmoji: true,
  showNavShortcuts: undefined, // instance default
  showPanelNavShortcuts: undefined, // instance default
  showWiderShortcuts: undefined, // instance default
  hideSiteFavicon: undefined, // instance default
  hideSiteName: undefined, // instance default
  hideAttachments: false,
  hideAttachmentsInConv: false,
  maxThumbnails: 16,
  hideNsfw: true,
  preloadImage: true,
  loopVideo: true,
  loopVideoSilentOnly: true,
  streaming: false,
  emojiReactionsOnTimeline: true,
  alwaysShowNewPostButton: false,
  autohideFloatingPostButton: false,
  pauseOnUnfocused: true,
  displayPageBackgrounds: true,
  stopGifs: undefined,
  replyVisibility: 'all',
  thirdColumnMode: 'notifications',
  notificationVisibility: {
    follows: true,
    mentions: true,
    likes: true,
    repeats: true,
    moves: true,
    emojiReactions: true,
    followRequest: true,
    polls: true
  },
  webPushNotifications: false,
  webPushHideIfCW: true,
  muteWords: [],
  highlight: {},
  interfaceLanguage: browserLocale,
  hideScopeNotice: false,
  useStreamingApi: false,
  sidebarRight: undefined, // instance default
  subjectLineBehavior: undefined, // instance default
  alwaysShowSubjectInput: undefined, // instance default
  postContentType: undefined, // instance default
  // This hides statuses filtered via a word filter
  hideFilteredStatuses: undefined, // instance default
  modalOnRepeat: undefined, // instance default
  modalOnUnfollow: undefined, // instance default
  modalOnBlock: undefined, // instance default
  modalOnMute: undefined, // instance default
  modalOnDelete: undefined, // instance default
  modalOnLogout: undefined, // instance default
  modalOnApproveFollow: undefined, // instance default
  modalOnDenyFollow: undefined, // instance default
  playVideosInModal: false,
  useOneClickNsfw: false,
  useContainFit: true,
  disableStickyHeaders: false,
  showScrollbars: false,
  greentext: undefined, // instance default
  mentionLinkDisplay: undefined, // instance default
  mentionLinkShowTooltip: undefined, // instance default
  mentionLinkShowAvatar: undefined, // instance default
  mentionLinkFadeDomain: undefined, // instance default
  mentionLinkShowYous: undefined, // instance default
  mentionLinkBoldenYou: undefined, // instance default
  hidePostStats: undefined, // instance default
  hideBotIndication: undefined, // instance default
  hideUserStats: undefined, // instance default
  virtualScrolling: undefined, // instance default
  sensitiveByDefault: undefined, // instance default
  sensitiveIfSubject: undefined,
  renderMisskeyMarkdown: undefined,
  renderMfmOnHover: undefined, // instance default
  conversationDisplay: undefined, // instance default
  conversationTreeAdvanced: undefined, // instance default
  conversationOtherRepliesButton: undefined, // instance default
  conversationTreeFadeAncestors: undefined, // instance default
  maxDepthInThread: undefined, // instance default
  translationLanguage: undefined, // instance default,
  postLanguage: undefined, // instance default,
  supportedTranslationLanguages: {}, // instance default
  userProfileDefaultTab: 'statuses',
  useBlurhash: true,
}

// caching the instance default properties
export const instanceDefaultProperties = Object.entries(defaultState)
  .filter(([key, value]) => value === undefined)
  .map(([key, value]) => key)

function updateLocalSettings(store, settingEntries, version = null) {
  if (version == null)
    version = store.state.profileVersion

  settingEntries.forEach(([name, value]) => {
    if (store.state[name] !== value) {
      store.dispatch('setOption', { name, value })
    }
  })

  // Set this at the end to override any potentially stored profileVersion
  store.commit('setOption', { name: 'profileVersion', value: version })
}


const config = {
  state: { ...defaultState },
  getters: {
    defaultConfig (state, getters, rootState, rootGetters) {
      const { instance } = rootState
      return {
        ...defaultState,
        ...Object.fromEntries(
          instanceDefaultProperties.map(key => [key, instance[key]])
        )
      }
    },
    mergedConfig (state, getters, rootState, rootGetters) {
      const { defaultConfig } = rootGetters
      return {
        ...defaultConfig,
        // Do not override with undefined
        ...Object.fromEntries(Object.entries(state).filter(([k, v]) => v !== undefined))
      }
    }
  },
  mutations: {
    setOption (state, { name, value }) {
      state[name] = value
    },
    setHighlight (state, { user, color, type }) {
      const data = this.state.config.highlight[user]
      if (color || type) {
        state.highlight[user] = { color: color || data.color, type: type || data.type }
      } else {
        delete state.highlight[user]
      }
    }
  },
  actions: {
    syncSettings: (store) => {
      store.commit('setOption', { name: 'profileVersion', value: store.state.profileVersion + 1 })
      const notice = {
        level: 'info',
        messageKey: 'settings_profile.synchronizing',
        messageArgs: { profile: store.state.profile },
        timeout: 5000
      }
      store.dispatch('pushGlobalNotice', notice)
      store.rootState.api.backendInteractor.saveSettingsProfile({
        settings: store.state, profileName: store.state.profile, version: store.state.profileVersion
      }).then(() => {
        store.dispatch('removeGlobalNotice', notice)
        store.dispatch('pushGlobalNotice', {
          level: 'success',
          messageKey: 'settings_profile.synchronized',
          messageArgs: { profile: store.state.profile },
          timeout: 2000
        })
        store.dispatch('listSettingsProfiles')
      }).catch((err) => {
        store.dispatch('removeGlobalNotice', notice)
        store.dispatch('pushGlobalNotice', {
          level: 'error',
          messageKey: 'settings_profile.synchronization_error',
          messageArgs: { error: err.message },
          timeout: 5000
        })
        console.error(err)
      })
    },
    deleteSettingsProfile (store, name) {
      store.rootState.api.backendInteractor.deleteSettingsProfile({ profileName: name }).then(() => {
        store.dispatch('listSettingsProfiles')
      })
    },
    loadSettings (store, data) {
      const knownKeys = new Set(Object.keys(defaultState))

      // Limit to supported properties
      const newSettingEntries =
         Object.entries(data)
        .filter(([key, value]) => knownKeys.has(key))

      // disregard stored profileVersion; sync afterwards increases previous version
      updateLocalSettings(store, newSettingEntries, null)
      store.dispatch('syncSettings')
    },
    setHighlight ({ commit, dispatch }, { user, color, type }) {
      commit('setHighlight', { user, color, type })
    },
    setOption ({ commit, dispatch }, { name, value, manual }) {
      commit('setOption', { name, value })
      if (manual === true) {
        dispatch('syncSettings')
      }
      switch (name) {
        case 'theme':
          setPreset(value)
          break
        case 'customTheme':
        case 'customThemeSource':
          applyTheme(value)
          break
        case 'interfaceLanguage':
          messages.setLanguage(this.getters.i18n, value)
          Cookies.set(BACKEND_LANGUAGE_COOKIE_NAME, localeService.internalToBackendLocale(value), {sameSite: 'Lax'})
          dispatch('setInstanceOption', { name: 'interfaceLanguage', value })
          break
        case 'thirdColumnMode':
          dispatch('setLayoutWidth', undefined)
          break
      }
    },
    getSettingsProfile (store, forceUpdate = false) {
      const profile = store.state.profile
      store.rootState.api.backendInteractor.getSettingsProfile({ store, profileName: profile })
        .then(({ settings, version }) => {
          console.log('found settings version', version)
          if (forceUpdate || (version > store.state.profileVersion)) {
            updateLocalSettings(store, Object.entries(settings), version)
          } else {
            console.log('settings are up to date')
          }
        })
        .catch((err) => {
          console.error(`could not fetch profile ${profile}`, err)
          if (err.statusCode === 404) {
            // create profile
            store.dispatch('pushGlobalNotice', {
              level: 'warning',
              messageKey: 'settings_profile.creating',
              messageArgs: { profile },
              timeout: 5000
            })
            store.dispatch('syncSettings')
          }
        })
    }
  }
}

export default config
