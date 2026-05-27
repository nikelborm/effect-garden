import * as Schema from 'effect/Schema'

const Part2 = Schema.Struct({
  watchEndpointMusicConfig: Schema.Struct({
    musicVideoType: Schema.String.annotations({
      examples: ['MUSIC_VIDEO_TYPE_ATV'],
    }),
  }),
})

const Part16 = Schema.Struct({})

const Part21 = Schema.Struct({
  runs: Schema.Array(
    Schema.Struct({
      text: Schema.String.annotations({
        examples: [
          '13K plays',
          '1:13',
          'Start mix',
          'Play next',
          'Add to queue',
          'Save to playlist',
          'Save this for later',
          'Make playlists and share them after signing in',
          'Sign in',
          'Go to artist',
          'View song credits',
          'Share',
          '1',
          '8.3K plays',
          '2:31',
          '2',
          '6K plays',
          '0:40',
          '3',
          '17K plays',
          '3:52',
          '4',
          '20K plays',
          '3:31',
          '5',
          '6.2K plays',
          '1:01',
          '6',
          '5K plays',
          '1:55',
          '7',
          '4.8K plays',
          '1:45',
          '8',
          '6.5K plays',
          '3:43',
          '9',
          '19K plays',
          '3:39',
          '10',
          '5.2K plays',
          '1:51',
          '11',
          '6.3K plays',
          '2:01',
          '12',
          '4.4K plays',
          '1:38',
          '13',
          '4.1K plays',
          '2:03',
          '14',
          '9.1K plays',
          '15',
          '4.2K plays',
          '0:53',
          '16',
          '4K plays',
          '2:00',
          '17',
          '16K plays',
          '3:04',
          '18',
          'Shuffle play',
          'The Lost Flowers of Alice Hart (Prime Video Original Series Soundtrack)',
          'Album',
          ' • ',
          '2023',
          '18 songs',
          '40 minutes',
        ],
      }),
    }),
  ),
})

const Part22 = Schema.Struct({ text: Part21 })

const Part34 = Schema.Array(Part16)

const Part45 = Schema.Struct({ text: Part21, navigationEndpoint: Part16 })

const Part52 = Schema.Struct({
  menuNavigationItemRenderer: Schema.Struct({
    text: Part21,
    navigationEndpoint: Schema.Struct({
      modalEndpoint: Schema.Struct({
        modal: Schema.Struct({
          modalWithTitleAndButtonRenderer: Schema.Struct({
            title: Part21,
            content: Part21,
            button: Schema.Struct({ buttonRenderer: Part45 }),
          }),
        }),
      }),
    }),
  }),
})

