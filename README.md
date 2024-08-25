# Akkoma-FE

![English OK](https://img.shields.io/badge/English-OK-blueviolet) ![日本語OK](https://img.shields.io/badge/%E6%97%A5%E6%9C%AC%E8%AA%9E-OK-blueviolet)

This is a fork of Akkoma-FE from the Pleroma project, with support for new Akkoma features such as:
- MFM support via [marked-mfm](https://akkoma.dev/sfr/marked-mfm)
- Custom emoji reactions

# For Translators

The [Weblate UI](https://translate.akkoma.dev/projects/akkoma/pleroma-fe/) is recommended for adding or modifying translations for Akkoma-FE.

Alternatively, edit/create `src/i18n/$LANGUAGE_CODE.json` (where `$LANGUAGE_CODE` is the [ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) for your language), then add your language to [src/i18n/messages.js](https://akkoma.dev/AkkomaGang/pleroma-fe/src/branch/develop/src/i18n/messages.js) if it doesn't already exist there.

Akkoma-FE will set your language by your browser locale, but you can temporarily force it in the code by changing the locale in main.js.

# FOR ADMINS

To use Akkoma-FE in Akkoma, use the [frontend](https://docs.akkoma.dev/stable/administration/CLI_tasks/frontend/) CLI task to install Akkoma-FE, then modify your configuration as described in the [Frontend Management](https://docs.akkoma.dev/stable/configuration/frontend_management/) doc.

## Build Setup

Make sure you have [Node.js](https://nodejs.org/) installed. You can check `/.woodpecker.yml` for which node version the Akkoma CI currently uses.

``` bash
# install dependencies
corepack enable
yarn

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# run unit tests
npm run unit
```

# For Contributors:

You can create file `/config/local.json` (see [example](https://akkoma.dev/AkkomaGang/akkoma-fe/src/branch/develop/config/local.example.json)) to enable some convenience dev options:

* `target`: makes local dev server redirect to some existing instance's BE instead of local BE, useful for testing things in near-production environment and searching for real-life use-cases.
* `staticConfigPreference`: makes FE's `/static/config.json` take preference of BE-served `/api/statusnet/config.json`. Only works in dev mode.

FE Build process also leaves current commit hash in global variable `___pleromafe_commit_hash` so that you can easily see which pleroma-fe commit instance is running, also helps pinpointing which commit was used when FE was bundled into BE.

# Configuration

Edit config.json for configuration.

## Options

### Login methods

```loginMethod``` can be set to either ```password``` (the default) or ```token```, which will use the full oauth redirection flow, which is useful for SSO situations.
