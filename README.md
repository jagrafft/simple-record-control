# Simple Record Control
Lightweight HTTP interface for synchronously starting and stopping multiple recording processes. Based on [Express.js](https://expressjs.com/) and [PM2](http://pm2.keymetrics.io/) and built for use with [FFmpeg](https://ffmpeg.org/).

## Settings and Sources
Settings and data sources are specified in two JSON files found in `config/`

### *settings.json*
```json
{
    "default": {                // REQUIRED
        "util": "ffmpeg",
        "overwrite": false,
        "preInput": "-f v4l2 -r 25",
        "postInput": "-c:v libvpx-vp9 -b:v 350k -g 30 -f webm",
        "videoFormat": "webm"
    },
    "x264": {
        "util": "ffmpeg",
        "overwrite": true,
        "preInput": "-thread_queue_size 64 -rtsp_transport tcp -f rtsp -r 25",
        "postInput": "-c:v libx264 -profile:v high -an",
        "videoFormat": "mp4"
    }
    // , { ... }
}
```

### *sources.json*
```json
[
    {
        "id": 0,
        "name": "",
        "addr": "rtsp://stream:user@192.168.0.101:554/..."
    },
    {
        "id": 1,
        "name": "",
        "addr": "rtsp://stream:user@192.168.0.101:554/...",
        "setting": "default"        // Same as id=0
    },
    {
        "id": 2,
        "name": "webcam",
        "addr": "/dev/video0",
        "setting": "x264"
    }
    // , { ... }
]
```

## Custom Docker Container
```docker
docker pull ...

docker run --rm -it -p 127.0.0.1:13117:3000 -v {LOCAL_PATH}:/opt/ffmpeg/out simple-record
```