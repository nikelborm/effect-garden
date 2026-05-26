import * as Schema from 'effect/Schema'

export const component1 = Schema.Struct({
  key: Schema.String,
  value: Schema.String,
})

export const component2 = Schema.Struct({
  service: Schema.String,
  params: component1,
})

export const component3 = Schema.Struct({
  text: Schema.String,
  navigationEndpoint: Schema.Struct({
    clickTrackingParams: Schema.String,
    watchEndpoint: Schema.Struct({
      videoId: Schema.String,
      playlistId: Schema.String,
      playerParams: Schema.String,
      loggingContext: Schema.Struct({
        vssLoggingContext: Schema.Struct({
          serializedContextData: Schema.String,
        }),
      }),
      watchEndpointMusicSupportedConfigs: Schema.Struct({
        watchEndpointMusicConfig: Schema.Struct({
          musicVideoType: Schema.String,
        }),
      }),
    }),
  }),
})

export const component4 = Schema.Struct({
  text: Schema.String,
})

export const component5 = Schema.Struct({
  musicResponsiveListItemFlexColumnRenderer: Schema.Union(
    Schema.Struct({
      text: Schema.Struct({
        runs: component3,
      }),
      displayPriority: Schema.String,
    }),
    Schema.Struct({
      text: Schema.Struct({}),
      displayPriority: Schema.String,
    }),
    Schema.Struct({
      text: Schema.Struct({
        runs: component4,
        accessibility: Schema.Struct({
          accessibilityData: Schema.Struct({
            label: Schema.String,
          }),
        }),
      }),
      displayPriority: Schema.String,
    }),
  ),
})

export const component6 = Schema.Struct({
  musicResponsiveListItemFixedColumnRenderer: Schema.Struct({
    text: Schema.Struct({
      runs: component4,
      accessibility: Schema.Struct({
        accessibilityData: Schema.Struct({
          label: Schema.String,
        }),
      }),
    }),
    displayPriority: Schema.String,
    size: Schema.String,
  }),
})

export const component7 = Schema.Struct({
  clickTrackingParams: Schema.String,
  addToToastAction: Schema.Struct({
    item: Schema.Struct({
      notificationTextRenderer: Schema.Struct({
        successResponseText: Schema.Struct({
          runs: component4,
        }),
        trackingParams: Schema.String,
      }),
    }),
  }),
})

