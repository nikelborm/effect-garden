import * as Schema from 'effect/Schema'

const Part9 = Schema.Struct({
  vssLoggingContext: Schema.Struct({
    serializedContextData: Schema.String.annotations({
      examples: [
        'GilPTEFLNXV5X21mSmpmMkV3MWtqU19qbVpvMEh2eDczTEhYVF9XV01tUQ%3D%3D',
        'GhFSREFNVk1TWjZCajJ0WDZBZw%3D%3D',
        'GhFSREFNVk1lQmF1WUZ4WGIzaw%3D%3D',
        'GhFSREFNVk1qcTA2dkdaMGZOdw%3D%3D',
        'GhFSREFNVk1GMmJfaGF4bzktZw%3D%3D',
      ],
    }),
  }),
})

const Part11 = Schema.Struct({
  watchEndpointMusicConfig: Schema.Struct({
    musicVideoType: Schema.String.annotations({
      examples: ['MUSIC_VIDEO_TYPE_ATV'],
    }),
  }),
})

const Part14 = Schema.Struct({
  iconType: Schema.String.annotations({
    examples: ['PLAY_ARROW', 'PAUSE', 'VOLUME_UP', 'MIX', 'QUEUE_PLAY_NEXT'],
  }),
})

const Part16 = Schema.Struct({
  accessibilityData: Schema.Struct({
    label: Schema.String.annotations({
      examples: [
        'Play Panic Attack - Hania Rani',
        'Pause Panic Attack - Hania Rani',
        '13 thousand plays',
        '1 minute, 13 seconds',
        'Action menu',
      ],
    }),
  }),
})

const Part20 = Schema.Struct({
  musicItemThumbnailOverlayRenderer: Schema.Struct({
    background: Schema.Struct({
      verticalGradient: Schema.Struct({
        gradientLayerColors: Schema.Array(Schema.String),
      }),
    }),
    content: Schema.Struct({
      musicPlayButtonRenderer: Schema.Struct({
        playNavigationEndpoint: Schema.Struct({
          clickTrackingParams: Schema.String.annotations({
            examples: [
              'CP4CEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
              'COoCEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
              'CNYCEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
              'CMICEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
              'CK4CEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
            ],
          }),
          watchEndpoint: Schema.Struct({
            videoId: Schema.String.annotations({
              examples: [
                'SZ6Bj2tX6Ag',
                'eBauYFxXb3k',
                'jq06vGZ0fNw',
                'F2b_haxo9-g',
                'Oe4QjqkziaI',
              ],
            }),
            playlistId: Schema.String.annotations({
              examples: ['OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ'],
            }),
            index: Schema.JsonNumber.annotations({ examples: [0, 1, 2, 3, 4] }),
            playerParams: Schema.String.annotations({
              examples: [
                'ygYQMTREN0E2REM2NTNGMDY0Mw%3D%3D',
                'ygYQNUI0NzBEQzg0Q0QwNEExOA%3D%3D',
                'ygYQN0RBNTk4QjI3RUY3MURFNQ%3D%3D',
                'ygYQQURFMkUwMTk1REFFMUUwMA%3D%3D',
                'ygYQQTU3MUQzNkQ4MDY4QzBBNg%3D%3D',
              ],
            }),
            playlistSetVideoId: Schema.String.annotations({
              examples: [
                '14D7A6DC653F0643',
                '5B470DC84CD04A18',
                '7DA598B27EF71DE5',
                'ADE2E0195DAE1E00',
                'A571D36D8068C0A6',
              ],
            }),
            loggingContext: Part9,
            watchEndpointMusicSupportedConfigs: Part11,
          }),
        }),
        trackingParams: Schema.String.annotations({
          examples: [
            'CP4CEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
            'COoCEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
            'CNYCEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
            'CMICEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
            'CK4CEMjeAiITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
          ],
        }),
        playIcon: Part14,
        pauseIcon: Part14,
        iconColor: Schema.JsonNumber.annotations({ examples: [4294967295] }),
        backgroundColor: Schema.JsonNumber.annotations({ examples: [0] }),
        activeBackgroundColor: Schema.JsonNumber.annotations({ examples: [0] }),
        loadingIndicatorColor: Schema.JsonNumber.annotations({
          examples: [14745645],
        }),
        playingIcon: Part14,
        iconLoadingColor: Schema.JsonNumber.annotations({ examples: [0] }),
        activeScaleFactor: Schema.JsonNumber.annotations({ examples: [1] }),
        buttonSize: Schema.String.annotations({
          examples: ['MUSIC_PLAY_BUTTON_SIZE_SMALL'],
        }),
        rippleTarget: Schema.String.annotations({
          examples: ['MUSIC_PLAY_BUTTON_RIPPLE_TARGET_SELF'],
        }),
        accessibilityPlayData: Part16,
        accessibilityPauseData: Part16,
      }),
    }),
    contentPosition: Schema.String.annotations({
      examples: ['MUSIC_ITEM_THUMBNAIL_OVERLAY_CONTENT_POSITION_CENTERED'],
    }),
    displayStyle: Schema.String.annotations({
      examples: ['MUSIC_ITEM_THUMBNAIL_OVERLAY_DISPLAY_STYLE_PERSISTENT'],
    }),
  }),
})

