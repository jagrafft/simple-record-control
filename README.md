# Simple Record Control
Lightweight HTTP interface for synchronously starting and stopping recording processes from multiple devices. Based on [Express.js](https://expressjs.com/) and [PM2](http://pm2.keymetrics.io/) and built for use with [FFmpeg](https://ffmpeg.org/) and [GStreamer](https://gstreamer.freedesktop.org/) as well.

## Resources
The `js/resources` directory contains a set of JSON files used to configure Simple Record Control.

- resources/
    - presets/
        - ffmpeg.json
        - gstreamer.json
    - css.json
    - settings.json
    - sources.json

### *ffmpeg.json* & *gstreamer.json*
Settings for FFmpeg and GStreamer. If you plan to use both, **IDs should match!!**

#### *ffmpeg.json*
```json
{
    "vp9": {
        "preInput": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp -r 25",
        "postInput": "-c:v libvpx-vp9 -g 30 -f webm",
        "videoFormat": "webm"
    },
    "x264": {
        "preInput": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp -r 25",
        "postInput": "-c:v libx264 -profile:v high -an",
        "videoFormat": "mp4"
    },
    "x264.2": {
        "preInput": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp",
        "postInput": "-c:v libx264 -an",
        "videoFormat": "mp4"
    },
    "vp9-local": {
        "preInput": "-thread_queue_size 1024",
        "postInput": "-c:v libvpx-vp9 -an -g 30 -f webm",
        "videoFormat": "webm"
    }
}
```

#### *gstreamer.json*
```json
{}
```

### *css.json*
```json
{
    "_src": "...",
    "css": "..."
}
```

### *encoders.json*
*default* is required
```json
{
    "default": {
        "preInput": "-f v4l2 -r 25",
        "postInput": "-c:v libvpx-vp9 -b:v 350k -g 30 -f webm",
        "videoFormat": "webm"
    },
    "x264": {
        "preInput": "-thread_queue_size 64 -rtsp_transport tcp -f rtsp -r 25",
        "postInput": "-c:v libx264 -profile:v high -an",
        "videoFormat": "mp4"
    }
}
```

### *settings.json*
```json
{
    "general": {
        "baseDir": "./recordings"
    }
}
```

### *sources.json*
(id = 0) == (id = 1)
```json
[
    {
        "id": 1,
        "name": "",
        "addr": "rtsp://stream:user@192.168.0.101:554/...",
        "encoder": "default"
    },
    {
        "id": 2,
        "name": "webcam",
        "addr": "/dev/video0",
        "encoder": "x264"
    }
]
```

## Custom Docker Container
In the works...
```docker
docker pull ...

docker run --rm -it -p 127.0.0.1:13117:3000 -v {LOCAL_PATH}:/opt/ffmpeg/out simple-record
```