export const component8 = Schema.Struct({
  menuNavigationItemRenderer: Schema.optional(
    Schema.Union(
      Schema.Struct({
        text: Schema.Struct({
          runs: component4,
        }),
        icon: Schema.Struct({
          iconType: Schema.String,
        }),
        navigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String,
          watchEndpoint: Schema.Struct({
            videoId: Schema.String,
            playlistId: Schema.String,
            params: Schema.String,
            loggingContext: Schema.Struct({
              vssLoggingContext: Schema.Struct({
                serializedContextData: Schema.String,
              }),
            }),
            watchEndpointMusicSupportedConfigs: Schema.Struct({
              watchEndpointMusicConfig: Schema.Struct({
                musicVideoType: Schema.String,
              }),
            }),
          }),
        }),
        trackingParams: Schema.String,
      }),
      Schema.Struct({
        text: Schema.Struct({
          runs: component4,
        }),
        icon: Schema.Struct({
          iconType: Schema.String,
        }),
        navigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String,
          modalEndpoint: Schema.Struct({
            modal: Schema.Struct({
              modalWithTitleAndButtonRenderer: Schema.Struct({
                title: Schema.Struct({
                  runs: component4,
                }),
                content: Schema.Struct({
                  runs: component4,
                }),
                button: Schema.Struct({
                  buttonRenderer: Schema.Struct({
                    style: Schema.String,
                    isDisabled: Schema.Boolean,
                    text: Schema.Struct({
                      runs: component4,
                    }),
                    navigationEndpoint: Schema.Struct({
                      clickTrackingParams: Schema.String,
                      signInEndpoint: Schema.Struct({
                        hack: Schema.Boolean,
                      }),
                    }),
                    trackingParams: Schema.String,
                  }),
                }),
              }),
            }),
          }),
        }),
        trackingParams: Schema.String,
      }),
      Schema.Struct({
        text: Schema.Struct({
          runs: component4,
        }),
        icon: Schema.Struct({
          iconType: Schema.String,
        }),
        navigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String,
          browseEndpoint: Schema.Struct({
            browseId: Schema.String,
            browseEndpointContextSupportedConfigs: Schema.Struct({
              browseEndpointContextMusicConfig: Schema.Struct({
                pageType: Schema.String,
              }),
            }),
          }),
        }),
        trackingParams: Schema.String,
      }),
      Schema.Struct({
        text: Schema.Struct({
          runs: component4,
        }),
        icon: Schema.Struct({
          iconType: Schema.String,
        }),
        navigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String,
          shareEntityEndpoint: Schema.Struct({
            serializedShareEntity: Schema.String,
            sharePanelType: Schema.String,
          }),
        }),
        trackingParams: Schema.String,
      }),
    ),
  ),
  menuServiceItemRenderer: Schema.optional(
    Schema.Struct({
      text: Schema.Struct({
        runs: component4,
      }),
      icon: Schema.Struct({
        iconType: Schema.String,
      }),
      serviceEndpoint: Schema.Struct({
        clickTrackingParams: Schema.String,
        queueAddEndpoint: Schema.Struct({
          queueTarget: Schema.Struct({
            videoId: Schema.String,
            onEmptyQueue: Schema.Struct({
              clickTrackingParams: Schema.String,
              watchEndpoint: Schema.Struct({
                videoId: Schema.String,
              }),
            }),
          }),
          queueInsertPosition: Schema.String,
          commands: component7,
        }),
      }),
      trackingParams: Schema.String,
    }),
  ),
  toggleMenuServiceItemRenderer: Schema.optional(
    Schema.Struct({
      defaultText: Schema.Struct({
        runs: component4,
      }),
      defaultIcon: Schema.Struct({
        iconType: Schema.String,
      }),
      defaultServiceEndpoint: Schema.Struct({
        clickTrackingParams: Schema.String,
        modalEndpoint: Schema.Struct({
          modal: Schema.Struct({
            modalWithTitleAndButtonRenderer: Schema.Struct({
              title: Schema.Struct({
                runs: component4,
              }),
              content: Schema.Struct({
                runs: component4,
              }),
              button: Schema.Struct({
                buttonRenderer: Schema.Struct({
                  style: Schema.String,
                  isDisabled: Schema.Boolean,
                  text: Schema.Struct({
                    runs: component4,
                  }),
                  navigationEndpoint: Schema.Struct({
                    clickTrackingParams: Schema.String,
                    signInEndpoint: Schema.Struct({
                      hack: Schema.Boolean,
                    }),
                  }),
                  trackingParams: Schema.String,
                }),
              }),
            }),
          }),
        }),
      }),
      toggledText: Schema.Struct({
        runs: component4,
      }),
      toggledIcon: Schema.Struct({
        iconType: Schema.String,
      }),
      toggledServiceEndpoint: Schema.Struct({
        clickTrackingParams: Schema.String,
        feedbackEndpoint: Schema.Struct({
          feedbackToken: Schema.String,
        }),
      }),
      trackingParams: Schema.String,
    }),
  ),
  menuServiceItemDownloadRenderer: Schema.optional(
    Schema.Struct({
      serviceEndpoint: Schema.Struct({
        clickTrackingParams: Schema.String,
        offlineVideoEndpoint: Schema.Struct({
          videoId: Schema.String,
          onAddCommand: Schema.Struct({
            clickTrackingParams: Schema.String,
            getDownloadActionCommand: Schema.Struct({
              videoId: Schema.String,
              params: Schema.String,
            }),
          }),
        }),
      }),
      trackingParams: Schema.String,
      badgeIcon: Schema.Struct({
        iconType: Schema.String,
      }),
    }),
  ),
})

