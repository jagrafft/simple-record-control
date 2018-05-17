# Simple Record Control
**DEPRECATED:** Simple Record Control has been integrated, in its entirety, into the *vision* service as [cortex]().

Lightweight HTTPS interface for synchronously starting and stopping recording processes from multiple devices. Based on [Express.js](https://expressjs.com/) and [PM2](http://pm2.keymetrics.io/); built for use with [FFmpeg](https://ffmpeg.org/) and [GStreamer](https://gstreamer.freedesktop.org/).

**Obligate HTTPS!!** Includes demo certificates which *most browsers will flag as invalid.* For testing use `https://0.0.0.0:3000` and accept the "bad" certificate. For more formal use set up proper certificates via, say, [Certbot](https://certbot.eff.org/).

## Resources
The `js/resources` directory contains a set of JSON files used to configure Simple Record Control.

- resources/
    - presets/
        - ffmpeg.json
        - gstreamer.json
    - html_addons.json
    - settings.json
    - sources.json

### *presets/*
Settings for FFmpeg and GStreamer. If you plan to use both, **IDs should match!!**

#### *ffmpeg.json*
```json
{
    "opus": {
        "pipeline": "thread_queue_size 512 -f pulse -sample_rate 48k -channels 2 -frame_size 2 -i __ADDR__ -c:a libopus -b:a 96k __FILENAME__",
        "extension": "opus"
    },
    "x264": {
        "pipeline": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp -r 25 -i __ADDR__ -c:v libx264 -keyint_min 60 -g 60 -preset veryfast -tune zerolatency -an __FILENAME__",
        "extension": "mp4"
    },
    "x264.segments": {
        "pipeline": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp -r 25 -i __ADDR__ -c:v libx264 -keyint_min 60 -g 60 -preset veryfast -tune zerolatency -an -f segment -segment_time 1 %03d-__FILENAME__",
        "extension": "mp4"
    },
    "vp9": {
        "pipeline": "-thread_queue_size 1024 -rtsp_transport tcp -f rtsp -r 25 -i __ADDR__ -c:v libvpx-vp9 -g 30 -f webm __FILENAME__",
        "extension": "webm"
    }
}
```

#### *gstreamer.json*
```json
{
    "x264": {
        "pipeline": "rtspsrc timeout=5 location=__ADDR__ ! rtph264depay ! video/x-h264,width=1280,height=720,framerate=25/1 ! queue ! avdec_h264 ! x264enc key-int-max=60 speed-preset=veryfast tune=zerolatency ! queue ! h264parse ! mp4mux ! filesink location=__FILENAME__",
        "extension": "mp4"
    },
    "x264.segments": {
        "pipeline": "rtspsrc timeout=5 location=__ADDR__ ! rtph264depay ! video/x-h264,width=1280,height=720,framerate=25/1 ! queue ! avdec_h264 ! x264enc key-int-max=60 speed-preset=veryfast tune=zerolatency ! queue ! h264parse ! splitmuxsink max-size-time=1000000000 muxer=mp4mux location=%03d-__FILENAME__",
        "extension": "mp4"
    }
}
```

### *html_addons.json*
```json
{
    "_src": "...",
    "css": "...",
    "js": "..."
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