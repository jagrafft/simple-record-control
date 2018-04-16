# Simple Record Control
Lightweight HTTP interface for synchronously starting and stopping multiple recording processes. Based on [Express.js](https://expressjs.com/) and [PM2](http://pm2.keymetrics.io/) and built for use with [FFmpeg](https://ffmpeg.org/) with plans to expand support to [GStreamer](https://gstreamer.freedesktop.org/) as well.

## Resources
Settings and data sources are specified in JSON files found in `./js/resources/`

### *css.json*

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

### *sources.json*
(id = 0) == (id = 1)
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
        "setting": "default"
    },
    {
        "id": 2,
        "name": "webcam",
        "addr": "/dev/video0",
        "setting": "x264"
    }
]
```

## Custom Docker Container
In the works...
```docker
docker pull ...

docker run --rm -it -p 127.0.0.1:13117:3000 -v {LOCAL_PATH}:/opt/ffmpeg/out simple-record
```