export const component9 = Schema.Struct({
  likeButtonRenderer: Schema.Struct({
    target: Schema.Struct({
      videoId: Schema.String,
    }),
    likeStatus: Schema.String,
    trackingParams: Schema.String,
    likesAllowed: Schema.Boolean,
    dislikeNavigationEndpoint: Schema.Struct({
      clickTrackingParams: Schema.String,
      modalEndpoint: Schema.Struct({
        modal: Schema.Struct({
          modalWithTitleAndButtonRenderer: Schema.Struct({
            title: Schema.Struct({
              runs: component4,
            }),
            content: Schema.Struct({
              runs: component4,
            }),
            button: Schema.Struct({
              buttonRenderer: Schema.Struct({
                style: Schema.String,
                isDisabled: Schema.Boolean,
                text: Schema.Struct({
                  runs: component4,
                }),
                navigationEndpoint: Schema.Struct({
                  clickTrackingParams: Schema.String,
                  signInEndpoint: Schema.Struct({
                    hack: Schema.Boolean,
                  }),
                }),
                trackingParams: Schema.String,
              }),
            }),
          }),
        }),
      }),
    }),
    likeCommand: Schema.Struct({
      clickTrackingParams: Schema.String,
      modalEndpoint: Schema.Struct({
        modal: Schema.Struct({
          modalWithTitleAndButtonRenderer: Schema.Struct({
            title: Schema.Struct({
              runs: component4,
            }),
            content: Schema.Struct({
              runs: component4,
            }),
            button: Schema.Struct({
              buttonRenderer: Schema.Struct({
                style: Schema.String,
                isDisabled: Schema.Boolean,
                text: Schema.Struct({
                  runs: component4,
                }),
                navigationEndpoint: Schema.Struct({
                  clickTrackingParams: Schema.String,
                  signInEndpoint: Schema.Struct({
                    hack: Schema.Boolean,
                  }),
                }),
                trackingParams: Schema.String,
              }),
            }),
          }),
        }),
      }),
    }),
  }),
})

export const component10 = Schema.Struct({
  text: Schema.String,
  navigationEndpoint: Schema.Struct({
    clickTrackingParams: Schema.String,
    watchEndpoint: Schema.Struct({
      videoId: Schema.String,
      playlistId: Schema.String,
      loggingContext: Schema.Struct({
        vssLoggingContext: Schema.Struct({
          serializedContextData: Schema.String,
        }),
      }),
      watchEndpointMusicSupportedConfigs: Schema.Struct({
        watchEndpointMusicConfig: Schema.Struct({
          musicVideoType: Schema.String,
        }),
      }),
    }),
  }),
})

export const component11 = Schema.Struct({
  musicResponsiveListItemFlexColumnRenderer: Schema.Union(
    Schema.Struct({
      text: Schema.Struct({
        runs: component10,
      }),
      displayPriority: Schema.String,
    }),
    Schema.Struct({
      text: Schema.Struct({}),
      displayPriority: Schema.String,
    }),
    Schema.Struct({
      text: Schema.Struct({
        runs: component4,
        accessibility: Schema.Struct({
          accessibilityData: Schema.Struct({
            label: Schema.String,
          }),
        }),
      }),
      displayPriority: Schema.String,
    }),
  ),
})

