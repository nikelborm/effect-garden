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

const Part27 = Schema.Array(Part16)

const Part41 = Schema.Struct({
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

const Part43 = Schema.Struct({
  musicThumbnailRenderer: Schema.Struct({
    thumbnail: Part41,
    thumbnailCrop: Schema.String.annotations({
      examples: ['MUSIC_THUMBNAIL_CROP_UNSPECIFIED'],
    }),
    thumbnailScale: Schema.String.annotations({
      examples: ['MUSIC_THUMBNAIL_SCALE_UNSPECIFIED'],
    }),
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
                          items: Part27,
                          topLevelButtons: Part27,
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
                      thumbnail: Part43,
                      buttons: Schema.Array(
                        Schema.Union(
                          Part16,
                          Schema.Struct({
                            musicPlayButtonRenderer: Schema.Struct({
                              playNavigationEndpoint: Schema.Struct({
                                watchPlaylistEndpoint: Schema.Struct({
                                  playlistId: Schema.String.annotations({
                                    examples: [
                                      'OLAK5uy_mfJjf2Ew1kjS_jmZo0Hvx73LHXT_WWMmQ',
                                    ],
                                  }),
                                }),
                              }),
                            }),
                          }),
                          Schema.Struct({
                            menuRenderer: Schema.Struct({ items: Part27 }),
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
                            navigationEndpoint: Schema.Struct({
                              browseEndpoint: Schema.Struct({
                                browseId: Schema.String.annotations({
                                  examples: ['UCkBoNlyN9hWbq6uO_CqGeIg'],
                                }),
                                browseEndpointContextSupportedConfigs:
                                  Schema.Struct({
                                    browseEndpointContextMusicConfig:
                                      Schema.Struct({
                                        pageType: Schema.String.annotations({
                                          examples: ['MUSIC_PAGE_TYPE_ARTIST'],
                                        }),
                                      }),
                                  }),
                              }),
                            }),
                          }),
                        ),
                      }),
                      straplineThumbnail: Part43,
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
      thumbnail: Part41,
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
