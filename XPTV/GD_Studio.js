const $config = argsify($config_str)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const headers = {
    'User-Agent': UA,
}

const ALL_SOURCES = [
    { id: 'netease', name: '网易' },
    { id: 'kuwo', name: '酷我' },
    { id: 'joox', name: 'JOOX' },
    { id: 'tencent', name: 'QQ' },
    { id: 'tidal', name: 'Tidal' },
    //{ id: 'spotify', name: 'Spotify' },
    //{ id: 'ytmusic', name: 'YouTube' },
    { id: 'qobuz', name: 'Qobuz' },
    { id: 'deezer', name: 'Deezer' },
    //{ id: 'migu', name: '咪咕' },
    { id: 'kugou', name: '酷狗' },
    //{ id: 'ximalaya', name: '喜马拉雅' },
    //{ id: 'apple', name: 'Apple' }
]

const appConfig = {
    ver: 1,
    name: 'GD音乐',
    message: '基于GD Studio音乐API',
    warning: '基于GD音乐台API(music.gdstudio.xyz)制作\n⚠️仅供学习参考，请勿商用',
    desc: '',
    tabLibrary: {
        name: '音乐',
        groups: [
            {
                name: '热门歌曲',
                type: 'song',
                ui: 0,
                showMore: true,
                ext: {
                    gid: 'hot',
                    source: 'netease',
                    keyword: '周杰伦'
                },
            },
            {
                name: '新歌推荐',
                type: 'song',
                ui: 0,
                showMore: true,
                ext: {
                    gid: 'new',
                    source: 'netease',
                    keyword: '新歌'
                },
            },
            {
                name: '华语流行',
                type: 'song',
                ui: 0,
                showMore: true,
                ext: {
                    gid: 'chinese',
                    source: 'netease',
                    keyword: '华语'
                },
            }
        ],
    },
    tabSearch: {
        name: '搜索',
        groups: ALL_SOURCES.map(source => ({
            name: source.name,
            type: 'song',
            ext: {
                type: 'song',
                source: source.id
            },
        }))
    }
}

async function getConfig() {
    return jsonify(appConfig)
}

async function getCoverUrl(pic_id, source = 'netease') {
    if (!pic_id) {
        return 'https://music.gdstudio.xyz/favicon.ico'
    }
    
    try {
        const coverApiUrl = `https://music-api.gdstudio.xyz/api.php?types=pic&source=${source}&id=${pic_id}&size=300`
        const { data } = await $fetch.get(coverApiUrl, { headers })
        
        let result
        if (typeof data === 'string') {
            try {
                result = JSON.parse(data)
            } catch(e) {
                return 'https://music.gdstudio.xyz/favicon.ico'
            }
        } else {
            result = data
        }
        
        if (result && result.url) {
            return result.url
        }
    } catch (error) {
    }
    
    return 'https://music.gdstudio.xyz/favicon.ico'
}

async function searchSource(text, source, page = 1, count = 20) {
    let songs = []
    
    try {
        const searchUrl = `https://music-api.gdstudio.xyz/api.php?types=search&source=${source}&name=${encodeURIComponent(text)}&count=${count}&pages=${page}`
        const { data } = await $fetch.get(searchUrl, { headers })
        
        let result
        if (typeof data === 'string') {
            try {
                result = JSON.parse(data)
            } catch(e) {
                return []
            }
        } else {
            result = data
        }
        
        if (Array.isArray(result)) {
            for (let i = 0; i < result.length; i++) {
                const item = result[i]
                
                let artistName = '未知歌手'
                let artistId = 'unknown'
                
                if (item.artist) {
                    if (Array.isArray(item.artist)) {
                        artistName = item.artist.join(' / ')
                        artistId = item.artist[0] || 'unknown'
                    } else {
                        artistName = item.artist
                        artistId = item.artist
                    }
                }
                
                let coverUrl = 'https://music.gdstudio.xyz/favicon.ico'
                if (item.pic_id) {
                    coverUrl = await getCoverUrl(item.pic_id, item.source || source)
                }
                
                songs.push({
                    id: `${item.source || source}_${item.id || i}`,
                    name: item.name || '未知歌曲',
                    cover: coverUrl,
                    duration: 0,
                    artist: {
                        id: artistId,
                        name: artistName
                    },
                    ext: {
                        track_id: item.id ? String(item.id) : '',
                        source: item.source || source,
                        pic_id: item.pic_id || ''
                    }
                })
            }
        } else if (result && result.data && Array.isArray(result.data)) {
            for (let i = 0; i < result.data.length; i++) {
                const item = result.data[i]
                
                let artistName = '未知歌手'
                let artistId = 'unknown'
                
                if (item.artist) {
                    if (Array.isArray(item.artist)) {
                        artistName = item.artist.join(' / ')
                        artistId = item.artist[0] || 'unknown'
                    } else {
                        artistName = item.artist
                        artistId = item.artist
                    }
                }
                
                let coverUrl = 'https://music.gdstudio.xyz/favicon.ico'
                if (item.pic_id) {
                    coverUrl = await getCoverUrl(item.pic_id, item.source || source)
                }
                
                songs.push({
                    id: `${item.source || source}_${item.id || i}`,
                    name: item.name || '未知歌曲',
                    cover: coverUrl,
                    duration: 0,
                    artist: {
                        id: artistId,
                        name: artistName
                    },
                    ext: {
                        track_id: item.id ? String(item.id) : '',
                        source: item.source || source,
                        pic_id: item.pic_id || ''
                    }
                })
            }
        }
    } catch (error) {
    }
    
    return songs
}

async function getSongs(ext) {
    const { page = 1, gid, text, keyword, source = 'netease', count = 20 } = argsify(ext)
    let songs = []
    
    let searchText = text || keyword || '周杰伦'
    
    songs = await searchSource(searchText, source, page, count)
    
    return jsonify({
        list: songs,
    })
}

async function search(ext) {
    const { text, page = 1, type, source } = argsify(ext)
    
    if (!text) {
        return jsonify({ list: [] })
    }
    
    const songs = await searchSource(text, source, page, 20)
    
    return jsonify({
        list: songs,
    })
}

async function getSongInfo(ext) {
    const { track_id, source = 'netease', pic_id } = argsify(ext)
    
    if (!track_id) {
        return jsonify({ 
            urls: []
        })
    }
    
    try {
        const apiUrl = `https://music-api.gdstudio.xyz/api.php?types=url&source=${source}&id=${track_id}&br=999`
        const { data } = await $fetch.get(apiUrl, { headers })
        
        let result
        if (typeof data === 'string') {
            try {
                result = JSON.parse(data)
            } catch(e) {
                result = null
            }
        } else {
            result = data
        }
        
        let playUrl = ''
        if (result && result.url) {
            playUrl = result.url
        } else {
            try {
                const backupUrl = `https://api.injahow.cn/meting/?type=url&id=${track_id}&source=${source}`
                const { data } = await $fetch.get(backupUrl, { 
                    headers: {
                        'User-Agent': UA,
                    }
                })
                
                if (data && data.url) {
                    playUrl = data.url
                }
            } catch(e) {
            }
        }
        
        let coverUrl = 'https://music.gdstudio.xyz/favicon.ico'
        if (pic_id) {
            coverUrl = await getCoverUrl(pic_id, source)
        }
        
        return jsonify({
            urls: playUrl ? [playUrl] : [],
            headers: [{
                'User-Agent': UA,
                'Referer': 'https://music.gdstudio.org/'
            }],
            cover: coverUrl
        })
        
    } catch (error) {
        return jsonify({ 
            urls: []
        })
    }
}