export const component12 = Schema.Struct({
  musicResponsiveListItemRenderer: Schema.Union(
    Schema.Struct({
      trackingParams: Schema.String,
      overlay: Schema.Struct({
        musicItemThumbnailOverlayRenderer: Schema.Struct({
          background: Schema.Struct({
            verticalGradient: Schema.Struct({
              gradientLayerColors: Schema.String,
            }),
          }),
          content: Schema.Struct({
            musicPlayButtonRenderer: Schema.Struct({
              playNavigationEndpoint: Schema.Struct({
                clickTrackingParams: Schema.String,
                watchEndpoint: Schema.Struct({
                  videoId: Schema.String,
                  playlistId: Schema.String,
                  index: Schema.Number,
                  playerParams: Schema.String,
                  playlistSetVideoId: Schema.String,
                  loggingContext: Schema.Struct({
                    vssLoggingContext: Schema.Struct({
                      serializedContextData: Schema.String,
                    }),
                  }),
                  watchEndpointMusicSupportedConfigs: Schema.Struct({
                    watchEndpointMusicConfig: Schema.Struct({
                      musicVideoType: Schema.String,
                    }),
                  }),
                }),
              }),
              trackingParams: Schema.String,
              playIcon: Schema.Struct({
                iconType: Schema.String,
              }),
              pauseIcon: Schema.Struct({
                iconType: Schema.String,
              }),
              iconColor: Schema.Number,
              backgroundColor: Schema.Number,
              activeBackgroundColor: Schema.Number,
              loadingIndicatorColor: Schema.Number,
              playingIcon: Schema.Struct({
                iconType: Schema.String,
              }),
              iconLoadingColor: Schema.Number,
              activeScaleFactor: Schema.Number,
              buttonSize: Schema.String,
              rippleTarget: Schema.String,
              accessibilityPlayData: Schema.Struct({
                accessibilityData: Schema.Struct({
                  label: Schema.String,
                }),
              }),
              accessibilityPauseData: Schema.Struct({
                accessibilityData: Schema.Struct({
                  label: Schema.String,
                }),
              }),
            }),
          }),
          contentPosition: Schema.String,
          displayStyle: Schema.String,
        }),
      }),
      flexColumns: component5,
      fixedColumns: component6,
      menu: Schema.Struct({
        menuRenderer: Schema.Struct({
          items: component8,
          trackingParams: Schema.String,
          topLevelButtons: component9,
          accessibility: Schema.Struct({
            accessibilityData: Schema.Struct({
              label: Schema.String,
            }),
          }),
        }),
      }),
      playlistItemData: Schema.Struct({
        playlistSetVideoId: Schema.String,
        videoId: Schema.String,
      }),
      itemHeight: Schema.String,
      index: Schema.Struct({
        runs: component4,
      }),
      multiSelectCheckbox: Schema.Struct({
        checkboxRenderer: Schema.Struct({
          onSelectionChangeCommand: Schema.Struct({
            clickTrackingParams: Schema.String,
            updateMultiSelectStateCommand: Schema.Struct({
              multiSelectParams: Schema.String,
              multiSelectItem: Schema.String,
            }),
          }),
          checkedState: Schema.String,
          trackingParams: Schema.String,
        }),
      }),
    }),
    Schema.Struct({
      trackingParams: Schema.String,
      overlay: Schema.Struct({
        musicItemThumbnailOverlayRenderer: Schema.Struct({
          background: Schema.Struct({
            verticalGradient: Schema.Struct({
              gradientLayerColors: Schema.String,
            }),
          }),
          content: Schema.Struct({
            musicPlayButtonRenderer: Schema.Struct({
              playNavigationEndpoint: Schema.Struct({
                clickTrackingParams: Schema.String,
                watchEndpoint: Schema.Struct({
                  videoId: Schema.String,
                  playlistId: Schema.String,
                  index: Schema.Number,
                  playerParams: Schema.String,
                  playlistSetVideoId: Schema.String,
                  loggingContext: Schema.Struct({
                    vssLoggingContext: Schema.Struct({
                      serializedContextData: Schema.String,
                    }),
                  }),
                  watchEndpointMusicSupportedConfigs: Schema.Struct({
                    watchEndpointMusicConfig: Schema.Struct({
                      musicVideoType: Schema.String,
                    }),
                  }),
                }),
              }),
              trackingParams: Schema.String,
              playIcon: Schema.Struct({
                iconType: Schema.String,
              }),
              pauseIcon: Schema.Struct({
                iconType: Schema.String,
              }),
              iconColor: Schema.Number,
              backgroundColor: Schema.Number,
              activeBackgroundColor: Schema.Number,
              loadingIndicatorColor: Schema.Number,
              playingIcon: Schema.Struct({
                iconType: Schema.String,
              }),
              iconLoadingColor: Schema.Number,
              activeScaleFactor: Schema.Number,
              buttonSize: Schema.String,
              rippleTarget: Schema.String,
              accessibilityPlayData: Schema.Struct({
                accessibilityData: Schema.Struct({
                  label: Schema.String,
                }),
              }),
              accessibilityPauseData: Schema.Struct({
                accessibilityData: Schema.Struct({
                  label: Schema.String,
                }),
              }),
            }),
          }),
          contentPosition: Schema.String,
          displayStyle: Schema.String,
        }),
      }),
      flexColumns: component11,
      fixedColumns: component6,
      menu: Schema.Struct({
        menuRenderer: Schema.Struct({
          items: component8,
          trackingParams: Schema.String,
          topLevelButtons: component9,
          accessibility: Schema.Struct({
            accessibilityData: Schema.Struct({
              label: Schema.String,
            }),
          }),
        }),
      }),
      playlistItemData: Schema.Struct({
        playlistSetVideoId: Schema.String,
        videoId: Schema.String,
      }),
      itemHeight: Schema.String,
      index: Schema.Struct({
        runs: component4,
      }),
      multiSelectCheckbox: Schema.Struct({
        checkboxRenderer: Schema.Struct({
          onSelectionChangeCommand: Schema.Struct({
            clickTrackingParams: Schema.String,
            updateMultiSelectStateCommand: Schema.Struct({
              multiSelectParams: Schema.String,
              multiSelectItem: Schema.String,
            }),
          }),
          checkedState: Schema.String,
          trackingParams: Schema.String,
        }),
      }),
    }),
  ),
})

