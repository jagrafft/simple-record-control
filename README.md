# Simple Record Control
Lightweight HTTP interface for synchronously starting and stopping recording processes from multiple devices. Based on [Express.js](https://expressjs.com/) and [PM2](http://pm2.keymetrics.io/); built for use with [FFmpeg](https://ffmpeg.org/) and [GStreamer](https://gstreamer.freedesktop.org/).

## Resources
The `js/resources` directory contains a set of JSON files used to configure Simple Record Control.

- resources/
    - presets/
        - ffmpeg.json
        - gstreamer.json
    - css.json
    - settings.json
    - sources.json

### *presets/*
Settings for FFmpeg and GStreamer. If you plan to use both, **IDs should match!!**

#### *ffmpeg.json*
```json
{
    "opus": {
        "preInput": "thread_queue_size 512 -f pulse -sample_rate 48k -channels 2 -frame_size 2",
        "postInput": "-c:a libopus -b:a 96k",
        "extension": "opus"
    },
    "x264": {
        "preInput": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp -r 30",
        "postInput": "-c:v libx264 -profile:v high -an",
        "extension": "mp4"
    },
    "x264.2": {
        "preInput": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp",
        "postInput": "-c:v libx264 -an",
        "extension": "mp4"
    },
    "vp9": {
        "preInput": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp -r 30",
        "postInput": "-c:v libvpx-vp9 -g 30 -f webm",
        "extension": "webm"
    },
    "vp9-local": {
        "preInput": "-thread_queue_size 1024",
        "postInput": "-c:v libvpx-vp9 -an -g 30 -f webm",
        "extension": "webm"
    }
}
```

#### *gstreamer.json*
```json
{
    "opus": {
    },
    "x264": {
    },
    "x264.2": {
    },
    "vp9": {
    },
    "vp9-local": {
    }
}
```

### *css.json*
```json
{
    "_src": "...",
    "css": "..."
}
```

### *settings.json*
Valid utlities (CaSE seNSiTIvE)
- ffmpeg
- gstreamer

```json
{
    "general": {
        "baseDir": "./recordings",
        "utility": "ffmpeg"
    }
}
```

### *sources.json*
```json
[
    {
        "id": 1,
        "name": "",
        "addr": "rtsp://stream:user@192.168.0.101:554/...",
        "encoder": "vp9"
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

## Notes
- The `maxBuffer` option of `child_process.exec` imposes a limit on maximum recording time per process call (in my tests this was ~13-19 minutes depending on settings). `simple-record-control` uses 128MiB for `maxBuffer`, which *should* be sufficient for a large number of cases. If you find recordings are "timing out" round the same time with a given setting, do two things

1. Check the logs to see what they are filling up with. Do you need to increase `maxBuffer` or fix your instructions? Chances are excellent it's the latter.
2. Make the fixes and run more tests.

If the problem persists, increase `maxBuffer` and run more tests.