const Part56 = Schema.Struct({
  browseEndpoint: Schema.Struct({
    browseId: Schema.String.annotations({
      examples: [
        'UCkBoNlyN9hWbq6uO_CqGeIg',
        'MPTCSZ6Bj2tX6Ag',
        'MPTCeBauYFxXb3k',
        'MPTCjq06vGZ0fNw',
        'MPTCF2b_haxo9-g',
        'MPTCOe4QjqkziaI',
        'MPTCuztr1Nv17us',
        'MPTCczAhvbGOAp0',
        'MPTCQnS2zbYOpsI',
        'MPTCzf6ePjpBjGE',
        'MPTCu-udXcdNeu8',
        'MPTCQXWNCqCHZ1s',
        'MPTCk9gTFWJfBPs',
        'MPTCFcVT19XAVZk',
        'MPTCocta65bsLg0',
        'MPTCqi5gZSnrh1M',
        'MPTCcz8jHtz3QMM',
        'MPTC4N81orCJ-KM',
        'MPTCsohD_VX7KDk',
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

const Part58 = Schema.Struct({
  menuNavigationItemRenderer: Schema.Struct({
    text: Part21,
    navigationEndpoint: Part56,
  }),
})

const Part59 = Schema.Struct({ menuNavigationItemRenderer: Part45 })

const Part74 = Schema.Struct({
  thumbnails: Schema.Array(
    Schema.Struct({
      url: Schema.String.annotations({
        examples: [
          'https://yt3.googleusercontent.com/DiIZWv6sbHmLruJ3iasMdsREI-fS1pg64EGWUcgERjvE4B5s5B5PiYmAYSJuFgeUUgGix_vsWTMLI70=w60-h60-l90-rj',
          'https://yt3.googleusercontent.com/DiIZWv6sbHmLruJ3iasMdsREI-fS1pg64EGWUcgERjvE4B5s5B5PiYmAYSJuFgeUUgGix_vsWTMLI70=w120-h120-l90-rj',
          'https://yt3.googleusercontent.com/DiIZWv6sbHmLruJ3iasMdsREI-fS1pg64EGWUcgERjvE4B5s5B5PiYmAYSJuFgeUUgGix_vsWTMLI70=w226-h226-l90-rj',
          'https://yt3.googleusercontent.com/DiIZWv6sbHmLruJ3iasMdsREI-fS1pg64EGWUcgERjvE4B5s5B5PiYmAYSJuFgeUUgGix_vsWTMLI70=w544-h544-l90-rj',
          'https://lh3.googleusercontent.com/9NA8f3tUbSju7zxkVg34dkTDJtE3u3kbBApDPwuptGPKjgioD-NmT4vZUXAjteIzdexC2_YEzn5DLp4=w60-h60-p-l90-rj',
          'https://lh3.googleusercontent.com/9NA8f3tUbSju7zxkVg34dkTDJtE3u3kbBApDPwuptGPKjgioD-NmT4vZUXAjteIzdexC2_YEzn5DLp4=w120-h120-p-l90-rj',
          'https://lh3.googleusercontent.com/9NA8f3tUbSju7zxkVg34dkTDJtE3u3kbBApDPwuptGPKjgioD-NmT4vZUXAjteIzdexC2_YEzn5DLp4=w226-h226-p-l90-rj',
          'https://lh3.googleusercontent.com/9NA8f3tUbSju7zxkVg34dkTDJtE3u3kbBApDPwuptGPKjgioD-NmT4vZUXAjteIzdexC2_YEzn5DLp4=w544-h544-p-l90-rj',
        ],
      }),
      width: Schema.JsonNumber.annotations({ examples: [60, 120, 226, 544] }),
      height: Schema.JsonNumber.annotations({ examples: [60, 120, 226, 544] }),
    }),
  ),
})

const Part76 = Schema.Struct({
  musicThumbnailRenderer: Schema.Struct({
    thumbnail: Part74,
    thumbnailCrop: Schema.String.annotations({
      examples: ['MUSIC_THUMBNAIL_CROP_UNSPECIFIED'],
    }),
    thumbnailScale: Schema.String.annotations({
      examples: ['MUSIC_THUMBNAIL_SCALE_UNSPECIFIED'],
    }),
  }),
})

const Part77 = Schema.Struct({
  playlistId: Schema.String.annotations({
    examples: ['OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ'],
  }),
})

export const MainSchema = Schema.Struct({
  responseContext: Schema.Struct({
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
                  Schema.Struct({
                    musicResponsiveListItemRenderer: Schema.Struct({
                      overlay: Schema.Struct({
                        musicItemThumbnailOverlayRenderer: Schema.Struct({
                          content: Schema.Struct({
                            musicPlayButtonRenderer: Schema.Struct({
                              playNavigationEndpoint: Schema.Struct({
                                watchEndpoint: Schema.Struct({
                                  videoId: Schema.String.annotations({
                                    examples: [
                                      'SZ6Bj2tX6Ag',
                                      'eBauYFxXb3k',
                                      'jq06vGZ0fNw',
                                      'F2b_haxo9-g',
                                      'Oe4QjqkziaI',
                                      'uztr1Nv17us',
                                      'czAhvbGOAp0',
                                      'QnS2zbYOpsI',
                                      'zf6ePjpBjGE',
                                      'u-udXcdNeu8',
                                      'QXWNCqCHZ1s',
                                      'k9gTFWJfBPs',
                                      'FcVT19XAVZk',
                                      'octa65bsLg0',
                                      'qi5gZSnrh1M',
                                      'cz8jHtz3QMM',
                                      '4N81orCJ-KM',
                                      'sohD_VX7KDk',
                                    ],
                                  }),
                                  playlistId: Schema.String.annotations({
                                    examples: [
                                      'OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                    ],
                                  }),
                                  index: Schema.JsonNumber.annotations({
                                    examples: [
                                      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                                      13, 14, 15, 16, 17,
                                    ],
                                  }),
                                  playlistSetVideoId: Schema.String.annotations(
                                    {
                                      examples: [
                                        '14D7A6DC653F0643',
                                        '5B470DC84CD04A18',
                                        '7DA598B27EF71DE5',
                                        'ADE2E0195DAE1E00',
                                        'A571D36D8068C0A6',
                                        'F694E71988D5F57B',
                                        '6A7FD4A26E31C003',
                                        '75E4B7A1AE4DB867',
                                        'BF72EF441115BDF7',
                                        '80A426D95B37539C',
                                        'D283893EA1587D2C',
                                        'FDD8B5021E05CDF0',
                                        '6B1567C1A9D13C34',
                                        '5241F3FF151795ED',
                                        '222C525FF65C10C3',
                                        'B881DE2E2A6CF64E',
                                        '848AA2B35E1999DB',
                                        'C8BF589C2569A838',
                                      ],
                                    },
                                  ),
                                  watchEndpointMusicSupportedConfigs: Part2,
                                }),
                              }),
                            }),
                          }),
                        }),
                      }),
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
                                          'Fire At The House',
                                          'Letter to Roberta',
                                          'Run',
                                          'Hospital to Thornfield',
                                          'First Morning',
                                          'Again',
                                          'Young Clem',
                                          'Take Me Back',
                                          'June',
                                          'Bees',
                                          'Oggi Memory',
                                          'Collapse',
                                          'June Remembers',
                                          'Alice',
                                          'I See You',
                                          'Burn',
                                          'Lost Flowers Book',
                                        ],
                                      }),
                                      navigationEndpoint: Schema.Struct({
                                        watchEndpoint: Schema.Struct({
                                          videoId: Schema.String.annotations({
                                            examples: [
                                              'SZ6Bj2tX6Ag',
                                              'eBauYFxXb3k',
                                              'jq06vGZ0fNw',
                                              'F2b_haxo9-g',
                                              'Oe4QjqkziaI',
                                              'uztr1Nv17us',
                                              'czAhvbGOAp0',
                                              'QnS2zbYOpsI',
                                              'zf6ePjpBjGE',
                                              'u-udXcdNeu8',
                                              'QXWNCqCHZ1s',
                                              'k9gTFWJfBPs',
                                              'FcVT19XAVZk',
                                              'octa65bsLg0',
                                              'qi5gZSnrh1M',
                                              'cz8jHtz3QMM',
                                              '4N81orCJ-KM',
                                              'sohD_VX7KDk',
                                            ],
                                          }),
                                          playlistId: Schema.String.annotations(
                                            {
                                              examples: [
                                                'OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                              ],
                                            },
                                          ),
                                          watchEndpointMusicSupportedConfigs:
                                            Part2,
                                        }),
                                      }),
                                    }),
                                  ),
                                }),
                              }),
                          }),
                          Schema.Struct({
                            musicResponsiveListItemFlexColumnRenderer:
                              Schema.Struct({ text: Part16 }),
                          }),
                          Schema.Struct({
                            musicResponsiveListItemFlexColumnRenderer: Part22,
                          }),
                        ),
                      ),
                      fixedColumns: Schema.Array(
                        Schema.Struct({
                          musicResponsiveListItemFixedColumnRenderer: Part22,
                        }),
                      ),
                      menu: Schema.Struct({
                        menuRenderer: Schema.Struct({
                          items: Schema.Array(
                            Schema.Union(
                              Schema.Struct({
                                menuNavigationItemRenderer: Schema.Struct({
                                  text: Part21,
                                  navigationEndpoint: Schema.Struct({
                                    watchEndpoint: Schema.Struct({
                                      videoId: Schema.String.annotations({
                                        examples: [
                                          'SZ6Bj2tX6Ag',
                                          'eBauYFxXb3k',
                                          'jq06vGZ0fNw',
                                          'F2b_haxo9-g',
                                          'Oe4QjqkziaI',
                                          'uztr1Nv17us',
                                          'czAhvbGOAp0',
                                          'QnS2zbYOpsI',
                                          'zf6ePjpBjGE',
                                          'u-udXcdNeu8',
                                          'QXWNCqCHZ1s',
                                          'k9gTFWJfBPs',
                                          'FcVT19XAVZk',
                                          'octa65bsLg0',
                                          'qi5gZSnrh1M',
                                          'cz8jHtz3QMM',
                                          '4N81orCJ-KM',
                                          'sohD_VX7KDk',
                                        ],
                                      }),
                                      playlistId: Schema.String.annotations({
                                        examples: [
                                          'RDAMVMSZ6Bj2tX6Ag',
                                          'RDAMVMeBauYFxXb3k',
                                          'RDAMVMjq06vGZ0fNw',
                                          'RDAMVMF2b_haxo9-g',
                                          'RDAMVMOe4QjqkziaI',
                                          'RDAMVMuztr1Nv17us',
                                          'RDAMVMczAhvbGOAp0',
                                          'RDAMVMQnS2zbYOpsI',
                                          'RDAMVMzf6ePjpBjGE',
                                          'RDAMVMu-udXcdNeu8',
                                          'RDAMVMQXWNCqCHZ1s',
                                          'RDAMVMk9gTFWJfBPs',
                                          'RDAMVMFcVT19XAVZk',
                                          'RDAMVMocta65bsLg0',
                                          'RDAMVMqi5gZSnrh1M',
                                          'RDAMVMcz8jHtz3QMM',
                                          'RDAMVM4N81orCJ-KM',
                                          'RDAMVMsohD_VX7KDk',
                                        ],
                                      }),
                                      params: Schema.String.annotations({
                                        examples: ['wAEB'],
                                      }),
                                      watchEndpointMusicSupportedConfigs: Part2,
                                    }),
                                  }),
                                }),
                              }),
                              Schema.Struct({
                                menuServiceItemRenderer: Schema.Struct({
                                  text: Part21,
                                  serviceEndpoint: Schema.Struct({
                                    queueAddEndpoint: Schema.Struct({
                                      queueTarget: Schema.Struct({
                                        videoId: Schema.String.annotations({
                                          examples: [
                                            'SZ6Bj2tX6Ag',
                                            'eBauYFxXb3k',
                                            'jq06vGZ0fNw',
                                            'F2b_haxo9-g',
                                            'Oe4QjqkziaI',
                                            'uztr1Nv17us',
                                            'czAhvbGOAp0',
                                            'QnS2zbYOpsI',
                                            'zf6ePjpBjGE',
                                            'u-udXcdNeu8',
                                            'QXWNCqCHZ1s',
                                            'k9gTFWJfBPs',
                                            'FcVT19XAVZk',
                                            'octa65bsLg0',
                                            'qi5gZSnrh1M',
                                            'cz8jHtz3QMM',
                                            '4N81orCJ-KM',
                                            'sohD_VX7KDk',
                                          ],
                                        }),
                                        onEmptyQueue: Schema.Struct({
                                          watchEndpoint: Schema.Struct({
                                            videoId: Schema.String.annotations({
                                              examples: [
                                                'SZ6Bj2tX6Ag',
                                                'eBauYFxXb3k',
                                                'jq06vGZ0fNw',
                                                'F2b_haxo9-g',
                                                'Oe4QjqkziaI',
                                                'uztr1Nv17us',
                                                'czAhvbGOAp0',
                                                'QnS2zbYOpsI',
                                                'zf6ePjpBjGE',
                                                'u-udXcdNeu8',
                                                'QXWNCqCHZ1s',
                                                'k9gTFWJfBPs',
                                                'FcVT19XAVZk',
                                                'octa65bsLg0',
                                                'qi5gZSnrh1M',
                                                'cz8jHtz3QMM',
                                                '4N81orCJ-KM',
                                                'sohD_VX7KDk',
                                              ],
                                            }),
                                          }),
                                        }),
                                      }),
                                      commands: Part34,
                                    }),
                                  }),
                                }),
                              }),
                              Part16,
                              Schema.Struct({
                                menuServiceItemDownloadRenderer: Schema.Struct({
                                  serviceEndpoint: Schema.Struct({
                                    offlineVideoEndpoint: Schema.Struct({
                                      videoId: Schema.String.annotations({
                                        examples: [
                                          'SZ6Bj2tX6Ag',
                                          'eBauYFxXb3k',
                                          'jq06vGZ0fNw',
                                          'F2b_haxo9-g',
                                          'Oe4QjqkziaI',
                                          'uztr1Nv17us',
                                          'czAhvbGOAp0',
                                          'QnS2zbYOpsI',
                                          'zf6ePjpBjGE',
                                          'u-udXcdNeu8',
                                          'QXWNCqCHZ1s',
                                          'k9gTFWJfBPs',
                                          'FcVT19XAVZk',
                                          'octa65bsLg0',
                                          'qi5gZSnrh1M',
                                          'cz8jHtz3QMM',
                                          '4N81orCJ-KM',
                                          'sohD_VX7KDk',
                                        ],
                                      }),
                                      onAddCommand: Schema.Struct({
                                        getDownloadActionCommand: Schema.Struct(
                                          {
                                            videoId: Schema.String.annotations({
                                              examples: [
                                                'SZ6Bj2tX6Ag',
                                                'eBauYFxXb3k',
                                                'jq06vGZ0fNw',
                                                'F2b_haxo9-g',
                                                'Oe4QjqkziaI',
                                                'uztr1Nv17us',
                                                'czAhvbGOAp0',
                                                'QnS2zbYOpsI',
                                                'zf6ePjpBjGE',
                                                'u-udXcdNeu8',
                                                'QXWNCqCHZ1s',
                                                'k9gTFWJfBPs',
                                                'FcVT19XAVZk',
                                                'octa65bsLg0',
                                                'qi5gZSnrh1M',
                                                'cz8jHtz3QMM',
                                                '4N81orCJ-KM',
                                                'sohD_VX7KDk',
                                              ],
                                            }),
                                            params: Schema.String.annotations({
                                              examples: ['CAI%3D'],
                                            }),
                                          },
                                        ),
                                      }),
                                    }),
                                  }),
                                  badgeIcon: Part16,
                                }),
                              }),
                              Part52,
                              Part58,
                              Part59,
                            ),
                          ),
                          topLevelButtons: Part34,
                        }),
                      }),
                      playlistItemData: Schema.Struct({
                        playlistSetVideoId: Schema.String.annotations({
                          examples: [
                            '14D7A6DC653F0643',
                            '5B470DC84CD04A18',
                            '7DA598B27EF71DE5',
                            'ADE2E0195DAE1E00',
                            'A571D36D8068C0A6',
                            'F694E71988D5F57B',
                            '6A7FD4A26E31C003',
                            '75E4B7A1AE4DB867',
                            'BF72EF441115BDF7',
                            '80A426D95B37539C',
                            'D283893EA1587D2C',
                            'FDD8B5021E05CDF0',
                            '6B1567C1A9D13C34',
                            '5241F3FF151795ED',
                            '222C525FF65C10C3',
                            'B881DE2E2A6CF64E',
                            '848AA2B35E1999DB',
                            'C8BF589C2569A838',
                          ],
                        }),
                        videoId: Schema.String.annotations({
                          examples: [
                            'SZ6Bj2tX6Ag',
                            'eBauYFxXb3k',
                            'jq06vGZ0fNw',
                            'F2b_haxo9-g',
                            'Oe4QjqkziaI',
                            'uztr1Nv17us',
                            'czAhvbGOAp0',
                            'QnS2zbYOpsI',
                            'zf6ePjpBjGE',
                            'u-udXcdNeu8',
                            'QXWNCqCHZ1s',
                            'k9gTFWJfBPs',
                            'FcVT19XAVZk',
                            'octa65bsLg0',
                            'qi5gZSnrh1M',
                            'cz8jHtz3QMM',
                            '4N81orCJ-KM',
                            'sohD_VX7KDk',
                          ],
                        }),
                      }),
                      itemHeight: Schema.String.annotations({
                        examples: ['MUSIC_RESPONSIVE_LIST_ITEM_HEIGHT_MEDIUM'],
                      }),
                      index: Part21,
                    }),
                  }),
                ),
              }),
            }),
          ),
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
                      thumbnail: Part76,
                      buttons: Schema.Array(
                        Schema.Union(
                          Part16,
                          Schema.Struct({
                            musicPlayButtonRenderer: Schema.Struct({
                              playNavigationEndpoint: Schema.Struct({
                                watchPlaylistEndpoint: Part77,
                              }),
                            }),
                          }),
                          Schema.Struct({
                            menuRenderer: Schema.Struct({
                              items: Schema.Array(
                                Schema.Union(
                                  Schema.Struct({
                                    menuNavigationItemRenderer: Schema.Struct({
                                      text: Part21,
                                      navigationEndpoint: Schema.Struct({
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
                                    }),
                                  }),
                                  Schema.Struct({
                                    menuServiceItemRenderer: Schema.Struct({
                                      text: Part21,
                                      serviceEndpoint: Schema.Struct({
                                        queueAddEndpoint: Schema.Struct({
                                          queueTarget: Schema.Struct({
                                            playlistId:
                                              Schema.String.annotations({
                                                examples: [
                                                  'OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                                ],
                                              }),
                                            onEmptyQueue: Schema.Struct({
                                              watchEndpoint: Part77,
                                            }),
                                          }),
                                          commands: Part34,
                                        }),
                                      }),
                                    }),
                                  }),
                                  Part52,
                                  Part58,
                                  Part59,
                                ),
                              ),
                            }),
                          }),
                        ),
                      ),
                      title: Part21,
                      subtitle: Part21,
                      straplineTextOne: Schema.Struct({
                        runs: Schema.Array(
                          Schema.Struct({
                            text: Schema.String.annotations({
                              examples: ['Hania Rani'],
                            }),
                            navigationEndpoint: Part56,
                          }),
                        ),
                      }),
                      straplineThumbnail: Part76,
                      secondSubtitle: Part21,
                    }),
                  }),
                ),
              }),
            }),
          }),
        }),
      ),
    }),
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
      thumbnail: Part74,
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
})