export const component13 = Schema.Struct({
  musicShelfRenderer: Schema.Struct({
    contents: component12,
    trackingParams: Schema.String,
    shelfDivider: Schema.Struct({
      musicShelfDividerRenderer: Schema.Struct({
        hidden: Schema.Boolean,
      }),
    }),
    contentsMultiSelectable: Schema.Boolean,
  }),
})

export const component14 = Schema.Struct({
  url: Schema.String,
  width: Schema.Number,
  height: Schema.Number,
})

export const component15 = Schema.Struct({
  menuNavigationItemRenderer: Schema.optional(
    Schema.Union(
      Schema.Struct({
        text: Schema.Struct({
          runs: component4,
        }),
        icon: Schema.Struct({
          iconType: Schema.String,
        }),
        navigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String,
          watchPlaylistEndpoint: Schema.Struct({
            playlistId: Schema.String,
            params: Schema.String,
          }),
        }),
        trackingParams: Schema.String,
      }),
      Schema.Struct({
        text: Schema.Struct({
          runs: component4,
        }),
        icon: Schema.Struct({
          iconType: Schema.String,
        }),
        navigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String,
          modalEndpoint: Schema.Struct({
            modal: Schema.Struct({
              modalWithTitleAndButtonRenderer: Schema.Struct({
                title: Schema.Struct({
                  runs: component4,
                }),
                content: Schema.Struct({
                  runs: component4,
                }),
                button: Schema.Struct({
                  buttonRenderer: Schema.Struct({
                    style: Schema.String,
                    isDisabled: Schema.Boolean,
                    text: Schema.Struct({
                      runs: component4,
                    }),
                    navigationEndpoint: Schema.Struct({
                      clickTrackingParams: Schema.String,
                      signInEndpoint: Schema.Struct({
                        hack: Schema.Boolean,
                      }),
                    }),
                    trackingParams: Schema.String,
                  }),
                }),
              }),
            }),
          }),
        }),
        trackingParams: Schema.String,
      }),
      Schema.Struct({
        text: Schema.Struct({
          runs: component4,
        }),
        icon: Schema.Struct({
          iconType: Schema.String,
        }),
        navigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String,
          browseEndpoint: Schema.Struct({
            browseId: Schema.String,
            browseEndpointContextSupportedConfigs: Schema.Struct({
              browseEndpointContextMusicConfig: Schema.Struct({
                pageType: Schema.String,
              }),
            }),
          }),
        }),
        trackingParams: Schema.String,
      }),
      Schema.Struct({
        text: Schema.Struct({
          runs: component4,
        }),
        icon: Schema.Struct({
          iconType: Schema.String,
        }),
        navigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String,
          shareEntityEndpoint: Schema.Struct({
            serializedShareEntity: Schema.String,
            sharePanelType: Schema.String,
          }),
        }),
        trackingParams: Schema.String,
      }),
    ),
  ),
  menuServiceItemRenderer: Schema.optional(
    Schema.Struct({
      text: Schema.Struct({
        runs: component4,
      }),
      icon: Schema.Struct({
        iconType: Schema.String,
      }),
      serviceEndpoint: Schema.Struct({
        clickTrackingParams: Schema.String,
        queueAddEndpoint: Schema.Struct({
          queueTarget: Schema.Struct({
            playlistId: Schema.String,
            onEmptyQueue: Schema.Struct({
              clickTrackingParams: Schema.String,
              watchEndpoint: Schema.Struct({
                playlistId: Schema.String,
              }),
            }),
          }),
          queueInsertPosition: Schema.String,
          commands: component7,
        }),
      }),
      trackingParams: Schema.String,
    }),
  ),
})