const Part30 = Schema.Struct({
  musicResponsiveListItemFlexColumnRenderer: Schema.Struct({
    text: Schema.Struct({}),
    displayPriority: Schema.String.annotations({
      examples: ['MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH'],
    }),
  }),
})

const Part32 = Schema.Array(
  Schema.Struct({
    text: Schema.String.annotations({
      examples: [
        '13K plays',
        '1:13',
        'Start mix',
        'Play next',
        'Song will play next',
      ],
    }),
  }),
)

const Part33 = Schema.Struct({ runs: Part32, accessibility: Part16 })

const Part35 = Schema.Struct({
  musicResponsiveListItemFlexColumnRenderer: Schema.Struct({
    text: Part33,
    displayPriority: Schema.String.annotations({
      examples: ['MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH'],
    }),
  }),
})

const Part39 = Schema.Array(
  Schema.Struct({
    musicResponsiveListItemFixedColumnRenderer: Schema.Struct({
      text: Part33,
      displayPriority: Schema.String.annotations({
        examples: ['MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH'],
      }),
      size: Schema.String.annotations({
        examples: ['MUSIC_RESPONSIVE_LIST_ITEM_FIXED_COLUMN_SIZE_SMALL'],
      }),
    }),
  }),
)

const Part40 = Schema.Struct({ runs: Part32 })

const Part45 = Schema.Struct({
  videoId: Schema.String.annotations({
    examples: [
      'SZ6Bj2tX6Ag',
      'eBauYFxXb3k',
      'jq06vGZ0fNw',
      'F2b_haxo9-g',
      'Oe4QjqkziaI',
    ],
  }),
})

const Part52 = Schema.Array(
  Schema.Struct({
    clickTrackingParams: Schema.String.annotations({
      examples: [
        'CPsCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
        'CPkCEPvvBRgCIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
        'COcCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
        'COUCEPvvBRgCIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
        'CNMCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
      ],
    }),
    addToToastAction: Schema.Struct({
      item: Schema.Struct({
        notificationTextRenderer: Schema.Struct({
          successResponseText: Part40,
          trackingParams: Schema.String.annotations({
            examples: [
              'CPwCEMrHAyITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
              'CPoCEMrHAyITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
              'COgCEMrHAyITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
              'COYCEMrHAyITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
              'CNQCEMrHAyITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
            ],
          }),
        }),
      }),
    }),
  }),
)

const Part64 = Schema.Struct({
  clickTrackingParams: Schema.String.annotations({
    examples: [
      'CPcCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
      'CPQCEMOUBhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
      'CO4CEKVBGAkiEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
      'COMCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
      'COACEMOUBhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
    ],
  }),
  modalEndpoint: Schema.Struct({
    modal: Schema.Struct({
      modalWithTitleAndButtonRenderer: Schema.Struct({
        title: Part40,
        content: Part40,
        button: Schema.Struct({
          buttonRenderer: Schema.Struct({
            style: Schema.String.annotations({ examples: ['STYLE_BLUE_TEXT'] }),
            isDisabled: Schema.Boolean,
            text: Part40,
            navigationEndpoint: Schema.Struct({
              clickTrackingParams: Schema.String.annotations({
                examples: [
                  'CPgCEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CPUCEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CPACEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CO8CEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'COQCEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                ],
              }),
              signInEndpoint: Schema.Struct({ hack: Schema.Boolean }),
            }),
            trackingParams: Schema.String.annotations({
              examples: [
                'CPgCEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CPUCEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CPACEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CO8CEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'COQCEPBbIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
              ],
            }),
          }),
        }),
      }),
    }),
  }),
})

const Part76 = Schema.Struct({
  menuNavigationItemRenderer: Schema.Struct({
    text: Part40,
    icon: Part14,
    navigationEndpoint: Part64,
    trackingParams: Schema.String.annotations({
      examples: [
        'CPQCEMOUBhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'COACEMOUBhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CMwCEMOUBhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CLgCEMOUBhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CKQCEMOUBhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
      ],
    }),
  }),
})

const Part80 = Schema.Struct({
  clickTrackingParams: Schema.String.annotations({
    examples: [
      'CPMCEJD7BRgGIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
      'CPICEK-jChgHIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
      'CN8CEJD7BRgGIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
      'CN4CEK-jChgHIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
      'CMsCEJD7BRgGIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
    ],
  }),
  browseEndpoint: Schema.Struct({
    browseId: Schema.String.annotations({
      examples: [
        'UCkBoNlyN9hWbq6uO_CqGeIg',
        'MPTCSZ6Bj2tX6Ag',
        'MPTCeBauYFxXb3k',
        'MPTCjq06vGZ0fNw',
        'MPTCF2b_haxo9-g',
      ],
    }),
    browseEndpointContextSupportedConfigs: Schema.Struct({
      browseEndpointContextMusicConfig: Schema.Struct({
        pageType: Schema.String.annotations({
          examples: ['MUSIC_PAGE_TYPE_ARTIST', 'MUSIC_PAGE_TYPE_TRACK_CREDITS'],
        }),
      }),
    }),
  }),
})