export const component16 = Schema.Struct({
  toggleButtonRenderer: Schema.optional(
    Schema.Struct({
      isToggled: Schema.Boolean,
      isDisabled: Schema.Boolean,
      defaultIcon: Schema.Struct({
        iconType: Schema.String,
      }),
      toggledIcon: Schema.Struct({
        iconType: Schema.String,
      }),
      trackingParams: Schema.String,
      defaultNavigationEndpoint: Schema.Struct({
        clickTrackingParams: Schema.String,
        modalEndpoint: Schema.Struct({
          modal: Schema.Struct({
            modalWithTitleAndButtonRenderer: Schema.Struct({
              title: Schema.Struct({
                runs: component4,
              }),
              content: Schema.Struct({
                runs: component4,
              }),
              button: Schema.Struct({
                buttonRenderer: Schema.Struct({
                  style: Schema.String,
                  isDisabled: Schema.Boolean,
                  text: Schema.Struct({
                    runs: component4,
                  }),
                  navigationEndpoint: Schema.Struct({
                    clickTrackingParams: Schema.String,
                    signInEndpoint: Schema.Struct({
                      hack: Schema.Boolean,
                    }),
                  }),
                  trackingParams: Schema.String,
                }),
              }),
            }),
          }),
        }),
      }),
      accessibilityData: Schema.Struct({
        accessibilityData: Schema.Struct({
          label: Schema.String,
        }),
      }),
      toggledAccessibilityData: Schema.Struct({
        accessibilityData: Schema.Struct({
          label: Schema.String,
        }),
      }),
    }),
  ),
  musicPlayButtonRenderer: Schema.optional(
    Schema.Struct({
      playNavigationEndpoint: Schema.Struct({
        clickTrackingParams: Schema.String,
        watchPlaylistEndpoint: Schema.Struct({
          playlistId: Schema.String,
        }),
      }),
      trackingParams: Schema.String,
      playIcon: Schema.Struct({
        iconType: Schema.String,
      }),
      pauseIcon: Schema.Struct({
        iconType: Schema.String,
      }),
      iconColor: Schema.Number,
      backgroundColor: Schema.Number,
      activeBackgroundColor: Schema.Number,
      loadingIndicatorColor: Schema.Number,
      playingIcon: Schema.Struct({
        iconType: Schema.String,
      }),
      iconLoadingColor: Schema.Number,
      activeScaleFactor: Schema.Number,
      accessibilityPlayData: Schema.Struct({
        accessibilityData: Schema.Struct({
          label: Schema.String,
        }),
      }),
      accessibilityPauseData: Schema.Struct({
        accessibilityData: Schema.Struct({
          label: Schema.String,
        }),
      }),
    }),
  ),
  menuRenderer: Schema.optional(
    Schema.Struct({
      items: component15,
      trackingParams: Schema.String,
      accessibility: Schema.Struct({
        accessibilityData: Schema.Struct({
          label: Schema.String,
        }),
      }),
    }),
  ),
})

export const component17 = Schema.Struct({
  text: Schema.String,
  navigationEndpoint: Schema.Struct({
    clickTrackingParams: Schema.String,
    browseEndpoint: Schema.Struct({
      browseId: Schema.String,
      browseEndpointContextSupportedConfigs: Schema.Struct({
        browseEndpointContextMusicConfig: Schema.Struct({
          pageType: Schema.String,
        }),
      }),
    }),
  }),
})

export const component18 = Schema.Struct({
  musicResponsiveHeaderRenderer: Schema.Struct({
    thumbnail: Schema.Struct({
      musicThumbnailRenderer: Schema.Struct({
        thumbnail: Schema.Struct({
          thumbnails: component14,
        }),
        thumbnailCrop: Schema.String,
        thumbnailScale: Schema.String,
        trackingParams: Schema.String,
      }),
    }),
    buttons: component16,
    title: Schema.Struct({
      runs: component4,
    }),
    subtitle: Schema.Struct({
      runs: component4,
    }),
    trackingParams: Schema.String,
    straplineTextOne: Schema.Struct({
      runs: component17,
    }),
    straplineThumbnail: Schema.Struct({
      musicThumbnailRenderer: Schema.Struct({
        thumbnail: Schema.Struct({
          thumbnails: component14,
        }),
        thumbnailCrop: Schema.String,
        thumbnailScale: Schema.String,
        trackingParams: Schema.String,
      }),
    }),
    secondSubtitle: Schema.Struct({
      runs: component4,
    }),
  }),
})

export const component19 = Schema.Struct({
  tabRenderer: Schema.Struct({
    content: Schema.Struct({
      sectionListRenderer: Schema.Struct({
        contents: component18,
        trackingParams: Schema.String,
      }),
    }),
    trackingParams: Schema.String,
  }),
})

export const Root = Schema.Struct({
  responseContext: Schema.Struct({
    serviceTrackingParams: component2,
    responseId: Schema.String,
  }),
  contents: Schema.Struct({
    twoColumnBrowseResultsRenderer: Schema.Struct({
      secondaryContents: Schema.Struct({
        sectionListRenderer: Schema.Struct({
          contents: component13,
          trackingParams: Schema.String,
        }),
      }),
      tabs: component19,
    }),
  }),
  trackingParams: Schema.String,
  microformat: Schema.Struct({
    microformatDataRenderer: Schema.Struct({
      urlCanonical: Schema.String,
      title: Schema.String,
      description: Schema.String,
      thumbnail: Schema.Struct({
        thumbnails: component14,
      }),
      siteName: Schema.String,
      appName: Schema.String,
      androidPackage: Schema.String,
      iosAppStoreId: Schema.String,
      ogType: Schema.String,
      urlApplinksWeb: Schema.String,
      urlApplinksIos: Schema.String,
      urlApplinksAndroid: Schema.String,
      urlTwitterIos: Schema.String,
      urlTwitterAndroid: Schema.String,
      twitterCardType: Schema.String,
      twitterSiteHandle: Schema.String,
    }),
  }),
  background: Schema.Struct({
    musicThumbnailRenderer: Schema.Struct({
      thumbnail: Schema.Struct({
        thumbnails: component14,
      }),
      thumbnailCrop: Schema.String,
      thumbnailScale: Schema.String,
      trackingParams: Schema.String,
    }),
  }),
})