const Part82 = Schema.Struct({
  menuNavigationItemRenderer: Schema.Struct({
    text: Part40,
    icon: Part14,
    navigationEndpoint: Part80,
    trackingParams: Schema.String.annotations({
      examples: [
        'CPMCEJD7BRgGIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CPICEK-jChgHIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CN8CEJD7BRgGIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CN4CEK-jChgHIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CMsCEJD7BRgGIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
      ],
    }),
  }),
})

const Part86 = Schema.Struct({
  menuNavigationItemRenderer: Schema.Struct({
    text: Part40,
    icon: Part14,
    navigationEndpoint: Schema.Struct({
      clickTrackingParams: Schema.String.annotations({
        examples: [
          'CPECEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
          'CN0CEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
          'CMkCEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
          'CLUCEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
          'CKECEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
        ],
      }),
      shareEntityEndpoint: Schema.Struct({
        serializedShareEntity: Schema.String.annotations({
          examples: [
            'CgtTWjZCajJ0WDZBZw%3D%3D',
            'CgtlQmF1WUZ4WGIzaw%3D%3D',
            'CgtqcTA2dkdaMGZOdw%3D%3D',
            'CgtGMmJfaGF4bzktZw%3D%3D',
            'CgtPZTRRanFremlhSQ%3D%3D',
          ],
        }),
        sharePanelType: Schema.String.annotations({
          examples: ['SHARE_PANEL_TYPE_UNIFIED_SHARE_PANEL'],
        }),
      }),
    }),
    trackingParams: Schema.String.annotations({
      examples: [
        'CPECEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CN0CEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CMkCEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CLUCEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CKECEJH7BRgIIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
      ],
    }),
  }),
})

const Part92 = Schema.Struct({
  menuRenderer: Schema.Struct({
    items: Schema.Array(
      Schema.Union(
        Schema.Struct({
          menuNavigationItemRenderer: Schema.Struct({
            text: Part40,
            icon: Part14,
            navigationEndpoint: Schema.Struct({
              clickTrackingParams: Schema.String.annotations({
                examples: [
                  'CP0CEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'COkCEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CNUCEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CMECEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CK0CEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                ],
              }),
              watchEndpoint: Schema.Struct({
                videoId: Schema.String.annotations({
                  examples: [
                    'SZ6Bj2tX6Ag',
                    'eBauYFxXb3k',
                    'jq06vGZ0fNw',
                    'F2b_haxo9-g',
                    'Oe4QjqkziaI',
                  ],
                }),
                playlistId: Schema.String.annotations({
                  examples: [
                    'RDAMVMSZ6Bj2tX6Ag',
                    'RDAMVMeBauYFxXb3k',
                    'RDAMVMjq06vGZ0fNw',
                    'RDAMVMF2b_haxo9-g',
                    'RDAMVMOe4QjqkziaI',
                  ],
                }),
                params: Schema.String.annotations({ examples: ['wAEB'] }),
                loggingContext: Part9,
                watchEndpointMusicSupportedConfigs: Part11,
              }),
            }),
            trackingParams: Schema.String.annotations({
              examples: [
                'CP0CEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'COkCEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CNUCEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CMECEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CK0CEJvzBRgAIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
              ],
            }),
          }),
        }),
        Schema.Struct({
          menuServiceItemRenderer: Schema.Struct({
            text: Part40,
            icon: Part14,
            serviceEndpoint: Schema.Struct({
              clickTrackingParams: Schema.String.annotations({
                examples: [
                  'CPsCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CPkCEPvvBRgCIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'COcCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'COUCEPvvBRgCIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CNMCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                ],
              }),
              queueAddEndpoint: Schema.Struct({
                queueTarget: Schema.Struct({
                  videoId: Schema.String.annotations({
                    examples: [
                      'SZ6Bj2tX6Ag',
                      'eBauYFxXb3k',
                      'jq06vGZ0fNw',
                      'F2b_haxo9-g',
                      'Oe4QjqkziaI',
                    ],
                  }),
                  onEmptyQueue: Schema.Struct({
                    clickTrackingParams: Schema.String.annotations({
                      examples: [
                        'CPsCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                        'CPkCEPvvBRgCIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                        'COcCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                        'COUCEPvvBRgCIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                        'CNMCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                      ],
                    }),
                    watchEndpoint: Part45,
                  }),
                }),
                queueInsertPosition: Schema.String.annotations({
                  examples: ['INSERT_AFTER_CURRENT_VIDEO', 'INSERT_AT_END'],
                }),
                commands: Part52,
              }),
            }),
            trackingParams: Schema.String.annotations({
              examples: [
                'CPsCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CPkCEPvvBRgCIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'COcCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'COUCEPvvBRgCIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CNMCEL7uBRgBIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
              ],
            }),
          }),
        }),
        Schema.Struct({
          toggleMenuServiceItemRenderer: Schema.Struct({
            defaultText: Part40,
            defaultIcon: Part14,
            defaultServiceEndpoint: Part64,
            toggledText: Part40,
            toggledIcon: Part14,
            toggledServiceEndpoint: Schema.Struct({
              clickTrackingParams: Schema.String.annotations({
                examples: [
                  'CPcCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'COMCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CM8CEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CLsCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CKcCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                ],
              }),
              feedbackEndpoint: Schema.Struct({
                feedbackToken: Schema.String.annotations({
                  examples: [
                    'AB9zfpLMDLdyjsbFkJwoHn2vDFatoAnO44w0_fm_T5qxyoc9VyghhLL2Lz3a5O7ZQ1Tp_Yvnc8puzEAldnNqN1Ui20NvKYZy4Q',
                    'AB9zfpKeGMsioriwLI4muQP-RlNbfr6e6BZGR7Duq1SFxs6lANZCaNNNbRZvw0KZFe-oRFIRQeskB3vispVZWyBIxsXMTNuoBg',
                    'AB9zfpKI8sXzW_aas6gtTwtA8Hbe59GJRc2PYRgoNjTAu_wPU6L638FnUgm0oYntF7N5UkY-TlcGWAo7MYEf3UmP0IwvfkwabA',
                    'AB9zfpJKVg5yXb9jlbiYlndlMAKs8py_4iVsyjOEjevSAn62QPLCs0D83a8ADXoOd95WVWlO2WJI3_uZEviUkQevFONEwc7MnQ',
                    'AB9zfpJQGVcYEyuWWtzwv9w9RNPO0hWl129akbPtbxCS_dj-jdTqSBxUcf6rfHlD0vCUi-8U243Eb6Hu8hdwiz964p3nBbnlnw',
                  ],
                }),
              }),
            }),
            trackingParams: Schema.String.annotations({
              examples: [
                'CPcCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'COMCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CM8CEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CLsCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CKcCEIT_BRgDIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
              ],
            }),
          }),
        }),
        Schema.Struct({
          menuServiceItemDownloadRenderer: Schema.Struct({
            serviceEndpoint: Schema.Struct({
              clickTrackingParams: Schema.String.annotations({
                examples: [
                  'CPYCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'COICENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CM4CENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CLoCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                  'CKYCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                ],
              }),
              offlineVideoEndpoint: Schema.Struct({
                videoId: Schema.String.annotations({
                  examples: [
                    'SZ6Bj2tX6Ag',
                    'eBauYFxXb3k',
                    'jq06vGZ0fNw',
                    'F2b_haxo9-g',
                    'Oe4QjqkziaI',
                  ],
                }),
                onAddCommand: Schema.Struct({
                  clickTrackingParams: Schema.String.annotations({
                    examples: [
                      'CPYCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                      'COICENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                      'CM4CENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                      'CLoCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                      'CKYCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                    ],
                  }),
                  getDownloadActionCommand: Schema.Struct({
                    videoId: Schema.String.annotations({
                      examples: [
                        'SZ6Bj2tX6Ag',
                        'eBauYFxXb3k',
                        'jq06vGZ0fNw',
                        'F2b_haxo9-g',
                        'Oe4QjqkziaI',
                      ],
                    }),
                    params: Schema.String.annotations({ examples: ['CAI%3D'] }),
                  }),
                }),
              }),
            }),
            trackingParams: Schema.String.annotations({
              examples: [
                'CPYCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'COICENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CM4CENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CLoCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                'CKYCENGqBRgEIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
              ],
            }),
            badgeIcon: Part14,
          }),
        }),
        Part76,
        Part82,
        Part86,
      ),
    ),
    trackingParams: Schema.String.annotations({
      examples: [
        'CO0CEKc7IhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CNkCEKc7IhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CMUCEKc7IhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CLECEKc7IhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CJ0CEKc7IhMIkqn-2ojVlAMVWzkGAB2OHwAs',
      ],
    }),
    topLevelButtons: Schema.Array(
      Schema.Struct({
        likeButtonRenderer: Schema.Struct({
          target: Part45,
          likeStatus: Schema.String.annotations({ examples: ['INDIFFERENT'] }),
          trackingParams: Schema.String.annotations({
            examples: [
              'CO4CEKVBGAkiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
              'CNoCEKVBGAkiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
              'CMYCEKVBGAkiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
              'CLICEKVBGAkiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
              'CJ4CEKVBGAkiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
            ],
          }),
          likesAllowed: Schema.Boolean,
          dislikeNavigationEndpoint: Part64,
          likeCommand: Part64,
        }),
      }),
    ),
    accessibility: Part16,
  }),
})

const Part93 = Schema.Struct({
  playlistSetVideoId: Schema.String.annotations({
    examples: [
      '14D7A6DC653F0643',
      '5B470DC84CD04A18',
      '7DA598B27EF71DE5',
      'ADE2E0195DAE1E00',
      'A571D36D8068C0A6',
    ],
  }),
  videoId: Schema.String.annotations({
    examples: [
      'SZ6Bj2tX6Ag',
      'eBauYFxXb3k',
      'jq06vGZ0fNw',
      'F2b_haxo9-g',
      'Oe4QjqkziaI',
    ],
  }),
})

const Part97 = Schema.Struct({
  checkboxRenderer: Schema.Struct({
    onSelectionChangeCommand: Schema.Struct({
      clickTrackingParams: Schema.String.annotations({
        examples: [
          'COwCEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
          'CNgCEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
          'CMQCEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
          'CLACEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
          'CJwCEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALMoBBJCahTU=',
        ],
      }),
      updateMultiSelectStateCommand: Schema.Struct({
        multiSelectParams: Schema.String.annotations({
          examples: [
            'CAMSKU9MQUs1dXlfbWZKamYyRXcxa2pTX2ptWm8wSHZ4NzNMSFhUX1dXTW1R',
          ],
        }),
        multiSelectItem: Schema.String.annotations({
          examples: [
            'Ch8KC1NaNkJqMnRYNkFnEhAxNEQ3QTZEQzY1M0YwNjQz',
            'Ch8KC2VCYXVZRnhYYjNrEhA1QjQ3MERDODRDRDA0QTE4',
            'Ch8KC2pxMDZ2R1owZk53EhA3REE1OThCMjdFRjcxREU1',
            'Ch8KC0YyYl9oYXhvOS1nEhBBREUyRTAxOTVEQUUxRTAw',
            'Ch8KC09lNFFqcWt6aWFJEhBBNTcxRDM2RDgwNjhDMEE2',
          ],
        }),
      }),
    }),
    checkedState: Schema.String.annotations({
      examples: ['CHECKBOX_CHECKED_STATE_UNCHECKED'],
    }),
    trackingParams: Schema.String.annotations({
      examples: [
        'COwCEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
        'CNgCEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
        'CMQCEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
        'CLACEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
        'CJwCEL6-CSITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
      ],
    }),
  }),
})

const Part120 = Schema.Struct({
  thumbnails: Schema.Array(
    Schema.Struct({
      url: Schema.String.annotations({
        examples: [
          'https://yt3.googleusercontent.com/DiIZWv6sbHmLruJ3iasMdsREI-fS1pg64EGWUcgERjvE4B5s5B5PiYmAYSJuFgeUUgGix_vsWTMLI70=w60-h60-l90-rj',
          'https://yt3.googleusercontent.com/DiIZWv6sbHmLruJ3iasMdsREI-fS1pg64EGWUcgERjvE4B5s5B5PiYmAYSJuFgeUUgGix_vsWTMLI70=w120-h120-l90-rj',
          'https://yt3.googleusercontent.com/DiIZWv6sbHmLruJ3iasMdsREI-fS1pg64EGWUcgERjvE4B5s5B5PiYmAYSJuFgeUUgGix_vsWTMLI70=w226-h226-l90-rj',
          'https://yt3.googleusercontent.com/DiIZWv6sbHmLruJ3iasMdsREI-fS1pg64EGWUcgERjvE4B5s5B5PiYmAYSJuFgeUUgGix_vsWTMLI70=w544-h544-l90-rj',
          'https://lh3.googleusercontent.com/9NA8f3tUbSju7zxkVg34dkTDJtE3u3kbBApDPwuptGPKjgioD-NmT4vZUXAjteIzdexC2_YEzn5DLp4=w60-h60-p-l90-rj',
        ],
      }),
      width: Schema.JsonNumber.annotations({ examples: [60, 120, 226, 544] }),
      height: Schema.JsonNumber.annotations({ examples: [60, 120, 226, 544] }),
    }),
  ),
})

const Part122 = Schema.Struct({
  musicThumbnailRenderer: Schema.Struct({
    thumbnail: Part120,
    thumbnailCrop: Schema.String.annotations({
      examples: ['MUSIC_THUMBNAIL_CROP_UNSPECIFIED'],
    }),
    thumbnailScale: Schema.String.annotations({
      examples: ['MUSIC_THUMBNAIL_SCALE_UNSPECIFIED'],
    }),
    trackingParams: Schema.String.annotations({
      examples: [
        'CBQQhL8CIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CAUQhL8CIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
        'CAEQhL8CIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
      ],
    }),
  }),
})

const Part125 = Schema.Struct({
  playlistId: Schema.String.annotations({
    examples: ['OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ'],
  }),
})

export const MainSchema = Schema.Struct({
  responseContext: Schema.Struct({
    serviceTrackingParams: Schema.Array(
      Schema.Struct({
        service: Schema.String.annotations({
          examples: ['GFEEDBACK', 'CSI', 'ECATCHER'],
        }),
        params: Schema.Array(
          Schema.Struct({
            key: Schema.String.annotations({
              examples: [
                'has_unlimited_entitlement',
                'browse_id',
                'browse_id_prefix',
                'logged_in',
                'c',
              ],
            }),
            value: Schema.String.annotations({
              examples: ['False', 'MPREb_EnpK9CwUziI', '', '0', 'WEB_REMIX'],
            }),
          }),
        ),
      }),
    ),
    responseId: Schema.String.annotations({
      examples: ['IhMIkqn-2ojVlAMVWzkGAB2OHwAs'],
    }),
  }),
  contents: Schema.Struct({
    twoColumnBrowseResultsRenderer: Schema.Struct({
      secondaryContents: Schema.Struct({
        sectionListRenderer: Schema.Struct({
          contents: Schema.Array(
            Schema.Struct({
              musicShelfRenderer: Schema.Struct({
                contents: Schema.Array(
                  Schema.Union(
                    Schema.Struct({
                      musicResponsiveListItemRenderer: Schema.Struct({
                        trackingParams: Schema.String.annotations({
                          examples: [
                            'COsCEMn0AhgAIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                            'CIcCEMn0AhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                            'CGcQyfQCGA0iEwiSqf7aiNWUAxVbOQYAHY4fACw=',
                          ],
                        }),
                        overlay: Part20,
                        flexColumns: Schema.Array(
                          Schema.Union(
                            Schema.Struct({
                              musicResponsiveListItemFlexColumnRenderer:
                                Schema.Struct({
                                  text: Schema.Struct({
                                    runs: Schema.Array(
                                      Schema.Struct({
                                        text: Schema.String.annotations({
                                          examples: [
                                            'Panic Attack',
                                            'First Morning',
                                            'June Remembers',
                                          ],
                                        }),
                                        navigationEndpoint: Schema.Struct({
                                          clickTrackingParams:
                                            Schema.String.annotations({
                                              examples: [
                                                'COsCEMn0AhgAIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                                                'CIcCEMn0AhgFIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                                                'CGcQyfQCGA0iEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
                                              ],
                                            }),
                                          watchEndpoint: Schema.Struct({
                                            videoId: Schema.String.annotations({
                                              examples: [
                                                'SZ6Bj2tX6Ag',
                                                'uztr1Nv17us',
                                                'octa65bsLg0',
                                              ],
                                            }),
                                            playlistId:
                                              Schema.String.annotations({
                                                examples: [
                                                  'OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                                ],
                                              }),
                                            playerParams:
                                              Schema.String.annotations({
                                                examples: ['0gcJCdsB0OBS9m0t'],
                                              }),
                                            loggingContext: Part9,
                                            watchEndpointMusicSupportedConfigs:
                                              Part11,
                                          }),
                                        }),
                                      }),
                                    ),
                                  }),
                                  displayPriority: Schema.String.annotations({
                                    examples: [
                                      'MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH',
                                    ],
                                  }),
                                }),
                            }),
                            Part30,
                            Part35,
                          ),
                        ),
                        fixedColumns: Part39,
                        menu: Part92,
                        playlistItemData: Part93,
                        itemHeight: Schema.String.annotations({
                          examples: [
                            'MUSIC_RESPONSIVE_LIST_ITEM_HEIGHT_MEDIUM',
                          ],
                        }),
                        index: Part40,
                        multiSelectCheckbox: Part97,
                      }),
                    }),
                    Schema.Struct({
                      musicResponsiveListItemRenderer: Schema.Struct({
                        trackingParams: Schema.String.annotations({
                          examples: [
                            'CNcCEMn0AhgBIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                            'CMMCEMn0AhgCIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                            'CK8CEMn0AhgDIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                            'CJsCEMn0AhgEIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                            'CPMBEMn0AhgGIhMIkqn-2ojVlAMVWzkGAB2OHwAs',
                          ],
                        }),
                        overlay: Part20,
                        flexColumns: Schema.Array(
                          Schema.Union(
                            Schema.Struct({
                              musicResponsiveListItemFlexColumnRenderer:
                                Schema.Struct({
                                  text: Schema.Struct({
                                    runs: Schema.Array(
                                      Schema.Struct({
                                        text: Schema.String.annotations({
                                          examples: [
                                            'Fire At The House',
                                            'Letter to Roberta',
                                            'Run',
                                            'Hospital to Thornfield',
                                            'Again',
                                          ],
                                        }),
                                        navigationEndpoint: Schema.Struct({
                                          clickTrackingParams:
                                            Schema.String.annotations({
                                              examples: [
                                                'CNcCEMn0AhgBIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                                                'CMMCEMn0AhgCIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                                                'CK8CEMn0AhgDIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                                                'CJsCEMn0AhgEIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                                                'CPMBEMn0AhgGIhMIkqn-2ojVlAMVWzkGAB2OHwAsygEEkJqFNQ==',
                                              ],
                                            }),
                                          watchEndpoint: Schema.Struct({
                                            videoId: Schema.String.annotations({
                                              examples: [
                                                'eBauYFxXb3k',
                                                'jq06vGZ0fNw',
                                                'F2b_haxo9-g',
                                                'Oe4QjqkziaI',
                                                'czAhvbGOAp0',
                                              ],
                                            }),
                                            playlistId:
                                              Schema.String.annotations({
                                                examples: [
                                                  'OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                                ],
                                              }),
                                            loggingContext: Part9,
                                            watchEndpointMusicSupportedConfigs:
                                              Part11,
                                          }),
                                        }),
                                      }),
                                    ),
                                  }),
                                  displayPriority: Schema.String.annotations({
                                    examples: [
                                      'MUSIC_RESPONSIVE_LIST_ITEM_COLUMN_DISPLAY_PRIORITY_HIGH',
                                    ],
                                  }),
                                }),
                            }),
                            Part30,
                            Part35,
                          ),
                        ),
                        fixedColumns: Part39,
                        menu: Part92,
                        playlistItemData: Part93,
                        itemHeight: Schema.String.annotations({
                          examples: [
                            'MUSIC_RESPONSIVE_LIST_ITEM_HEIGHT_MEDIUM',
                          ],
                        }),
                        index: Part40,
                        multiSelectCheckbox: Part97,
                      }),
                    }),
                  ),
                ),
                trackingParams: Schema.String.annotations({
                  examples: ['CBYQ-V4YACITCJKp_tqI1ZQDFVs5BgAdjh8ALA=='],
                }),
                shelfDivider: Schema.Struct({
                  musicShelfDividerRenderer: Schema.Struct({
                    hidden: Schema.Boolean,
                  }),
                }),
                contentsMultiSelectable: Schema.Boolean,
              }),
            }),
          ),
          trackingParams: Schema.String.annotations({
            examples: ['CBUQui8iEwiSqf7aiNWUAxVbOQYAHY4fACw='],
          }),
        }),
      }),
      tabs: Schema.Array(
        Schema.Struct({
          tabRenderer: Schema.Struct({
            content: Schema.Struct({
              sectionListRenderer: Schema.Struct({
                contents: Schema.Array(
                  Schema.Struct({
                    musicResponsiveHeaderRenderer: Schema.Struct({
                      thumbnail: Part122,
                      buttons: Schema.Array(
                        Schema.Union(
                          Schema.Struct({
                            toggleButtonRenderer: Schema.Struct({
                              isToggled: Schema.Boolean,
                              isDisabled: Schema.Boolean,
                              defaultIcon: Part14,
                              toggledIcon: Part14,
                              trackingParams: Schema.String.annotations({
                                examples: [
                                  'CBIQmE0YACITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
                                ],
                              }),
                              defaultNavigationEndpoint: Part64,
                              accessibilityData: Part16,
                              toggledAccessibilityData: Part16,
                            }),
                          }),
                          Schema.Struct({
                            musicPlayButtonRenderer: Schema.Struct({
                              playNavigationEndpoint: Schema.Struct({
                                clickTrackingParams: Schema.String.annotations({
                                  examples: [
                                    'CBEQyN4CGAEiEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
                                  ],
                                }),
                                watchPlaylistEndpoint: Part125,
                              }),
                              trackingParams: Schema.String.annotations({
                                examples: [
                                  'CBEQyN4CGAEiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
                                ],
                              }),
                              playIcon: Part14,
                              pauseIcon: Part14,
                              iconColor: Schema.JsonNumber.annotations({
                                examples: [4278387459],
                              }),
                              backgroundColor: Schema.JsonNumber.annotations({
                                examples: [0],
                              }),
                              activeBackgroundColor:
                                Schema.JsonNumber.annotations({
                                  examples: [0],
                                }),
                              loadingIndicatorColor:
                                Schema.JsonNumber.annotations({
                                  examples: [14745645],
                                }),
                              playingIcon: Part14,
                              iconLoadingColor: Schema.JsonNumber.annotations({
                                examples: [0],
                              }),
                              activeScaleFactor: Schema.JsonNumber.annotations({
                                examples: [1],
                              }),
                              accessibilityPlayData: Part16,
                              accessibilityPauseData: Part16,
                            }),
                          }),
                          Schema.Struct({
                            menuRenderer: Schema.Struct({
                              items: Schema.Array(
                                Schema.Union(
                                  Schema.Struct({
                                    menuNavigationItemRenderer: Schema.Struct({
                                      text: Part40,
                                      icon: Part14,
                                      navigationEndpoint: Schema.Struct({
                                        clickTrackingParams:
                                          Schema.String.annotations({
                                            examples: [
                                              'CBAQmvMFGAAiEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
                                              'CA8Qm_MFGAEiEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
                                            ],
                                          }),
                                        watchPlaylistEndpoint: Schema.Struct({
                                          playlistId: Schema.String.annotations(
                                            {
                                              examples: [
                                                'OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                                'RDAMPLOLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                              ],
                                            },
                                          ),
                                          params: Schema.String.annotations({
                                            examples: [
                                              'wAEB8gECKAE%3D',
                                              'wAEB',
                                            ],
                                          }),
                                        }),
                                      }),
                                      trackingParams: Schema.String.annotations(
                                        {
                                          examples: [
                                            'CBAQmvMFGAAiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
                                            'CA8Qm_MFGAEiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
                                          ],
                                        },
                                      ),
                                    }),
                                  }),
                                  Schema.Struct({
                                    menuServiceItemRenderer: Schema.Struct({
                                      text: Part40,
                                      icon: Part14,
                                      serviceEndpoint: Schema.Struct({
                                        clickTrackingParams:
                                          Schema.String.annotations({
                                            examples: [
                                              'CA0Qvu4FGAIiEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
                                              'CAsQ--8FGAMiEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
                                            ],
                                          }),
                                        queueAddEndpoint: Schema.Struct({
                                          queueTarget: Schema.Struct({
                                            playlistId:
                                              Schema.String.annotations({
                                                examples: [
                                                  'OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                                ],
                                              }),
                                            onEmptyQueue: Schema.Struct({
                                              clickTrackingParams:
                                                Schema.String.annotations({
                                                  examples: [
                                                    'CA0Qvu4FGAIiEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
                                                    'CAsQ--8FGAMiEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1',
                                                  ],
                                                }),
                                              watchEndpoint: Part125,
                                            }),
                                          }),
                                          queueInsertPosition:
                                            Schema.String.annotations({
                                              examples: [
                                                'INSERT_AFTER_CURRENT_VIDEO',
                                                'INSERT_AT_END',
                                              ],
                                            }),
                                          commands: Part52,
                                        }),
                                      }),
                                      trackingParams: Schema.String.annotations(
                                        {
                                          examples: [
                                            'CA0Qvu4FGAIiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
                                            'CAsQ--8FGAMiEwiSqf7aiNWUAxVbOQYAHY4fACw=',
                                          ],
                                        },
                                      ),
                                    }),
                                  }),
                                  Part76,
                                  Part82,
                                  Part86,
                                ),
                              ),
                              trackingParams: Schema.String.annotations({
                                examples: [
                                  'CAYQpzsYAiITCJKp_tqI1ZQDFVs5BgAdjh8ALA==',
                                ],
                              }),
                              accessibility: Part16,
                            }),
                          }),
                        ),
                      ),
                      title: Part40,
                      subtitle: Part40,
                      trackingParams: Schema.String.annotations({
                        examples: ['CAQQneEIGAAiEwiSqf7aiNWUAxVbOQYAHY4fACw='],
                      }),
                      straplineTextOne: Schema.Struct({
                        runs: Schema.Array(
                          Schema.Struct({
                            text: Schema.String.annotations({
                              examples: ['Hania Rani'],
                            }),
                            navigationEndpoint: Part80,
                          }),
                        ),
                      }),
                      straplineThumbnail: Part122,
                      secondSubtitle: Part40,
                    }),
                  }),
                ),
                trackingParams: Schema.String.annotations({
                  examples: ['CAMQui8iEwiSqf7aiNWUAxVbOQYAHY4fACw='],
                }),
              }),
            }),
            trackingParams: Schema.String.annotations({
              examples: ['CAIQ8JMBGAEiEwiSqf7aiNWUAxVbOQYAHY4fACw='],
            }),
          }),
        }),
      ),
    }),
  }),
  trackingParams: Schema.String.annotations({
    examples: ['CAAQhGciEwiSqf7aiNWUAxVbOQYAHY4fACzKAQSQmoU1'],
  }),
  microformat: Schema.Struct({
    microformatDataRenderer: Schema.Struct({
      urlCanonical: Schema.String.annotations({
        examples: [
          'https://music.youtube.com/playlist?list=OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
        ],
      }),
      title: Schema.String.annotations({
        examples: [
          'The Lost Flowers of Alice Hart (Prime Video Original Series Soundtrack) - Album by Hania Rani',
        ],
      }),
      description: Schema.String.annotations({
        examples: [
          'Listen to The Lost Flowers of Alice Hart (Prime Video Original Series Soundtrack) by Hania Rani on YouTube Music - a dedicated music app with official songs, music videos, remixes, covers, and more.',
        ],
      }),
      thumbnail: Part120,
      siteName: Schema.String.annotations({ examples: ['YouTube Music'] }),
      appName: Schema.String.annotations({ examples: ['YouTube Music'] }),
      androidPackage: Schema.String.annotations({
        examples: ['com.google.android.apps.youtube.music'],
      }),
      iosAppStoreId: Schema.String.annotations({ examples: ['1017492454'] }),
      ogType: Schema.String.annotations({ examples: ['music.album'] }),
      urlApplinksWeb: Schema.String.annotations({
        examples: [
          'https://music.youtube.com/playlist?list=OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ&feature=applinks',
        ],
      }),
      urlApplinksIos: Schema.String.annotations({
        examples: [
          'vnd.youtube.music://music.youtube.com/playlist?list=OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ&feature=applinks',
        ],
      }),
      urlApplinksAndroid: Schema.String.annotations({
        examples: [
          'vnd.youtube.music://music.youtube.com/playlist?list=OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ&feature=applinks',
        ],
      }),
      urlTwitterIos: Schema.String.annotations({
        examples: [
          'vnd.youtube.music://music.youtube.com/playlist?list=OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ&feature=twitter-deep-link',
        ],
      }),
      urlTwitterAndroid: Schema.String.annotations({
        examples: [
          'vnd.youtube.music://music.youtube.com/playlist?list=OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ&feature=twitter-deep-link',
        ],
      }),
      twitterCardType: Schema.String.annotations({ examples: ['summary'] }),
      twitterSiteHandle: Schema.String.annotations({
        examples: ['@youtubemusic'],
      }),
    }),
  }),
  background: Part122,
})
