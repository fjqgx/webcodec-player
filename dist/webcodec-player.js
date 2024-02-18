/*! webcodec-player - ver 1.0.0 created:2024/2/4 17:01:34 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/audio/decoder/audio-decoder.ts":
/*!********************************************!*\
  !*** ./src/audio/decoder/audio-decoder.ts ***!
  \********************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebcodecAudioDecoder = void 0;
var aac_adts_1 = __webpack_require__(/*! ../format/aac-adts */ "./src/audio/format/aac-adts.ts");
var opus_1 = __webpack_require__(/*! ../format/opus */ "./src/audio/format/opus.ts");
var decoder_1 = __webpack_require__(/*! ./decoder */ "./src/audio/decoder/decoder.ts");
/**
 * 音频采样率
 */
var SamplingFrequencyIndex = [
    96000,
    88200,
    64000,
    48000,
    44100,
    32000,
    24000,
    22050,
    16000,
    12000,
    11025,
    8000,
    7350,
    -1,
    1,
    -1
];
var WebcodecAudioDecoder = /** @class */ (function (_super) {
    __extends(WebcodecAudioDecoder, _super);
    function WebcodecAudioDecoder() {
        var _this = _super.call(this) || this;
        _this.aacAdtsFormat = new aac_adts_1.AacAdtsFormat();
        _this.opusFormat = new opus_1.OggOpusFormat();
        _this.audioElement = document.createElement('audio');
        var generator = new MediaStreamTrackGenerator({ kind: 'audio' });
        _this.writer = generator.writable.getWriter();
        var mediaStream = new MediaStream();
        mediaStream.addTrack(generator);
        _this.audioElement.srcObject = mediaStream;
        return _this;
    }
    WebcodecAudioDecoder.prototype.play = function (type) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var buffer = _this.getFrame();
            if (buffer) {
                _this.audioFormatType = type;
                _this.decodeAudioFrame(buffer).then(function () {
                    _this.excutePlay().then(function () {
                        resolve();
                    }).catch(function (err) {
                        reject(err);
                    });
                }).catch(function (err) {
                    reject(err);
                });
            }
        });
    };
    WebcodecAudioDecoder.prototype.isSupport = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (window.AudioDecoder !== undefined) {
                var config = _this.createAudioDecoderConfig(data);
                AudioDecoder.isConfigSupported(config).then(function (res) {
                    resolve(res);
                }).catch(function (err) {
                    // 参数异常
                    reject({
                        code: 10102 /* AudioError.AudioDecoder_Parameter_Abnormality */,
                        message: err.message
                    });
                });
            }
            else {
                reject({
                    code: 10101 /* AudioError.NotSupport_AudioDecoder */,
                    message: "not support AudioDecoder"
                });
            }
        });
    };
    WebcodecAudioDecoder.prototype.excutePlay = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.onFlushTimer();
            _this.startFlushTimer(false);
            resolve();
        });
    };
    WebcodecAudioDecoder.prototype.onFlushTimer = function () {
        if (this.audioDataArr.length) {
            while (this.audioDataArr.length) {
                var data = this.audioDataArr.shift();
                if (data) {
                    this.writer.write(data);
                    console.log("have audio data ", this.audioElement.paused, "   ", this.audioElement.currentTime);
                    if (this.audioElement.paused) {
                        this.audioElement.play();
                        console.log("audio play");
                    }
                }
            }
        }
        else {
            var buffer = this.getFrame();
            if (buffer) {
                this.decodeAudioFrame(buffer);
            }
        }
    };
    WebcodecAudioDecoder.prototype.getFrame = function () {
        if (this.bufferArray.length) {
            var buffer = this.bufferArray.shift();
            if (buffer) {
                return new Uint8Array(buffer);
            }
        }
        return undefined;
    };
    WebcodecAudioDecoder.prototype.decodeAudioFrame = function (buffer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var frameArr = [];
            switch (_this.audioFormatType) {
                case 2 /* AudioFormatType.AacAdts */:
                    frameArr = _this.aacAdtsFormat.parse(buffer);
                    break;
                case 4 /* AudioFormatType.Opus */:
                    // frameArr = this.opusFormat.parse(buffer);
                    break;
                default:
                    break;
            }
            if (frameArr.length > 0) {
                _this.isSupport(frameArr[0]).then(function (res) {
                    var _a;
                    console.log("supported");
                    if (res.supported) {
                        _this.init(res.config);
                        for (var i = 0; i < frameArr.length; ++i) {
                            (_a = _this.audioDecoder) === null || _a === void 0 ? void 0 : _a.decode(new EncodedAudioChunk({
                                data: frameArr[i].data,
                                timestamp: 0,
                                type: "key",
                            }));
                        }
                        resolve();
                    }
                    else {
                        reject({
                            code: 10103 /* AudioError.AudioDecoder_Decoder_NotSupport */,
                            message: "codec not support"
                        });
                    }
                }).catch(function (err) {
                    console.log("not supported");
                    reject(err);
                });
            }
            else {
                reject({
                    code: -1,
                    message: "audio data error, not aac-adts"
                });
            }
        });
    };
    WebcodecAudioDecoder.prototype.createAudioDecoderConfig = function (frame) {
        switch (this.audioFormatType) {
            case 2 /* AudioFormatType.AacAdts */:
                return this.createAacAdtsDecoderConfig(frame);
            case 4 /* AudioFormatType.Opus */:
                return this.createOpusDecoderConfig(frame);
            default:
                break;
        }
        return {
            codec: '',
            numberOfChannels: 2,
            sampleRate: 0
        };
    };
    WebcodecAudioDecoder.prototype.createAacAdtsDecoderConfig = function (frame) {
        var config = {
            codec: '',
            // description?: AllowSharedBufferSource | undefined;
            numberOfChannels: frame.header.channel_configuration,
            sampleRate: 0,
        };
        if (SamplingFrequencyIndex.length > frame.header.sampling_frequency_index) {
            config.sampleRate = SamplingFrequencyIndex[frame.header.sampling_frequency_index];
        }
        if (frame.header.profile === 1 /* AdtsProfile.LowComplexity */) {
            config.codec = 'mp4a.40.2';
        }
        return config;
    };
    WebcodecAudioDecoder.prototype.createOpusDecoderConfig = function (frame) {
        var config = {
            codec: "Lavf58.76.100",
            // description?: AllowSharedBufferSource | undefined;
            numberOfChannels: 2,
            sampleRate: 48000,
        };
        // if (SamplingFrequencyIndex.length > frame.header.sampling_frequency_index) {
        //   config.sampleRate = SamplingFrequencyIndex[frame.header.sampling_frequency_index];
        // }
        // if (frame.header.profile === AdtsProfile.LowComplexity) {
        //   config.codec = 'mp4a.40.2';
        // }
        return config;
    };
    return WebcodecAudioDecoder;
}(decoder_1.Decoder));
exports.WebcodecAudioDecoder = WebcodecAudioDecoder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaW8tZGVjb2Rlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF1ZGlvLWRlY29kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsK0NBQTRGO0FBQzVGLHVDQUE0RDtBQUU1RCxxQ0FBb0M7QUFFcEM7O0dBRUc7QUFDSCxJQUFNLHNCQUFzQixHQUFhO0lBQ3ZDLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsS0FBSztJQUNMLEtBQUs7SUFDTCxLQUFLO0lBQ0wsSUFBSTtJQUNKLElBQUk7SUFDSixDQUFDLENBQUM7SUFDRixDQUFDO0lBQ0QsQ0FBQyxDQUFDO0NBQ0gsQ0FBQztBQXNCRjtJQUEwQyx3Q0FBTztJQVMvQztRQUNFLFlBQUEsTUFBSyxXQUFFLFNBQUM7UUFSQSxtQkFBYSxHQUFrQixJQUFJLHdCQUFhLEVBQUUsQ0FBQztRQUVuRCxnQkFBVSxHQUFrQixJQUFJLG9CQUFhLEVBQUUsQ0FBQztRQUdoRCxrQkFBWSxHQUFxQixRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBSXpFLElBQU0sU0FBUyxHQUE4QixJQUFJLHlCQUF5QixDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUM7UUFDN0YsS0FBSSxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzdDLElBQU0sV0FBVyxHQUFnQixJQUFJLFdBQVcsRUFBRSxDQUFDO1FBQ25ELFdBQVcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEMsS0FBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDOztJQUM1QyxDQUFDO0lBRU0sbUNBQUksR0FBWCxVQUFZLElBQXFCO1FBQWpDLGlCQWdCQztRQWZDLE9BQU8sSUFBSSxPQUFPLENBQUMs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Ii4uL2Vycm9yXCI7XHJcbmltcG9ydCB7IEFhY0FkdHNGb3JtYXQsIEFkdHNGaXhlZEhlYWRlciwgQWR0c0ZyYW1lLCBBZHRzUHJvZmlsZSB9IGZyb20gXCIuLi9mb3JtYXQvYWFjLWFkdHNcIjtcclxuaW1wb3J0IHsgT2dnT3B1c0Zvcm1hdCwgT3B1c1BhY2thZ2UgfSBmcm9tIFwiLi4vZm9ybWF0L29wdXNcIjtcclxuaW1wb3J0IHsgQXVkaW9Gb3JtYXRUeXBlIH0gZnJvbSBcIi4uL3V0aWxzL2F1ZGlvLWZvcm1hdC11dGlsXCI7XHJcbmltcG9ydCB7IERlY29kZXIgfSBmcm9tIFwiLi9kZWNvZGVyXCI7XHJcblxyXG4vKipcclxuICog6Z+z6aKR6YeH5qC3546HXHJcbiAqL1xyXG5jb25zdCBTYW1wbGluZ0ZyZXF1ZW5jeUluZGV4OiBudW1iZXJbXSA9IFtcclxuICA5NjAwMCxcclxuICA4ODIwMCxcclxuICA2NDAwMCxcclxuICA0ODAwMCxcclxuICA0NDEwMCxcclxuICAzMjAwMCxcclxuICAyNDAwMCxcclxuICAyMjA1MCxcclxuICAxNjAwMCxcclxuICAxMjAwMCxcclxuICAxMTAyNSxcclxuICA4MDAwLFxyXG4gIDczNTAsXHJcbiAgLTEsXHJcbiAgMSxcclxuICAtMVxyXG5dO1xyXG5cclxuZGVjbGFyZSBjbGFzcyBNZWRpYVN0cmVhbVRyYWNrR2VuZXJhdG9yIGV4dGVuZHMgTWVkaWFTdHJlYW1UcmFjayB7XHJcbiAgY29uc3RydWN0b3IgKGNvbmZpZzogeyBraW5kOiBcImF1ZGlvXCIgfCBcInZpZGVvXCJ9KTtcclxuXHJcbiAgcmVhZG9ubHkgd3JpdGFibGU6IFdyaXRhYmxlU3RyZWFtO1xyXG59XHJcblxyXG5kZWNsYXJlIGNsYXNzIFdyaXRhYmxlU3RyZWFtIHtcclxuICBnZXRXcml0ZXIoKTogV3JpdGFibGVTdHJlYW1EZWZhdWx0V3JpdGVyO1xyXG59XHJcblxyXG5kZWNsYXJlIGNsYXNzIFdyaXRhYmxlU3RyZWFtRGVmYXVsdFdyaXRlciAge1xyXG4gIHdyaXRlKGZyYW1lOiBBdWRpb0RhdGEpOiB2b2lkO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBFbmNvZGVkQXVkaW8ge1xyXG4gIGVuY29kZXJJbmZvOiBBdWRpb0RlY29kZXJDb25maWc7XHJcbiAgYXVkaW9EYXRhQXJyOiBVaW50OEFycmF5W107XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBXZWJjb2RlY0F1ZGlvRGVjb2RlciBleHRlbmRzIERlY29kZXIge1xyXG5cclxuICBwcm90ZWN0ZWQgYWFjQWR0c0Zvcm1hdDogQWFjQWR0c0Zvcm1hdCA9IG5ldyBBYWNBZHRzRm9ybWF0KCk7XHJcblxyXG4gIHByb3RlY3RlZCBvcHVzRm9ybWF0OiBPZ2dPcHVzRm9ybWF0ID0gbmV3IE9nZ09wdXNGb3JtYXQoKTtcclxuXHJcbiAgcHJvdGVjdGVkIHdyaXRlcjogV3JpdGFibGVTdHJlYW1EZWZhdWx0V3JpdGVyO1xyXG4gIHByb3RlY3RlZCBhdWRpb0VsZW1lbnQ6IEhUTUxBdWRpb0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xyXG5cclxuICBjb25zdHJ1Y3RvciAoKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gICAgY29uc3QgZ2VuZXJhdG9yOiBNZWRpYVN0cmVhbVRyYWNrR2VuZXJhdG9yID0gbmV3IE1lZGlhU3RyZWFtVHJhY2tHZW5lcmF0b3IoeyBraW5kOiAnYXVkaW8nfSk7XHJcbiAgICB0aGlzLndyaXRlciA9IGdlbmVyYXRvci53cml0YWJsZS5nZXRXcml0ZXIoKTtcclxuICAgIGNvbnN0IG1lZGlhU3RyZWFtOiBNZWRpYVN0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbSgpO1xyXG4gICAgbWVkaWFTdHJlYW0uYWRkVHJhY2soZ2VuZXJhdG9yKTtcclxuICAgIHRoaXMuYXVkaW9FbGVtZW50LnNyY09iamVjdCA9IG1lZGlhU3RyZWFtO1xyXG4gIH1cclxuIFxyXG4gIHB1YmxpYyBwbGF5KHR5cGU6IEF1ZGlvRm9ybWF0VHlwZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgbGV0IGJ1ZmZlcjogVWludDhBcnJheSB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0RnJhbWUoKTtcclxuICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgIHRoaXMuYXVkaW9Gb3JtYXRUeXBlID0gdHlwZTtcclxuICAgICAgICB0aGlzLmRlY29kZUF1ZGlvRnJhbWUoYnVmZmVyKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgIHRoaXMuZXhjdXRlUGxheSgpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XHJcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xyXG4gICAgICAgICAgfSlcclxuICAgICAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XHJcbiAgICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGlzU3VwcG9ydCAoZGF0YTogQWR0c0ZyYW1lICk6IFByb21pc2U8QXVkaW9EZWNvZGVyU3VwcG9ydD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgaWYgKHdpbmRvdy5BdWRpb0RlY29kZXIgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGxldCBjb25maWc6IEF1ZGlvRGVjb2RlckNvbmZpZyA9IHRoaXMuY3JlYXRlQXVkaW9EZWNvZGVyQ29uZmlnKGRhdGEpO1xyXG4gICAgICAgIEF1ZGlvRGVjb2Rlci5pc0NvbmZpZ1N1cHBvcnRlZChjb25maWcpLnRoZW4oKHJlczogQXVkaW9EZWNvZGVyU3VwcG9ydCkgPT4ge1xyXG4gICAgICAgICAgcmVzb2x2ZShyZXMpO1xyXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcclxuICAgICAgICAgIC8vIOWPguaVsOW8guW4uFxyXG4gICAgICAgICAgcmVqZWN0KHtcclxuICAgICAgICAgICAgY29kZTogQXVkaW9FcnJvci5BdWRpb0RlY29kZXJfUGFyYW1ldGVyX0Fibm9ybWFsaXR5LFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZWplY3Qoe1xyXG4gICAgICAgICAgY29kZTogQXVkaW9FcnJvci5Ob3RTdXBwb3J0X0F1ZGlvRGVjb2RlcixcclxuICAgICAgICAgIG1lc3NhZ2U6IFwibm90IHN1cHBvcnQgQXVkaW9EZWNvZGVyXCJcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGV4Y3V0ZVBsYXkgKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5vbkZsdXNoVGltZXIoKTtcclxuICAgICAgdGhpcy5zdGFydEZsdXNoVGltZXIoZmFsc2UpO1xyXG4gICAgICByZXNvbHZlKCk7XHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIG9uRmx1c2hUaW1lcigpOiB2b2lkIHtcclxuICAgIGlmICh0aGlzLmF1ZGlvRGF0YUFyci5sZW5ndGgpIHtcclxuICAgICAgd2hpbGUgKHRoaXMuYXVkaW9EYXRhQXJyLmxlbmd0aCkge1xyXG4gICAgICAgIGNvbnN0IGRhdGE6IEF1ZGlvRGF0YSB8IHVuZGVmaW5lZCA9IHRoaXMuYXVkaW9EYXRhQXJyLnNoaWZ0KCk7XHJcbiAgICAgICAgaWYgKGRhdGEpIHtcclxuICAgICAgICAgIHRoaXMud3JpdGVyLndyaXRlKGRhdGEpO1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJoYXZlIGF1ZGlvIGRhdGEgXCIsIHRoaXMuYXVkaW9FbGVtZW50LnBhdXNlZCwgXCIgICBcIiwgdGhpcy5hdWRpb0VsZW1lbnQuY3VycmVudFRpbWUpO1xyXG4gICAgICAgICAgaWYgKHRoaXMuYXVkaW9FbGVtZW50LnBhdXNlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmF1ZGlvRWxlbWVudC5wbGF5KCk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiYXVkaW8gcGxheVwiKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgbGV0IGJ1ZmZlcjogVWludDhBcnJheSB8IHVuZGVmaW5lZCA9IHRoaXMuZ2V0RnJhbWUoKTtcclxuICAgICAgaWYgKGJ1ZmZlcikge1xyXG4gICAgICAgIHRoaXMuZGVjb2RlQXVkaW9GcmFtZShidWZmZXIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgZ2V0RnJhbWUgKCk6IFVpbnQ4QXJyYXkgfCB1bmRlZmluZWQge1xyXG4gICAgaWYgKHRoaXMuYnVmZmVyQXJyYXkubGVuZ3RoKSB7XHJcbiAgICAgIGNvbnN0IGJ1ZmZlcjogQXJyYXlCdWZmZXIgfCB1bmRlZmluZWQgPSB0aGlzLmJ1ZmZlckFycmF5LnNoaWZ0KCk7XHJcbiAgICAgIGlmIChidWZmZXIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBkZWNvZGVBdWRpb0ZyYW1lIChidWZmZXI6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGxldCBmcmFtZUFycjogQWR0c0ZyYW1lW10gPSBbXTtcclxuICAgICAgc3dpdGNoICh0aGlzLmF1ZGlvRm9ybWF0VHlwZSkge1xyXG4gICAgICAgIGNhc2UgQXVkaW9Gb3JtYXRUeXBlLkFhY0FkdHM6XHJcbiAgICAgICAgICBmcmFtZUFyciA9IHRoaXMuYWFjQWR0c0Zvcm1hdC5wYXJzZShidWZmZXIpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY2FzZSBBdWRpb0Zvcm1hdFR5cGUuT3B1czpcclxuICAgICAgICAgIC8vIGZyYW1lQXJyID0gdGhpcy5vcHVzRm9ybWF0LnBhcnNlKGJ1ZmZlcik7XHJcbiAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChmcmFtZUFyci5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdGhpcy5pc1N1cHBvcnQoZnJhbWVBcnJbMF0pLnRoZW4oKHJlczogQXVkaW9EZWNvZGVyU3VwcG9ydCkgPT4ge1xyXG4gICAgICAgICAgY29uc29sZS5sb2coXCJzdXBwb3J0ZWRcIilcclxuICAgICAgICAgIGlmIChyZXMuc3VwcG9ydGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdChyZXMuY29uZmlnKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZUFyci5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuYXVkaW9EZWNvZGVyPy5kZWNvZGUobmV3IEVuY29kZWRBdWRpb0NodW5rKHtcclxuICAgICAgICAgICAgICAgIGRhdGE6IGZyYW1lQXJyW2ldLmRhdGEsXHJcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IDAsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcImtleVwiLFxyXG4gICAgICAgICAgICAgIH0pKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlamVjdCh7XHJcbiAgICAgICAgICAgICAgY29kZTogQXVkaW9FcnJvci5BdWRpb0RlY29kZXJfRGVjb2Rlcl9Ob3RTdXBwb3J0LFxyXG4gICAgICAgICAgICAgIG1lc3NhZ2U6IFwiY29kZWMgbm90IHN1cHBvcnRcIlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKFwibm90IHN1cHBvcnRlZFwiKVxyXG4gICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgfSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZWplY3Qoe1xyXG4gICAgICAgICAgY29kZTogLTEsXHJcbiAgICAgICAgICBtZXNzYWdlOiBcImF1ZGlvIGRhdGEgZXJyb3IsIG5vdCBhYWMtYWR0c1wiXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHByaXZhdGUgY3JlYXRlQXVkaW9EZWNvZGVyQ29uZmlnIChmcmFtZTogQWR0c0ZyYW1lIHwgT3B1c1BhY2thZ2UpOiBBdWRpb0RlY29kZXJDb25maWcgeyAvL0FkdHNGaXhlZEhlYWRlclxyXG4gICAgc3dpdGNoICh0aGlzLmF1ZGlvRm9ybWF0VHlwZSkge1xyXG4gICAgICBjYXNlIEF1ZGlvRm9ybWF0VHlwZS5BYWNBZHRzOlxyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUFhY0FkdHNEZWNvZGVyQ29uZmlnKGZyYW1lIGFzIEFkdHNGcmFtZSk7XHJcblxyXG4gICAgICBjYXNlIEF1ZGlvRm9ybWF0VHlwZS5PcHVzOlxyXG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZU9wdXNEZWNvZGVyQ29uZmlnKGZyYW1lIGFzIE9wdXNQYWNrYWdlKTtcclxuXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBjb2RlYzogJycsXHJcbiAgICAgIG51bWJlck9mQ2hhbm5lbHM6IDIsXHJcbiAgICAgIHNhbXBsZVJhdGU6IDBcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgY3JlYXRlQWFjQWR0c0RlY29kZXJDb25maWcgKGZyYW1lOiBBZHRzRnJhbWUpOiBBdWRpb0RlY29kZXJDb25maWcge1xyXG4gICAgbGV0IGNvbmZpZyA6IEF1ZGlvRGVjb2RlckNvbmZpZyA9IHtcclxuICAgICAgY29kZWM6ICcnLFxyXG4gICAgICAvLyBkZXNjcmlwdGlvbj86IEFsbG93U2hhcmVkQnVmZmVyU291cmNlIHwgdW5kZWZpbmVkO1xyXG4gICAgICBudW1iZXJPZkNoYW5uZWxzOiBmcmFtZS5oZWFkZXIuY2hhbm5lbF9jb25maWd1cmF0aW9uLFxyXG4gICAgICBzYW1wbGVSYXRlOiAwLFxyXG4gICAgfVxyXG4gICAgaWYgKFNhbXBsaW5nRnJlcXVlbmN5SW5kZXgubGVuZ3RoID4gZnJhbWUuaGVhZGVyLnNhbXBsaW5nX2ZyZXF1ZW5jeV9pbmRleCkge1xyXG4gICAgICBjb25maWcuc2FtcGxlUmF0ZSA9IFNhbXBsaW5nRnJlcXVlbmN5SW5kZXhbZnJhbWUuaGVhZGVyLnNhbXBsaW5nX2ZyZXF1ZW5jeV9pbmRleF07XHJcbiAgICB9XHJcbiAgICBpZiAoZnJhbWUuaGVhZGVyLnByb2ZpbGUgPT09IEFkdHNQcm9maWxlLkxvd0NvbXBsZXhpdHkpIHtcclxuICAgICAgY29uZmlnLmNvZGVjID0gJ21wNGEuNDAuMic7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY29uZmlnO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjcmVhdGVPcHVzRGVjb2RlckNvbmZpZyAoZnJhbWU6IE9wdXNQYWNrYWdlKTogQXVkaW9EZWNvZGVyQ29uZmlnIHtcclxuICAgIGxldCBjb25maWcgOiBBdWRpb0RlY29kZXJDb25maWcgPSB7XHJcbiAgICAgIGNvZGVjOiBcIkxhdmY1OC43Ni4xMDBcIixcclxuICAgICAgLy8gZGVzY3JpcHRpb24/OiBBbGxvd1NoYXJlZEJ1ZmZlclNvdXJjZSB8IHVuZGVmaW5lZDtcclxuICAgICAgbnVtYmVyT2ZDaGFubmVsczogMixcclxuICAgICAgc2FtcGxlUmF0ZTogNDgwMDAsXHJcbiAgICB9XHJcbiAgICAvLyBpZiAoU2FtcGxpbmdGcmVxdWVuY3lJbmRleC5sZW5ndGggPiBmcmFtZS5oZWFkZXIuc2FtcGxpbmdfZnJlcXVlbmN5X2luZGV4KSB7XHJcbiAgICAvLyAgIGNvbmZpZy5zYW1wbGVSYXRlID0gU2FtcGxpbmdGcmVxdWVuY3lJbmRleFtmcmFtZS5oZWFkZXIuc2FtcGxpbmdfZnJlcXVlbmN5X2luZGV4XTtcclxuICAgIC8vIH1cclxuICAgIC8vIGlmIChmcmFtZS5oZWFkZXIucHJvZmlsZSA9PT0gQWR0c1Byb2ZpbGUuTG93Q29tcGxleGl0eSkge1xyXG4gICAgLy8gICBjb25maWcuY29kZWMgPSAnbXA0YS40MC4yJztcclxuICAgIC8vIH1cclxuICAgIHJldHVybiBjb25maWc7XHJcbiAgfVxyXG59Il19

/***/ }),

/***/ "./src/audio/decoder/decoder.ts":
/*!**************************************!*\
  !*** ./src/audio/decoder/decoder.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Decoder = void 0;
var audiocontext_player_1 = __webpack_require__(/*! ../player/audiocontext-player */ "./src/audio/player/audiocontext-player.ts");
var Decoder = /** @class */ (function () {
    function Decoder() {
        this.audioFormatType = 0 /* AudioFormatType.Unknown */;
        this.flushTimer = 0;
        this.audioDataArr = [];
        this.bufferArray = [];
        this.player = new audiocontext_player_1.AudioContextPlayer();
    }
    Object.defineProperty(Decoder.prototype, "duration", {
        get: function () {
            return this.player.duration;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Decoder.prototype, "currentTime", {
        get: function () {
            return this.player.currentTime;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Decoder.prototype, "volume", {
        get: function () {
            return this.player.volume;
        },
        set: function (value) {
            this.player.volume = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Decoder.prototype, "muted", {
        get: function () {
            return this.player.muted;
        },
        set: function (value) {
            this.player.muted = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Decoder.prototype, "paused", {
        get: function () {
            return this.player.paused;
        },
        enumerable: false,
        configurable: true
    });
    Decoder.prototype.pause = function () {
        return this.player.pause();
    };
    Decoder.prototype.resume = function () {
        return this.player.resume();
    };
    Decoder.prototype.seek = function (value) {
        return this.player.seek(value);
    };
    Decoder.prototype.appendBuffer = function (buffer) {
        this.bufferArray.push(buffer);
    };
    Decoder.prototype.init = function (config) {
        var _this = this;
        this.audioDecoder = new AudioDecoder({
            output: function (frame) {
                _this.audioDataArr.push(frame);
            },
            error: function (error) {
                console.log("err:", error);
            }
        });
        this.audioDecoder.configure(config);
    };
    Decoder.prototype.startFlushTimer = function (restart) {
        var _this = this;
        if (restart) {
            this.stopFlushTimer();
        }
        else if (this.flushTimer !== 0) {
            return;
        }
        this.flushTimer = window.setInterval(function () {
            _this.onFlushTimer();
        }, 200);
    };
    Decoder.prototype.stopFlushTimer = function () {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = 0;
        }
    };
    Decoder.prototype.onFlushTimer = function () {
    };
    return Decoder;
}());
exports.Decoder = Decoder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb2Rlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRlY29kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscUVBQThFO0FBSzlFO0lBZUU7UUFYVSxvQkFBZSxtQ0FBNEM7UUFJM0QsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUV2QixpQkFBWSxHQUFnQixFQUFFLENBQUM7UUFFL0IsZ0JBQVcsR0FBa0IsRUFBRSxDQUFDO1FBSXhDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSx3Q0FBa0IsRUFBRSxDQUFDO0lBQ3pDLENBQUM7SUFFRCxzQkFBSSw2QkFBUTthQUFaO1lBQ0UsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztRQUM5QixDQUFDOzs7T0FBQTtJQUVELHNCQUFJLGdDQUFXO2FBQWY7WUFDRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1FBQ2pDLENBQUM7OztPQUFBO0lBRUQsc0JBQUksMkJBQU07YUFJVjtZQUNFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDNUIsQ0FBQzthQU5ELFVBQVcsS0FBYTtZQUN0QixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDN0IsQ0FBQzs7O09BQUE7SUFNRCxzQkFBSSwwQkFBSzthQUlUO1lBQ0UsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUMzQixDQUFDO2FBTkQsVUFBVyxLQUFjO1lBQ3ZCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUM1QixDQUFDOzs7T0FBQTtJQU1ELHNCQUFJLDJCQUFNO2FBQVY7WUFDRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQzVCLENBQUM7OztPQUFBO0lBRU0sdUJBQUssR0FBWjtRQUNFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRU0sd0JBQU0sR0FBYjtRQUNFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBRU0sc0JBQUksR0FBWCxVQUFhLEtBQWE7UUFDeEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBSU0sOEJBQVksR0FBbkIsVUFBcUIsTUFBbUI7UUFDdEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVTLHNCQUFJLEdBQWQsVUFBZ0IsTUFBMEI7UUFBMUMsaUJBVUM7UUFUQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksWUFBWSxDQUFDO1lBQ25DLE1BQU0sRUFBRSxVQUFDLEtBQWdCO2dCQUN2QixLQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNoQyxDQUFDO1lBQ0QsS0FBSyxFQUFFLFVBQUMsS0FBWTtnQkFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDN0IsQ0FBQztTQUNGLENBQUMsQ0FBQTtRQUNGLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFUyxpQ0FBZSxHQUF6QixVQUEyQixPQUFnQjtRQUEzQyxpQkFTQztRQVJDLElBQUksT0FBTyxFQUFFLENBQUM7WUFDWixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDeEIsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNqQyxPQUFPO1FBQ1QsQ0FBQztRQUNELElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztZQUNuQyxLQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7UUFDdEIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsQ0FBQztJQUVTLGdDQUFjLEdBQXhCO1FBQ0UsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEIsYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztRQUN0QixDQUFDO0lBQ0gsQ0FBQztJQUVTLDhCQUFZLEdBQXRCO0lBRUEsQ0FBQztJQUNILGNBQUM7QUFBRCxDQUFDLEFBbEdELElBa0dDO0FBbEdxQiwwQkFBTyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1ZGlvQ29udGV4dFBsYXllciwgQXVkaW9JbmZvIH0gZnJvbSBcIi4uL3BsYXllci9hdWRpb2NvbnRleHQtcGxheWVyXCI7XHJcbmltcG9ydCB7IEF1ZGlvRm9ybWF0VHlwZSB9IGZyb20gXCIuLi91dGlscy9hdWRpby1mb3JtYXQtdXRpbFwiO1xyXG5cclxuXHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRGVjb2RlciB7XHJcblxyXG4gIHByb3RlY3RlZCBwbGF5ZXI6IEF1ZGlvQ29udGV4dFBsYXllcjtcclxuXHJcbiAgcHJvdGVjdGVkIGF1ZGlvRm9ybWF0VHlwZTogQXVkaW9Gb3JtYXRUeXBlID0gQXVkaW9Gb3JtYXRUeXBlLlVua25vd247XHJcblxyXG4gIHByb3RlY3RlZCBhdWRpb0RlY29kZXI/OiBBdWRpb0RlY29kZXI7XHJcblxyXG4gIHByb3RlY3RlZCBmbHVzaFRpbWVyOiBudW1iZXIgPSAwO1xyXG5cclxuICBwcm90ZWN0ZWQgYXVkaW9EYXRhQXJyOiBBdWRpb0RhdGFbXSA9IFtdO1xyXG5cclxuICBwcm90ZWN0ZWQgYnVmZmVyQXJyYXk6IEFycmF5QnVmZmVyW10gPSBbXTtcclxuXHJcblxyXG4gIGNvbnN0cnVjdG9yICgpIHtcclxuICAgIHRoaXMucGxheWVyID0gbmV3IEF1ZGlvQ29udGV4dFBsYXllcigpO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGR1cmF0aW9uICgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucGxheWVyLmR1cmF0aW9uO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGN1cnJlbnRUaW1lICgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucGxheWVyLmN1cnJlbnRUaW1lO1xyXG4gIH1cclxuXHJcbiAgc2V0IHZvbHVtZSh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICB0aGlzLnBsYXllci52b2x1bWUgPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIGdldCB2b2x1bWUgKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXIudm9sdW1lO1xyXG4gIH1cclxuXHJcbiAgc2V0IG11dGVkICh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgdGhpcy5wbGF5ZXIubXV0ZWQgPSB2YWx1ZTtcclxuICB9XHJcblxyXG4gIGdldCBtdXRlZCAoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXIubXV0ZWQ7XHJcbiAgfVxyXG5cclxuICBnZXQgcGF1c2VkICgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLnBsYXllci5wYXVzZWQ7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGF1c2UgKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMucGxheWVyLnBhdXNlKCk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzdW1lICgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiB0aGlzLnBsYXllci5yZXN1bWUoKTtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZWVrICh2YWx1ZTogbnVtYmVyKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXIuc2Vlayh2YWx1ZSk7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYWJzdHJhY3QgcGxheSAodHlwZTogQXVkaW9Gb3JtYXRUeXBlKTogUHJvbWlzZTx2b2lkPjtcclxuXHJcbiAgcHVibGljIGFwcGVuZEJ1ZmZlciAoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IHZvaWQge1xyXG4gICAgdGhpcy5idWZmZXJBcnJheS5wdXNoKGJ1ZmZlcik7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgaW5pdCAoY29uZmlnOiBBdWRpb0RlY29kZXJDb25maWcpOiB2b2lkIHtcclxuICAgIHRoaXMuYXVkaW9EZWNvZGVyID0gbmV3IEF1ZGlvRGVjb2Rlcih7XHJcbiAgICAgIG91dHB1dDogKGZyYW1lOiBBdWRpb0RhdGEpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmF1ZGlvRGF0YUFyci5wdXNoKGZyYW1lKTtcclxuICAgICAgfSxcclxuICAgICAgZXJyb3I6IChlcnJvcjogRXJyb3IpOiB2b2lkID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImVycjpcIiwgZXJyb3IpO1xyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgdGhpcy5hdWRpb0RlY29kZXIuY29uZmlndXJlKGNvbmZpZyk7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgc3RhcnRGbHVzaFRpbWVyIChyZXN0YXJ0OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICBpZiAocmVzdGFydCkge1xyXG4gICAgICB0aGlzLnN0b3BGbHVzaFRpbWVyKCk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuZmx1c2hUaW1lciAhPT0gMCkge1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmZsdXNoVGltZXIgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICB0aGlzLm9uRmx1c2hUaW1lcigpO1xyXG4gICAgfSwgMjAwKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBzdG9wRmx1c2hUaW1lciAoKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5mbHVzaFRpbWVyKSB7XHJcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5mbHVzaFRpbWVyKTtcclxuICAgICAgdGhpcy5mbHVzaFRpbWVyID0gMDtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBvbkZsdXNoVGltZXIgKCk6IHZvaWQge1xyXG5cclxuICB9XHJcbn0iXX0=

/***/ }),

/***/ "./src/audio/decoder/wave-decoder.ts":
/*!*******************************************!*\
  !*** ./src/audio/decoder/wave-decoder.ts ***!
  \*******************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WaveDecoder = void 0;
var decoder_1 = __webpack_require__(/*! ./decoder */ "./src/audio/decoder/decoder.ts");
var WaveDecoder = /** @class */ (function (_super) {
    __extends(WaveDecoder, _super);
    function WaveDecoder() {
        return _super.call(this) || this;
    }
    WaveDecoder.prototype.play = function (type) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.bufferArray.length) {
                _this.audioFormatType = type;
                var buffer = _this.bufferArray.shift();
                if (buffer) {
                    _this.player.play(buffer).then(function () {
                        resolve();
                    }).catch(function (err) {
                        reject(err);
                    });
                }
            }
        });
    };
    return WaveDecoder;
}(decoder_1.Decoder));
exports.WaveDecoder = WaveDecoder;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F2ZS1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsid2F2ZS1kZWNvZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLHFDQUFvQztBQUdwQztJQUFpQywrQkFBTztJQUV0QztRQUNFLE9BQUEsTUFBSyxXQUFFLFNBQUM7SUFDVixDQUFDO0lBRU0sMEJBQUksR0FBWCxVQUFZLElBQXFCO1FBQWpDLGlCQWNDO1FBYkMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO1lBQ2pDLElBQUksS0FBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDNUIsS0FBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7Z0JBQzVCLElBQU0sTUFBTSxHQUE0QixLQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO2dCQUNqRSxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUNYLEtBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQzt3QkFDNUIsT0FBTyxFQUFFLENBQUM7b0JBQ1osQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUMsR0FBRzt3QkFDWCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2QsQ0FBQyxDQUFDLENBQUE7Z0JBQ0osQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFDSCxrQkFBQztBQUFELENBQUMsQUFyQkQsQ0FBaUMsaUJBQU8sR0FxQnZDO0FBckJZLGtDQUFXIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCB7IEF1ZGlvRm9ybWF0VHlwZSB9IGZyb20gXCIuLi91dGlscy9hdWRpby1mb3JtYXQtdXRpbFwiO1xyXG5pbXBvcnQgeyBEZWNvZGVyIH0gZnJvbSBcIi4vZGVjb2RlclwiO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBXYXZlRGVjb2RlciBleHRlbmRzIERlY29kZXIge1xyXG5cclxuICBjb25zdHJ1Y3RvciAoKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBsYXkodHlwZTogQXVkaW9Gb3JtYXRUeXBlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICBpZiAodGhpcy5idWZmZXJBcnJheS5sZW5ndGgpIHtcclxuICAgICAgICB0aGlzLmF1ZGlvRm9ybWF0VHlwZSA9IHR5cGU7XHJcbiAgICAgICAgY29uc3QgYnVmZmVyOiBBcnJheUJ1ZmZlciB8IHVuZGVmaW5lZCA9IHRoaXMuYnVmZmVyQXJyYXkuc2hpZnQoKTtcclxuICAgICAgICBpZiAoYnVmZmVyKSB7XHJcbiAgICAgICAgICB0aGlzLnBsYXllci5wbGF5KGJ1ZmZlcikudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcclxuICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbn0iXX0=

/***/ }),

/***/ "./src/audio/format/aac-adts.ts":
/*!**************************************!*\
  !*** ./src/audio/format/aac-adts.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AacAdtsFormat = void 0;
var AacAdtsFormat = /** @class */ (function () {
    function AacAdtsFormat() {
        this.adtsFixedHeader = {
            mpegId: -1 /* MPEGID.Unknown */,
            protection_absent: false,
            profile: 3 /* AdtsProfile.Reserved */,
            sampling_frequency_index: 0,
            channel_configuration: 0,
        };
        this.adtsVariableHeader = {
            copyright_identification_bit: false,
            copyright_identification_start: false,
            aac_frame_length: 0,
            adts_buffer_fullness: 0,
            number_of_raw_data_blocks_in_frame: 0,
        };
    }
    AacAdtsFormat.prototype.check = function (buffer) {
        this.parsekAdtsFixedHeader(buffer, 0);
        return this.adtsFixedHeader.mpegId !== -1 /* MPEGID.Unknown */;
    };
    AacAdtsFormat.prototype.parse = function (buffer) {
        var frameArr = [];
        var offset = 0;
        while (offset < buffer.byteLength) {
            this.parsekAdtsFixedHeader(buffer, offset);
            this.parseAdtsVariableHeader(buffer, offset);
            frameArr.push(this.createAdtsFrame(buffer, offset));
            offset += this.adtsVariableHeader.aac_frame_length;
            this.reset();
        }
        return frameArr;
    };
    AacAdtsFormat.prototype.parsekAdtsFixedHeader = function (buffer, offset) {
        if (buffer.byteLength >= offset + 7) {
            this.checkSyncWord(buffer, offset);
            this.checkProfile(buffer, offset);
            this.parseChannelConfiguration(buffer, offset);
        }
        return this.adtsFixedHeader.mpegId !== -1 /* MPEGID.Unknown */;
    };
    AacAdtsFormat.prototype.parseAdtsVariableHeader = function (buffer, offset) {
        this.adtsVariableHeader.copyright_identification_bit = (buffer[offset + 3] & 0x8) === 0 ? false : true;
        this.adtsVariableHeader.copyright_identification_start = (buffer[offset + 3] & 0x4) === 0 ? false : true;
        this.parseFrameLength(buffer, offset);
    };
    AacAdtsFormat.prototype.createAdtsFrame = function (buffer, offset) {
        var headerLength = this.adtsFixedHeader.protection_absent ? 7 : 9;
        return {
            header: this.adtsFixedHeader,
            data: buffer.slice(offset + headerLength, offset + this.adtsVariableHeader.aac_frame_length),
        };
    };
    AacAdtsFormat.prototype.reset = function () {
        this.adtsFixedHeader = {
            mpegId: -1 /* MPEGID.Unknown */,
            protection_absent: false,
            profile: 3 /* AdtsProfile.Reserved */,
            sampling_frequency_index: 0,
            channel_configuration: 0,
        };
        this.adtsVariableHeader = {
            copyright_identification_bit: false,
            copyright_identification_start: false,
            aac_frame_length: 0,
            adts_buffer_fullness: 0,
            number_of_raw_data_blocks_in_frame: 0,
        };
    };
    /**
     * 检测syncword
     * @param buffer
     * @returns
     */
    AacAdtsFormat.prototype.checkSyncWord = function (buffer, offset) {
        if (0xFF === buffer[offset] && (buffer[offset + 1] & 0xF0) === 0xF0) {
            this.adtsFixedHeader.protection_absent = buffer[offset + 1] & 1 ? true : false;
            // 不校验Layer
            var mpegId = buffer[offset + 1] & 8;
            if (8 === mpegId) {
                this.adtsFixedHeader.mpegId = 1 /* MPEGID.MPEG2 */;
                return;
            }
            else if (0 === mpegId) {
                this.adtsFixedHeader.mpegId = 0 /* MPEGID.MPEG4 */;
                return;
            }
        }
        this.adtsFixedHeader.mpegId = -1 /* MPEGID.Unknown */;
    };
    /**
     * 获取profieInfo
     * @param buffer
     */
    AacAdtsFormat.prototype.checkProfile = function (buffer, offset) {
        var profileNum = buffer[offset + 2] >> 6;
        switch (profileNum) {
            case 0 /* AdtsProfile.Main */:
                this.adtsFixedHeader.profile = 0 /* AdtsProfile.Main */;
                break;
            case 1 /* AdtsProfile.LowComplexity */:
                this.adtsFixedHeader.profile = 1 /* AdtsProfile.LowComplexity */;
                break;
            case 2 /* AdtsProfile.ScalableSamplingRate */:
                this.adtsFixedHeader.profile = 2 /* AdtsProfile.ScalableSamplingRate */;
                break;
            default:
                this.adtsFixedHeader.profile = 3 /* AdtsProfile.Reserved */;
                break;
        }
        this.adtsFixedHeader.sampling_frequency_index = ((buffer[offset + 2] - (profileNum << 6)) >> 2);
    };
    AacAdtsFormat.prototype.parseChannelConfiguration = function (buffer, offset) {
        this.adtsFixedHeader.channel_configuration = ((buffer[offset + 2] & 1) << 2) + (buffer[offset + 3] >> 6);
    };
    AacAdtsFormat.prototype.parseFrameLength = function (buffer, offset) {
        this.adtsVariableHeader.aac_frame_length = ((buffer[offset + 3] & 0x3) << 11) + (buffer[offset + 4] << 3) + (buffer[offset + 5] >> 5);
        this.adtsVariableHeader.adts_buffer_fullness = ((buffer[offset + 5] & 0x1f) << 5) + (buffer[offset + 6] >> 2);
        this.adtsVariableHeader.number_of_raw_data_blocks_in_frame = (buffer[offset + 6] & 0x3);
    };
    return AacAdtsFormat;
}());
exports.AacAdtsFormat = AacAdtsFormat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWFjLWFkdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhYWMtYWR0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFvQ0E7SUFrQkU7UUFoQlUsb0JBQWUsR0FBb0I7WUFDM0MsTUFBTSx5QkFBZ0I7WUFDdEIsaUJBQWlCLEVBQUUsS0FBSztZQUN4QixPQUFPLDhCQUFzQjtZQUM3Qix3QkFBd0IsRUFBRSxDQUFDO1lBQzNCLHFCQUFxQixFQUFFLENBQUM7U0FDekIsQ0FBQTtRQUVTLHVCQUFrQixHQUF1QjtZQUNqRCw0QkFBNEIsRUFBRSxLQUFLO1lBQ25DLDhCQUE4QixFQUFFLEtBQUs7WUFDckMsZ0JBQWdCLEVBQUUsQ0FBQztZQUNuQixvQkFBb0IsRUFBRSxDQUFDO1lBQ3ZCLGtDQUFrQyxFQUFFLENBQUM7U0FDdEMsQ0FBQTtJQUdELENBQUM7SUFFTSw2QkFBSyxHQUFaLFVBQWEsTUFBa0I7UUFDN0IsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0QyxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSw0QkFBbUIsQ0FBQztJQUN4RCxDQUFDO0lBRU0sNkJBQUssR0FBWixVQUFjLE1BQWtCO1FBQzlCLElBQUksUUFBUSxHQUFnQixFQUFFLENBQUM7UUFFL0IsSUFBSSxNQUFNLEdBQVcsQ0FBQyxDQUFDO1FBQ3ZCLE9BQU8sTUFBTSxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDN0MsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsZ0JB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LENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUUzRyxDQUFDO0lBRU8sd0NBQWdCLEdBQXhCLFVBQTBCLE1BQWtCLEVBQUUsTUFBYztRQUMxRCxJQUFJLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN0SSxJQUFJLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxrQ0FBa0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUNILG9CQUFDO0FBQUQsQ0FBQyxBQTNJRCxJQTJJQztBQTNJWSxzQ0FBYSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG9mZiB9IGZyb20gXCJwcm9jZXNzXCI7XHJcblxyXG5leHBvcnQgY29uc3QgZW51bSBNUEVHSUQge1xyXG4gIFVua25vd24gPSAtMSxcclxuICBNUEVHNCA9IDAsXHJcbiAgTVBFRzIgPSAxLFxyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZW51bSBBZHRzUHJvZmlsZSB7XHJcbiAgTWFpbiA9IDAsXHJcbiAgTG93Q29tcGxleGl0eSA9IDEsXHJcbiAgU2NhbGFibGVTYW1wbGluZ1JhdGUgPSAyLFxyXG4gIFJlc2VydmVkID0gMyxcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBBZHRzRml4ZWRIZWFkZXIge1xyXG4gIG1wZWdJZDogTVBFR0lEO1xyXG4gIHByb3RlY3Rpb25fYWJzZW50OiBib29sZWFuO1xyXG4gIHByb2ZpbGU6IEFkdHNQcm9maWxlO1xyXG4gIHNhbXBsaW5nX2ZyZXF1ZW5jeV9pbmRleDogbnVtYmVyO1xyXG4gIGNoYW5uZWxfY29uZmlndXJhdGlvbjogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgQWR0c1ZhcmlhYmxlSGVhZGVyIHtcclxuICBjb3B5cmlnaHRfaWRlbnRpZmljYXRpb25fYml0OiBib29sZWFuO1xyXG4gIGNvcHlyaWdodF9pZGVudGlmaWNhdGlvbl9zdGFydDogYm9vbGVhbjtcclxuICBhYWNfZnJhbWVfbGVuZ3RoOiBudW1iZXI7XHJcbiAgYWR0c19idWZmZXJfZnVsbG5lc3M6IG51bWJlcjtcclxuICBudW1iZXJfb2ZfcmF3X2RhdGFfYmxvY2tzX2luX2ZyYW1lOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQWR0c0ZyYW1lIHtcclxuICBoZWFkZXI6IEFkdHNGaXhlZEhlYWRlcjtcclxuICBkYXRhOiBVaW50OEFycmF5O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQWFjQWR0c0Zvcm1hdCB7XHJcblxyXG4gIHByb3RlY3RlZCBhZHRzRml4ZWRIZWFkZXI6IEFkdHNGaXhlZEhlYWRlciA9IHtcclxuICAgIG1wZWdJZDogTVBFR0lELlVua25vd24sXHJcbiAgICBwcm90ZWN0aW9uX2Fic2VudDogZmFsc2UsXHJcbiAgICBwcm9maWxlOiBBZHRzUHJvZmlsZS5SZXNlcnZlZCxcclxuICAgIHNhbXBsaW5nX2ZyZXF1ZW5jeV9pbmRleDogMCxcclxuICAgIGNoYW5uZWxfY29uZmlndXJhdGlvbjogMCxcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBhZHRzVmFyaWFibGVIZWFkZXI6IEFkdHNWYXJpYWJsZUhlYWRlciA9IHtcclxuICAgIGNvcHlyaWdodF9pZGVudGlmaWNhdGlvbl9iaXQ6IGZhbHNlLFxyXG4gICAgY29weXJpZ2h0X2lkZW50aWZpY2F0aW9uX3N0YXJ0OiBmYWxzZSxcclxuICAgIGFhY19mcmFtZV9sZW5ndGg6IDAsXHJcbiAgICBhZHRzX2J1ZmZlcl9mdWxsbmVzczogMCxcclxuICAgIG51bWJlcl9vZl9yYXdfZGF0YV9ibG9ja3NfaW5fZnJhbWU6IDAsXHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3RvciAoKSB7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY2hlY2soYnVmZmVyOiBVaW50OEFycmF5KTogYm9vbGVhbiB7XHJcbiAgICB0aGlzLnBhcnNla0FkdHNGaXhlZEhlYWRlcihidWZmZXIsIDApO1xyXG4gICAgcmV0dXJuIHRoaXMuYWR0c0ZpeGVkSGVhZGVyLm1wZWdJZCAhPT0gTVBFR0lELlVua25vd247XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcGFyc2UgKGJ1ZmZlcjogVWludDhBcnJheSk6IEFkdHNGcmFtZVtdIHtcclxuICAgIGxldCBmcmFtZUFycjogQWR0c0ZyYW1lW10gPSBbXTtcclxuXHJcbiAgICBsZXQgb2Zmc2V0OiBudW1iZXIgPSAwO1xyXG4gICAgd2hpbGUgKG9mZnNldCA8IGJ1ZmZlci5ieXRlTGVuZ3RoKSB7XHJcbiAgICAgIHRoaXMucGFyc2VrQWR0c0ZpeGVkSGVhZGVyKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgICAgdGhpcy5wYXJzZUFkdHNWYXJpYWJsZUhlYWRlcihidWZmZXIsIG9mZnNldCk7XHJcbiAgICAgIGZyYW1lQXJyLnB1c2godGhpcy5jcmVhdGVBZHRzRnJhbWUoYnVmZmVyLCBvZmZzZXQpKTtcclxuICAgICAgb2Zmc2V0ICs9IHRoaXMuYWR0c1ZhcmlhYmxlSGVhZGVyLmFhY19mcmFtZV9sZW5ndGg7XHJcbiAgICAgIHRoaXMucmVzZXQoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmcmFtZUFycjtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBwYXJzZWtBZHRzRml4ZWRIZWFkZXIgKGJ1ZmZlcjogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIGlmIChidWZmZXIuYnl0ZUxlbmd0aCA+PSBvZmZzZXQgKyA3KSB7XHJcbiAgICAgIHRoaXMuY2hlY2tTeW5jV29yZChidWZmZXIsIG9mZnNldCk7XHJcbiAgICAgIHRoaXMuY2hlY2tQcm9maWxlKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgICAgdGhpcy5wYXJzZUNoYW5uZWxDb25maWd1cmF0aW9uKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLmFkdHNGaXhlZEhlYWRlci5tcGVnSWQgIT09IE1QRUdJRC5Vbmtub3duO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHBhcnNlQWR0c1ZhcmlhYmxlSGVhZGVyIChidWZmZXI6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICB0aGlzLmFkdHNWYXJpYWJsZUhlYWRlci5jb3B5cmlnaHRfaWRlbnRpZmljYXRpb25fYml0ID0gKGJ1ZmZlcltvZmZzZXQgKyAzXSAmIDB4OCkgPT09IDAgPyBmYWxzZSA6IHRydWU7XHJcbiAgICB0aGlzLmFkdHNWYXJpYWJsZUhlYWRlci5jb3B5cmlnaHRfaWRlbnRpZmljYXRpb25fc3RhcnQgPSAoYnVmZmVyW29mZnNldCArIDNdICYgMHg0KSA9PT0gMCA/IGZhbHNlIDogdHJ1ZTtcclxuICAgIHRoaXMucGFyc2VGcmFtZUxlbmd0aChidWZmZXIsIG9mZnNldCk7XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgY3JlYXRlQWR0c0ZyYW1lIChidWZmZXI6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyKTogQWR0c0ZyYW1lIHtcclxuICAgIGNvbnN0IGhlYWRlckxlbmd0aDogbnVtYmVyID0gdGhpcy5hZHRzRml4ZWRIZWFkZXIucHJvdGVjdGlvbl9hYnNlbnQgPyA3IDogOTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGhlYWRlcjogdGhpcy5hZHRzRml4ZWRIZWFkZXIsXHJcbiAgICAgIGRhdGE6IGJ1ZmZlci5zbGljZShvZmZzZXQgKyBoZWFkZXJMZW5ndGgsIG9mZnNldCArIHRoaXMuYWR0c1ZhcmlhYmxlSGVhZGVyLmFhY19mcmFtZV9sZW5ndGgpLFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIHJlc2V0KCk6IHZvaWQge1xyXG4gICAgdGhpcy5hZHRzRml4ZWRIZWFkZXIgPSB7XHJcbiAgICAgIG1wZWdJZDogTVBFR0lELlVua25vd24sXHJcbiAgICAgIHByb3RlY3Rpb25fYWJzZW50OiBmYWxzZSxcclxuICAgICAgcHJvZmlsZTogQWR0c1Byb2ZpbGUuUmVzZXJ2ZWQsXHJcbiAgICAgIHNhbXBsaW5nX2ZyZXF1ZW5jeV9pbmRleDogMCxcclxuICAgICAgY2hhbm5lbF9jb25maWd1cmF0aW9uOiAwLFxyXG4gICAgfTtcclxuICAgIHRoaXMuYWR0c1ZhcmlhYmxlSGVhZGVyID0ge1xyXG4gICAgICBjb3B5cmlnaHRfaWRlbnRpZmljYXRpb25fYml0OiBmYWxzZSxcclxuICAgICAgY29weXJpZ2h0X2lkZW50aWZpY2F0aW9uX3N0YXJ0OiBmYWxzZSxcclxuICAgICAgYWFjX2ZyYW1lX2xlbmd0aDogMCxcclxuICAgICAgYWR0c19idWZmZXJfZnVsbG5lc3M6IDAsXHJcbiAgICAgIG51bWJlcl9vZl9yYXdfZGF0YV9ibG9ja3NfaW5fZnJhbWU6IDAsXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDmo4DmtYtzeW5jd29yZFxyXG4gICAqIEBwYXJhbSBidWZmZXIgXHJcbiAgICogQHJldHVybnMgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjaGVja1N5bmNXb3JkIChidWZmZXI6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBpZiAoMHhGRiA9PT0gYnVmZmVyW29mZnNldF0gJiYgKGJ1ZmZlcltvZmZzZXQgKyAxXSAmIDB4RjApID09PSAweEYwKSB7XHJcbiAgICAgIHRoaXMuYWR0c0ZpeGVkSGVhZGVyLnByb3RlY3Rpb25fYWJzZW50ID0gYnVmZmVyW29mZnNldCArIDFdICYgMSA/IHRydWUgOiBmYWxzZTtcclxuICAgICAgLy8g5LiN5qCh6aqMTGF5ZXJcclxuICAgICAgbGV0IG1wZWdJZDogbnVtYmVyID0gYnVmZmVyW29mZnNldCArIDFdICYgODtcclxuICAgICAgaWYgKDggPT09IG1wZWdJZCkge1xyXG4gICAgICAgIHRoaXMuYWR0c0ZpeGVkSGVhZGVyLm1wZWdJZCA9IE1QRUdJRC5NUEVHMjtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH0gZWxzZSBpZiAoMCA9PT0gbXBlZ0lkKSB7XHJcbiAgICAgICAgdGhpcy5hZHRzRml4ZWRIZWFkZXIubXBlZ0lkID0gTVBFR0lELk1QRUc0O1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5hZHRzRml4ZWRIZWFkZXIubXBlZ0lkID0gTVBFR0lELlVua25vd247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiDojrflj5Zwcm9maWVJbmZvXHJcbiAgICogQHBhcmFtIGJ1ZmZlciBcclxuICAgKi9cclxuICBwcml2YXRlIGNoZWNrUHJvZmlsZShidWZmZXI6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBsZXQgcHJvZmlsZU51bTogbnVtYmVyID0gYnVmZmVyW29mZnNldCArIDJdID4+IDY7XHJcbiAgICBzd2l0Y2ggKHByb2ZpbGVOdW0pIHtcclxuICAgICAgY2FzZSBBZHRzUHJvZmlsZS5NYWluOlxyXG4gICAgICAgIHRoaXMuYWR0c0ZpeGVkSGVhZGVyLnByb2ZpbGUgPSBBZHRzUHJvZmlsZS5NYWluO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBBZHRzUHJvZmlsZS5Mb3dDb21wbGV4aXR5OlxyXG4gICAgICAgIHRoaXMuYWR0c0ZpeGVkSGVhZGVyLnByb2ZpbGUgPSBBZHRzUHJvZmlsZS5Mb3dDb21wbGV4aXR5O1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSBBZHRzUHJvZmlsZS5TY2FsYWJsZVNhbXBsaW5nUmF0ZTpcclxuICAgICAgICB0aGlzLmFkdHNGaXhlZEhlYWRlci5wcm9maWxlID0gQWR0c1Byb2ZpbGUuU2NhbGFibGVTYW1wbGluZ1JhdGU7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHRoaXMuYWR0c0ZpeGVkSGVhZGVyLnByb2ZpbGUgPSBBZHRzUHJvZmlsZS5SZXNlcnZlZDtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hZHRzRml4ZWRIZWFkZXIuc2FtcGxpbmdfZnJlcXVlbmN5X2luZGV4ID0gKChidWZmZXJbb2Zmc2V0ICsgMl0gLSAocHJvZmlsZU51bSA8PCA2KSkgPj4gMik7IFxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBwYXJzZUNoYW5uZWxDb25maWd1cmF0aW9uKGJ1ZmZlcjogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHRoaXMuYWR0c0ZpeGVkSGVhZGVyLmNoYW5uZWxfY29uZmlndXJhdGlvbiA9ICgoYnVmZmVyW29mZnNldCArIDJdICYgMSkgPDwgMikgKyAoYnVmZmVyW29mZnNldCArIDNdID4+IDYpO1xyXG4gICAgXHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHBhcnNlRnJhbWVMZW5ndGggKGJ1ZmZlcjogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIHRoaXMuYWR0c1ZhcmlhYmxlSGVhZGVyLmFhY19mcmFtZV9sZW5ndGggPSAoKGJ1ZmZlcltvZmZzZXQgKyAzXSAmIDB4MykgPDwgMTEpICsgKGJ1ZmZlcltvZmZzZXQgKyA0XSA8PCAzKSArIChidWZmZXJbb2Zmc2V0ICsgNV0gPj4gNSk7XHJcbiAgICB0aGlzLmFkdHNWYXJpYWJsZUhlYWRlci5hZHRzX2J1ZmZlcl9mdWxsbmVzcyA9ICgoYnVmZmVyW29mZnNldCArIDVdICYgMHgxZikgPDwgNSkgKyAoYnVmZmVyW29mZnNldCArIDZdID4+IDIpO1xyXG4gICAgdGhpcy5hZHRzVmFyaWFibGVIZWFkZXIubnVtYmVyX29mX3Jhd19kYXRhX2Jsb2Nrc19pbl9mcmFtZSA9IChidWZmZXJbb2Zmc2V0ICsgNl0gJiAweDMpO1xyXG4gIH1cclxufSJdfQ==

/***/ }),

/***/ "./src/audio/format/mp3.ts":
/*!*********************************!*\
  !*** ./src/audio/format/mp3.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Mp3Format = void 0;
/**
 * 解析Mp3格式
 * @doc https://wenku.baidu.com/view/63c13824eb7101f69e3143323968011ca300f7f9.html?_wkts_=1707874112105&bdQuery=mp3%E6%A0%BC%E5%BC%8F%E8%A7%A3%E6%9E%90
 */
var Mp3Format = /** @class */ (function () {
    function Mp3Format() {
    }
    Mp3Format.prototype.check = function (buffer) {
        return this.checkID3V2(buffer) && this.checkAudioData(buffer) && this.checkID3V1(buffer);
    };
    Mp3Format.prototype.checkID3V2 = function (buffer) {
        return false;
    };
    Mp3Format.prototype.checkAudioData = function (buffer) {
        return false;
    };
    Mp3Format.prototype.checkID3V1 = function (buffer) {
        return false;
    };
    return Mp3Format;
}());
exports.Mp3Format = Mp3Format;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXAzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibXAzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBOzs7R0FHRztBQUNIO0lBRUU7SUFFQSxDQUFDO0lBRU0seUJBQUssR0FBWixVQUFjLE1BQWtCO1FBQzlCLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDM0YsQ0FBQztJQUVTLDhCQUFVLEdBQXBCLFVBQXNCLE1BQWtCO1FBQ3RDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVTLGtDQUFjLEdBQXhCLFVBQTBCLE1BQWtCO1FBQzFDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVTLDhCQUFVLEdBQXBCLFVBQXNCLE1BQWtCO1FBQ3RDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQXJCRCxJQXFCQztBQXJCWSw4QkFBUyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG4vKipcclxuICog6Kej5p6QTXAz5qC85byPXHJcbiAqIEBkb2MgaHR0cHM6Ly93ZW5rdS5iYWlkdS5jb20vdmlldy82M2MxMzgyNGViNzEwMWY2OWUzMTQzMzIzOTY4MDExY2EzMDBmN2Y5Lmh0bWw/X3drdHNfPTE3MDc4NzQxMTIxMDUmYmRRdWVyeT1tcDMlRTYlQTAlQkMlRTUlQkMlOEYlRTglQTclQTMlRTYlOUUlOTBcclxuICovXHJcbmV4cG9ydCBjbGFzcyBNcDNGb3JtYXQge1xyXG4gIFxyXG4gIGNvbnN0cnVjdG9yICgpIHtcclxuXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY2hlY2sgKGJ1ZmZlcjogVWludDhBcnJheSk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuY2hlY2tJRDNWMihidWZmZXIpICYmIHRoaXMuY2hlY2tBdWRpb0RhdGEoYnVmZmVyKSAmJiB0aGlzLmNoZWNrSUQzVjEoYnVmZmVyKTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBjaGVja0lEM1YyIChidWZmZXI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9IFxyXG5cclxuICBwcm90ZWN0ZWQgY2hlY2tBdWRpb0RhdGEgKGJ1ZmZlcjogVWludDhBcnJheSk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGNoZWNrSUQzVjEgKGJ1ZmZlcjogVWludDhBcnJheSk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufSAiXX0=

/***/ }),

/***/ "./src/audio/format/opus.ts":
/*!**********************************!*\
  !*** ./src/audio/format/opus.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpusPackage = exports.OggOpusFormat = void 0;
/**
 * 解析OPUS格式
 * @doc https://juejin.cn/post/6844904016254599175
 */
var OggOpusFormat = /** @class */ (function () {
    function OggOpusFormat() {
        this.packageArr = [];
        // protected parsePackage (buffer: Uint8Array): void {
        //   console.log("parsePackage: ", buffer.byteLength);
        // }
    }
    OggOpusFormat.prototype.check = function (buffer) {
        return this.checkOggHead(buffer, 0);
    };
    OggOpusFormat.prototype.parse = function (buffer) {
        var offset = 0;
        console.log("length:", buffer.byteLength);
        var headerType = -1;
        var packageVersion = -1;
        while (offset < buffer.byteLength) {
            // this.parsekAdtsFixedHeader(buffer, offset);
            if (this.checkOggHead(buffer, offset)) {
                packageVersion = this.getVersion(buffer, offset);
                headerType = this.getHeaderType(buffer, offset);
                this.getGranulePosition(buffer, offset);
                this.getSerialNumber(buffer, offset);
                this.getPageSeguenceNumber(buffer, offset);
                this.getCRCCbecksum(buffer, offset);
                var numberPageSegments = this.getNumberPageSegments(buffer, offset);
                var segmentTable = this.getSegmentTable(buffer, offset, numberPageSegments);
                var end = offset + 27 + numberPageSegments + segmentTable;
                if (end <= buffer.byteLength) {
                    this.packageArr.push(new OpusPackage(buffer.slice(offset + 27 + numberPageSegments, end)));
                }
                offset = end;
            }
            else {
                console.error('data error');
                break;
            }
            // this.reset();
        }
        return this.packageArr;
    };
    OggOpusFormat.prototype.checkOggHead = function (buffer, offset) {
        return buffer.byteLength > 4 && 0x4F === buffer[offset] && 0x67 === buffer[offset + 1] && 0x67 === buffer[offset + 2] && 0x53 === buffer[offset + 3];
    };
    OggOpusFormat.prototype.getVersion = function (buffer, offset) {
        return buffer[offset + 4];
    };
    OggOpusFormat.prototype.getHeaderType = function (buffer, offset) {
        if (buffer.length >= offset + 5) {
            return buffer[offset + 5];
        }
        return -1;
    };
    OggOpusFormat.prototype.getGranulePosition = function (buffer, offset) {
        // 8Byte
        // offset+6 ~ offset+13
    };
    OggOpusFormat.prototype.getSerialNumber = function (buffer, offset) {
        // 4Byte
        // offset+14 ~ offset+17
    };
    OggOpusFormat.prototype.getPageSeguenceNumber = function (buffer, offset) {
        // 4Byte
        // offset+18 ~ offset+21
    };
    OggOpusFormat.prototype.getCRCCbecksum = function (buffer, offset) {
        // 4Byte
        // offset+22 ~ offset+25
    };
    OggOpusFormat.prototype.getNumberPageSegments = function (buffer, offset) {
        // 1Byte
        return buffer[offset + 26];
    };
    OggOpusFormat.prototype.getSegmentTable = function (buffer, offset, numberPageSegments) {
        var count = 0;
        for (var i = 0; i < numberPageSegments; ++i) {
            count += buffer[offset + i + 27];
        }
        return count;
    };
    return OggOpusFormat;
}());
exports.OggOpusFormat = OggOpusFormat;
var OpusPackage = /** @class */ (function () {
    function OpusPackage(buffer) {
        this.head = {
            version: 0,
            channelCount: 0,
            preSkip: 0,
            inputSampleRate: 0,
            outputGain: 0,
            channelMappingFamily: 0,
            channelMappingTable: 0,
        };
        this.comment = {
            vendorStringLength: 0,
            vendorString: "",
            userCommentListLength: 0,
            comentArr: [],
        };
        if (this.checkOpus(buffer)) {
            if (this.checkHead(buffer)) {
                this.parseOpusHeadPackage(buffer);
            }
            else if (this.checkTags(buffer)) {
                this.parseCommentHead(buffer);
            }
        }
    }
    OpusPackage.prototype.checkOpus = function (buffer) {
        return 0x4F === buffer[0] && 0x70 === buffer[1] && 0x75 === buffer[2] && 0x73 === buffer[3];
    };
    OpusPackage.prototype.checkHead = function (buffer) {
        return 0x48 === buffer[4] && 0x65 === buffer[5] && 0x61 === buffer[6] && 0x64 === buffer[7];
    };
    OpusPackage.prototype.checkTags = function (buffer) {
        return 0x54 === buffer[4] && 0x61 === buffer[5] && 0x67 === buffer[6] && 0x73 === buffer[7];
    };
    OpusPackage.prototype.parseOpusHeadPackage = function (buffer) {
        this.head.version = buffer[8];
        this.head.channelCount = buffer[9];
        this.head.preSkip = (buffer[10] << 8) + buffer[11];
        this.head.inputSampleRate = buffer[12] + (buffer[13] << 8) + (buffer[14] << 16) + (buffer[15] << 24);
        this.head.outputGain = 0;
        this.head.channelMappingFamily = buffer[18];
        if (this.head.channelMappingFamily !== 0) {
            // get Channel Mapping Table 
        }
        console.log(buffer, " version:", this.head);
    };
    OpusPackage.prototype.parseCommentHead = function (buffer) {
        var offset = 8;
        this.comment.vendorStringLength = buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16) + (buffer[offset + 3] << 24);
        offset += 4;
        this.comment.vendorString = this.uint8ArrayToString(buffer, offset, this.comment.vendorStringLength); //new TextDecoder().decode(buffer.slice(offset, offset + this.comment.vendorStringLength));
        offset += this.comment.vendorStringLength;
        this.comment.userCommentListLength = buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16) + (buffer[offset + 3] << 24);
        offset += 4;
        this.comment.comentArr.splice(0);
        for (var i = 0; i < this.comment.userCommentListLength; ++i) {
            var userCommentLength = buffer[offset] + (buffer[offset + 1] << 8) + (buffer[offset + 2] << 16) + (buffer[offset + 3] << 24);
            offset += 4;
            this.comment.comentArr.push(this.uint8ArrayToString(buffer, offset, userCommentLength));
            offset += userCommentLength;
        }
        console.log(buffer, "comment:", this.comment, "    offset:", offset);
    };
    OpusPackage.prototype.uint8ArrayToString = function (buffer, offset, length) {
        console.log("offset:", offset, "   length:", length);
        if (offset + length <= buffer.length) {
            return new TextDecoder().decode(buffer.slice(offset, offset + length));
        }
        return "";
    };
    return OpusPackage;
}());
exports.OpusPackage = OpusPackage;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B1cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wdXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0E7OztHQUdHO0FBQ0g7SUFBQTtRQUVZLGVBQVUsR0FBa0IsRUFBRSxDQUFDO1FBcUZ6QyxzREFBc0Q7UUFDdEQsc0RBQXNEO1FBQ3RELElBQUk7SUFFTixDQUFDO0lBdkZRLDZCQUFLLEdBQVosVUFBYyxNQUFrQjtRQUM5QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFTSw2QkFBSyxHQUFaLFVBQWMsTUFBa0I7UUFDOUIsSUFBSSxNQUFNLEdBQVcsQ0FBQyxDQUFDO1FBQ3ZCLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxQyxJQUFJLFVBQVUsR0FBVyxDQUFDLENBQUMsQ0FBQztRQUM1QixJQUFJLGNBQWMsR0FBVyxDQUFDLENBQUMsQ0FBQztRQUNoQyxPQUFPLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEMsOENBQThDO1lBQzlDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQztnQkFDdEMsY0FBYyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNqRCxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUMzQyxJQUFJLENBQUMsY0FB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RyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3pFLENBQUM7UUFDRCxPQUFPLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFDSCxrQkFBQztBQUFELENBQUMsQUFqRkQsSUFpRkM7QUFqRlksa0NBQVciLCJzb3VyY2VzQ29udGVudCI6WyJcclxuLyoqXHJcbiAqIOino+aekE9QVVPmoLzlvI9cclxuICogQGRvYyBodHRwczovL2p1ZWppbi5jbi9wb3N0LzY4NDQ5MDQwMTYyNTQ1OTkxNzVcclxuICovXHJcbmV4cG9ydCBjbGFzcyBPZ2dPcHVzRm9ybWF0IHtcclxuXHJcbiAgcHJvdGVjdGVkIHBhY2thZ2VBcnI6IE9wdXNQYWNrYWdlW10gPSBbXTtcclxuXHJcbiAgcHVibGljIGNoZWNrIChidWZmZXI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmNoZWNrT2dnSGVhZChidWZmZXIsIDApO1xyXG4gIH0gXHJcblxyXG4gIHB1YmxpYyBwYXJzZSAoYnVmZmVyOiBVaW50OEFycmF5KTogYW55W10ge1xyXG4gICAgbGV0IG9mZnNldDogbnVtYmVyID0gMDtcclxuICAgIGNvbnNvbGUubG9nKFwibGVuZ3RoOlwiLCBidWZmZXIuYnl0ZUxlbmd0aCk7XHJcbiAgICBsZXQgaGVhZGVyVHlwZTogbnVtYmVyID0gLTE7XHJcbiAgICBsZXQgcGFja2FnZVZlcnNpb246IG51bWJlciA9IC0xO1xyXG4gICAgd2hpbGUgKG9mZnNldCA8IGJ1ZmZlci5ieXRlTGVuZ3RoKSB7XHJcbiAgICAgIC8vIHRoaXMucGFyc2VrQWR0c0ZpeGVkSGVhZGVyKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgICAgaWYgKHRoaXMuY2hlY2tPZ2dIZWFkKGJ1ZmZlciwgb2Zmc2V0KSkge1xyXG4gICAgICAgIHBhY2thZ2VWZXJzaW9uID0gdGhpcy5nZXRWZXJzaW9uKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgICAgICBoZWFkZXJUeXBlID0gdGhpcy5nZXRIZWFkZXJUeXBlKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgICAgICB0aGlzLmdldEdyYW51bGVQb3NpdGlvbihidWZmZXIsIG9mZnNldCk7XHJcbiAgICAgICAgdGhpcy5nZXRTZXJpYWxOdW1iZXIoYnVmZmVyLCBvZmZzZXQpO1xyXG4gICAgICAgIHRoaXMuZ2V0UGFnZVNlZ3VlbmNlTnVtYmVyKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgICAgICB0aGlzLmdldENSQ0NiZWNrc3VtKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgICAgICBjb25zdCBudW1iZXJQYWdlU2VnbWVudHM6IG51bWJlciA9IHRoaXMuZ2V0TnVtYmVyUGFnZVNlZ21lbnRzKGJ1ZmZlciwgb2Zmc2V0KTtcclxuICAgICAgICBjb25zdCBzZWdtZW50VGFibGU6IG51bWJlciA9IHRoaXMuZ2V0U2VnbWVudFRhYmxlKGJ1ZmZlciwgb2Zmc2V0LCBudW1iZXJQYWdlU2VnbWVudHMpO1xyXG5cclxuICAgICAgICBsZXQgZW5kOiBudW1iZXIgPSBvZmZzZXQgKyAyNyArIG51bWJlclBhZ2VTZWdtZW50cyArIHNlZ21lbnRUYWJsZTtcclxuICAgICAgICBpZiAoZW5kIDw9IGJ1ZmZlci5ieXRlTGVuZ3RoKSB7XHJcbiAgICAgICAgICB0aGlzLnBhY2thZ2VBcnIucHVzaChuZXcgT3B1c1BhY2thZ2UoYnVmZmVyLnNsaWNlKG9mZnNldCsyNytudW1iZXJQYWdlU2VnbWVudHMsIGVuZCkpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBvZmZzZXQgPSBlbmQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignZGF0YSBlcnJvcicpXHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgLy8gdGhpcy5yZXNldCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMucGFja2FnZUFycjtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBjaGVja09nZ0hlYWQgKGJ1ZmZlcjogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIHJldHVybiBidWZmZXIuYnl0ZUxlbmd0aCA+IDQgJiYgMHg0RiA9PT0gYnVmZmVyW29mZnNldF0gJiYgMHg2NyA9PT0gYnVmZmVyW29mZnNldCArIDFdICYmIDB4NjcgPT09IGJ1ZmZlcltvZmZzZXQgKyAyXSAmJiAweDUzID09PSBidWZmZXJbb2Zmc2V0ICsgM107XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgZ2V0VmVyc2lvbiAoYnVmZmVyOiBVaW50OEFycmF5LCBvZmZzZXQ6IG51bWJlcik6IG51bWJlciB7XHJcbiAgICByZXR1cm4gYnVmZmVyW29mZnNldCs0XTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBnZXRIZWFkZXJUeXBlIChidWZmZXI6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIGlmIChidWZmZXIubGVuZ3RoID49IG9mZnNldCArIDUpIHtcclxuICAgICAgcmV0dXJuIGJ1ZmZlcltvZmZzZXQgKyA1XTtcclxuICAgIH1cclxuICAgIHJldHVybiAtMTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBnZXRHcmFudWxlUG9zaXRpb24gKGJ1ZmZlcjogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgIC8vIDhCeXRlXHJcbiAgICAvLyBvZmZzZXQrNiB+IG9mZnNldCsxM1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGdldFNlcmlhbE51bWJlciAoYnVmZmVyOiBVaW50OEFycmF5LCBvZmZzZXQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgLy8gNEJ5dGVcclxuICAgIC8vIG9mZnNldCsxNCB+IG9mZnNldCsxN1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGdldFBhZ2VTZWd1ZW5jZU51bWJlciAoYnVmZmVyOiBVaW50OEFycmF5LCBvZmZzZXQ6IG51bWJlcik6IHZvaWQge1xyXG4gICAgLy8gNEJ5dGVcclxuICAgIC8vIG9mZnNldCsxOCB+IG9mZnNldCsyMVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGdldENSQ0NiZWNrc3VtIChidWZmZXI6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAvLyA0Qnl0ZVxyXG4gICAgLy8gb2Zmc2V0KzIyIH4gb2Zmc2V0KzI1XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgZ2V0TnVtYmVyUGFnZVNlZ21lbnRzIChidWZmZXI6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIC8vIDFCeXRlXHJcbiAgICByZXR1cm4gYnVmZmVyW29mZnNldCArIDI2XTtcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBnZXRTZWdtZW50VGFibGUgKGJ1ZmZlcjogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIsIG51bWJlclBhZ2VTZWdtZW50czogbnVtYmVyKTogbnVtYmVyIHtcclxuICAgIGxldCBjb3VudDogbnVtYmVyID0gMDtcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtYmVyUGFnZVNlZ21lbnRzOyArK2kpIHtcclxuICAgICAgY291bnQgKz0gYnVmZmVyW29mZnNldCArIGkgKyAyN107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY291bnQ7XHJcbiAgfVxyXG5cclxuICAvLyBwcm90ZWN0ZWQgcGFyc2VQYWNrYWdlIChidWZmZXI6IFVpbnQ4QXJyYXkpOiB2b2lkIHtcclxuICAvLyAgIGNvbnNvbGUubG9nKFwicGFyc2VQYWNrYWdlOiBcIiwgYnVmZmVyLmJ5dGVMZW5ndGgpO1xyXG4gIC8vIH1cclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE9wdXNIZWFkIHtcclxuICB2ZXJzaW9uOiBudW1iZXI7XHJcbiAgY2hhbm5lbENvdW50OiBudW1iZXI7XHJcbiAgcHJlU2tpcDogbnVtYmVyO1xyXG4gIGlucHV0U2FtcGxlUmF0ZTogbnVtYmVyO1xyXG4gIG91dHB1dEdhaW46IG51bWJlcjtcclxuICBjaGFubmVsTWFwcGluZ0ZhbWlseTogbnVtYmVyO1xyXG4gIGNoYW5uZWxNYXBwaW5nVGFibGU6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBPcHVzQ29tbWVudEhlYWQge1xyXG4gIHZlbmRvclN0cmluZ0xlbmd0aDogbnVtYmVyO1xyXG4gIHZlbmRvclN0cmluZzogc3RyaW5nO1xyXG4gIHVzZXJDb21tZW50TGlzdExlbmd0aDogbnVtYmVyO1xyXG4gIGNvbWVudEFycjogc3RyaW5nW107XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBPcHVzUGFja2FnZSB7XHJcblxyXG4gIHByb3RlY3RlZCBoZWFkOiBPcHVzSGVhZCA9IHtcclxuICAgIHZlcnNpb246IDAsXHJcbiAgICBjaGFubmVsQ291bnQ6IDAsXHJcbiAgICBwcmVTa2lwOiAwLFxyXG4gICAgaW5wdXRTYW1wbGVSYXRlOiAwLFxyXG4gICAgb3V0cHV0R2FpbjogMCxcclxuICAgIGNoYW5uZWxNYXBwaW5nRmFtaWx5OiAwLFxyXG4gICAgY2hhbm5lbE1hcHBpbmdUYWJsZTogMCxcclxuICB9XHJcblxyXG4gIHByb3RlY3RlZCBjb21tZW50OiBPcHVzQ29tbWVudEhlYWQgPSB7XHJcbiAgICB2ZW5kb3JTdHJpbmdMZW5ndGg6IDAsXHJcbiAgICB2ZW5kb3JTdHJpbmc6IFwiXCIsXHJcbiAgICB1c2VyQ29tbWVudExpc3RMZW5ndGg6IDAsXHJcbiAgICBjb21lbnRBcnI6IFtdLFxyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IgKGJ1ZmZlcjogVWludDhBcnJheSkge1xyXG4gICAgaWYgKHRoaXMuY2hlY2tPcHVzKGJ1ZmZlcikpIHtcclxuICAgICAgaWYgKHRoaXMuY2hlY2tIZWFkKGJ1ZmZlcikpIHtcclxuICAgICAgICB0aGlzLnBhcnNlT3B1c0hlYWRQYWNrYWdlKGJ1ZmZlcik7XHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5jaGVja1RhZ3MoYnVmZmVyKSkge1xyXG4gICAgICAgIHRoaXMucGFyc2VDb21tZW50SGVhZChidWZmZXIpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgY2hlY2tPcHVzIChidWZmZXI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAweDRGID09PSBidWZmZXJbMF0gJiYgMHg3MCA9PT0gYnVmZmVyWzFdICYmIDB4NzUgPT09IGJ1ZmZlclsyXSAmJiAweDczID09PSBidWZmZXJbM107XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgY2hlY2tIZWFkIChidWZmZXI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAweDQ4ID09PSBidWZmZXJbNF0gJiYgMHg2NSA9PT0gYnVmZmVyWzVdICYmIDB4NjEgPT09IGJ1ZmZlcls2XSAmJiAweDY0ID09PSBidWZmZXJbN107XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgY2hlY2tUYWdzIChidWZmZXI6IFVpbnQ4QXJyYXkpOiBib29sZWFuIHtcclxuICAgIHJldHVybiAweDU0ID09PSBidWZmZXJbNF0gJiYgMHg2MSA9PT0gYnVmZmVyWzVdICYmIDB4NjcgPT09IGJ1ZmZlcls2XSAmJiAweDczID09PSBidWZmZXJbN107XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHBhcnNlT3B1c0hlYWRQYWNrYWdlIChidWZmZXI6IFVpbnQ4QXJyYXkpOiB2b2lkIHtcclxuICAgIHRoaXMuaGVhZC52ZXJzaW9uID0gYnVmZmVyWzhdO1xyXG4gICAgdGhpcy5oZWFkLmNoYW5uZWxDb3VudCA9IGJ1ZmZlcls5XTtcclxuXHJcbiAgICB0aGlzLmhlYWQucHJlU2tpcCA9IChidWZmZXJbMTBdIDw8IDgpICsgYnVmZmVyWzExXTtcclxuICAgIHRoaXMuaGVhZC5pbnB1dFNhbXBsZVJhdGUgPSBidWZmZXJbMTJdICsgKGJ1ZmZlclsxM10gPDwgOCkgKyAoYnVmZmVyWzE0XSA8PCAxNikgKyAoYnVmZmVyWzE1XSA8PCAyNCk7XHJcbiAgICB0aGlzLmhlYWQub3V0cHV0R2FpbiA9IDA7XHJcbiAgICB0aGlzLmhlYWQuY2hhbm5lbE1hcHBpbmdGYW1pbHkgPSBidWZmZXJbMThdO1xyXG4gICAgaWYgKHRoaXMuaGVhZC5jaGFubmVsTWFwcGluZ0ZhbWlseSAhPT0gMCkge1xyXG4gICAgICAvLyBnZXQgQ2hhbm5lbCBNYXBwaW5nIFRhYmxlIFxyXG4gICAgfVxyXG4gICAgY29uc29sZS5sb2coYnVmZmVyLCBcIiB2ZXJzaW9uOlwiLCB0aGlzLmhlYWQpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBwYXJzZUNvbW1lbnRIZWFkIChidWZmZXI6IFVpbnQ4QXJyYXkpOiB2b2lkIHtcclxuICAgIGxldCBvZmZzZXQ6IG51bWJlciA9IDg7XHJcbiAgICB0aGlzLmNvbW1lbnQudmVuZG9yU3RyaW5nTGVuZ3RoID0gYnVmZmVyW29mZnNldF0gKyAoYnVmZmVyW29mZnNldCsxXSA8PCA4KSArIChidWZmZXJbb2Zmc2V0KzJdIDw8IDE2KSArIChidWZmZXJbb2Zmc2V0KzNdIDw8IDI0KTtcclxuICAgIG9mZnNldCArPSA0O1xyXG4gICAgdGhpcy5jb21tZW50LnZlbmRvclN0cmluZyA9IHRoaXMudWludDhBcnJheVRvU3RyaW5nKGJ1ZmZlciwgb2Zmc2V0LCB0aGlzLmNvbW1lbnQudmVuZG9yU3RyaW5nTGVuZ3RoKTsgLy9uZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoYnVmZmVyLnNsaWNlKG9mZnNldCwgb2Zmc2V0ICsgdGhpcy5jb21tZW50LnZlbmRvclN0cmluZ0xlbmd0aCkpO1xyXG4gICAgb2Zmc2V0ICs9IHRoaXMuY29tbWVudC52ZW5kb3JTdHJpbmdMZW5ndGg7XHJcbiAgICB0aGlzLmNvbW1lbnQudXNlckNvbW1lbnRMaXN0TGVuZ3RoID0gYnVmZmVyW29mZnNldF0gKyAoYnVmZmVyW29mZnNldCsxXSA8PCA4KSArIChidWZmZXJbb2Zmc2V0KzJdIDw8IDE2KSArIChidWZmZXJbb2Zmc2V0KzNdIDw8IDI0KTtcclxuICAgIG9mZnNldCArPSA0O1xyXG4gICAgdGhpcy5jb21tZW50LmNvbWVudEFyci5zcGxpY2UoMCk7XHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29tbWVudC51c2VyQ29tbWVudExpc3RMZW5ndGg7ICsraSkge1xyXG4gICAgICBsZXQgdXNlckNvbW1lbnRMZW5ndGg6IG51bWJlciA9IGJ1ZmZlcltvZmZzZXRdICsgKGJ1ZmZlcltvZmZzZXQrMV0gPDwgOCkgKyAoYnVmZmVyW29mZnNldCsyXSA8PCAxNikgKyAoYnVmZmVyW29mZnNldCszXSA8PCAyNCk7XHJcbiAgICAgIG9mZnNldCArPSA0O1xyXG4gICAgICB0aGlzLmNvbW1lbnQuY29tZW50QXJyLnB1c2godGhpcy51aW50OEFycmF5VG9TdHJpbmcoYnVmZmVyLCBvZmZzZXQsIHVzZXJDb21tZW50TGVuZ3RoKSk7XHJcbiAgICAgIG9mZnNldCArPSB1c2VyQ29tbWVudExlbmd0aDtcclxuICAgIH0gXHJcblxyXG4gICAgY29uc29sZS5sb2coYnVmZmVyLCBcImNvbW1lbnQ6XCIsIHRoaXMuY29tbWVudCwgXCIgICAgb2Zmc2V0OlwiLCBvZmZzZXQpO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB1aW50OEFycmF5VG9TdHJpbmcgKGJ1ZmZlcjogVWludDhBcnJheSwgb2Zmc2V0OiBudW1iZXIsIGxlbmd0aDogbnVtYmVyKTogc3RyaW5nIHtcclxuICAgIGNvbnNvbGUubG9nKFwib2Zmc2V0OlwiLCBvZmZzZXQsIFwiICAgbGVuZ3RoOlwiLCBsZW5ndGgpO1xyXG4gICAgaWYgKG9mZnNldCArIGxlbmd0aCA8PSBidWZmZXIubGVuZ3RoKSB7XHJcbiAgICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoYnVmZmVyLnNsaWNlKG9mZnNldCwgb2Zmc2V0ICsgbGVuZ3RoKSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gXCJcIjtcclxuICB9XHJcbn1cclxuXHJcbiJdfQ==

/***/ }),

/***/ "./src/audio/format/wave.ts":
/*!**********************************!*\
  !*** ./src/audio/format/wave.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WaveFormat = void 0;
/**
 * Wave格式头检测
 */
var WaveFormat = /** @class */ (function () {
    function WaveFormat() {
    }
    WaveFormat.prototype.check = function (buffer) {
        if (buffer.byteLength > 44) {
            return this.checkRIFF(buffer) && this.checkWave(buffer) && this.checkFMT(buffer) && this.checkPCMWaveFormat(buffer);
        }
        return false;
    };
    WaveFormat.prototype.checkRIFF = function (buffer) {
        return 0x52 === buffer[0] && 0x49 === buffer[1] && 0x46 === buffer[2] && 0x46 === buffer[3];
    };
    WaveFormat.prototype.checkWave = function (buffer) {
        return 0x57 === buffer[8] && 0x41 === buffer[9] && 0x56 === buffer[10] && 0x45 === buffer[11];
    };
    WaveFormat.prototype.checkFMT = function (buffer) {
        return 0x66 === buffer[12] && 0x6D === buffer[13] && 0x74 === buffer[14] && 0x20 === buffer[15];
    };
    WaveFormat.prototype.checkPCMWaveFormat = function (buffer) {
        return 0x10 === buffer[16] && 0 === buffer[17] && 0 === buffer[18] && 0 === buffer[19];
    };
    return WaveFormat;
}());
exports.WaveFormat = WaveFormat;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2F2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndhdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0E7O0dBRUc7QUFDSDtJQUVFO0lBQ0EsQ0FBQztJQUVNLDBCQUFLLEdBQVosVUFBYyxNQUFrQjtRQUU5QixJQUFJLE1BQU0sQ0FBQyxVQUFVLEdBQUcsRUFBRSxFQUFFLENBQUM7WUFDM0IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEgsQ0FBQztRQUVELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVTLDhCQUFTLEdBQW5CLFVBQXFCLE1BQWtCO1FBQ3JDLE9BQU8sSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5RixDQUFDO0lBRVMsOEJBQVMsR0FBbkIsVUFBcUIsTUFBa0I7UUFDckMsT0FBTyxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxLQUFLLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEtBQUssTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2hHLENBQUM7SUFFUyw2QkFBUSxHQUFsQixVQUFvQixNQUFrQjtRQUNwQyxPQUFPLElBQUksS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxLQUFLLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLEtBQUssTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDbEcsQ0FBQztJQUVTLHVDQUFrQixHQUE1QixVQUE4QixNQUFrQjtRQUM5QyxPQUFPLElBQUksS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDekYsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQTdCRCxJQTZCQztBQTdCWSxnQ0FBVSIsInNvdXJjZXNDb250ZW50IjpbIlxyXG4vKipcclxuICogV2F2ZeagvOW8j+WktOajgOa1i1xyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFdhdmVGb3JtYXQge1xyXG5cclxuICBjb25zdHJ1Y3RvciAoKSB7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgY2hlY2sgKGJ1ZmZlcjogVWludDhBcnJheSk6IGJvb2xlYW4ge1xyXG5cclxuICAgIGlmIChidWZmZXIuYnl0ZUxlbmd0aCA+IDQ0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNoZWNrUklGRihidWZmZXIpICYmIHRoaXMuY2hlY2tXYXZlKGJ1ZmZlcikgJiYgdGhpcy5jaGVja0ZNVChidWZmZXIpICYmIHRoaXMuY2hlY2tQQ01XYXZlRm9ybWF0KGJ1ZmZlcik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGNoZWNrUklGRiAoYnVmZmVyOiBVaW50OEFycmF5KTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gMHg1MiA9PT0gYnVmZmVyWzBdICYmIDB4NDkgPT09IGJ1ZmZlclsxXSAmJiAweDQ2ID09PSBidWZmZXJbMl0gJiYgMHg0NiA9PT0gYnVmZmVyWzNdO1xyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGNoZWNrV2F2ZSAoYnVmZmVyOiBVaW50OEFycmF5KTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gMHg1NyA9PT0gYnVmZmVyWzhdICYmIDB4NDEgPT09IGJ1ZmZlcls5XSAmJiAweDU2ID09PSBidWZmZXJbMTBdICYmIDB4NDUgPT09IGJ1ZmZlclsxMV07XHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgY2hlY2tGTVQgKGJ1ZmZlcjogVWludDhBcnJheSk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIDB4NjYgPT09IGJ1ZmZlclsxMl0gJiYgMHg2RCA9PT0gYnVmZmVyWzEzXSAmJiAweDc0ID09PSBidWZmZXJbMTRdICYmIDB4MjAgPT09IGJ1ZmZlclsxNV07IFxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGNoZWNrUENNV2F2ZUZvcm1hdCAoYnVmZmVyOiBVaW50OEFycmF5KTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gMHgxMCA9PT0gYnVmZmVyWzE2XSAmJiAwID09PSBidWZmZXJbMTddICYmIDAgPT09IGJ1ZmZlclsxOF0gJiYgMCA9PT0gYnVmZmVyWzE5XTtcclxuICB9XHJcbn0iXX0=

/***/ }),

/***/ "./src/audio/index.ts":
/*!****************************!*\
  !*** ./src/audio/index.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebCodecAudioPlayer = void 0;
var audio_format_util_1 = __webpack_require__(/*! ./utils/audio-format-util */ "./src/audio/utils/audio-format-util.ts");
var wave_decoder_1 = __webpack_require__(/*! ./decoder/wave-decoder */ "./src/audio/decoder/wave-decoder.ts");
var interface_1 = __webpack_require__(/*! ../interface */ "./src/interface/index.ts");
var audio_decoder_1 = __webpack_require__(/*! ./decoder/audio-decoder */ "./src/audio/decoder/audio-decoder.ts");
var WebCodecAudioPlayer = /** @class */ (function (_super) {
    __extends(WebCodecAudioPlayer, _super);
    function WebCodecAudioPlayer() {
        var _this = _super.call(this) || this;
        // 播放器状态
        _this.playerState = 0 /* PlayerState.Stop */;
        // 当前播放的音频格式
        _this.currentAudioFormat = 0 /* AudioFormatType.Unknown */;
        _this.format_util = new audio_format_util_1.AudioFormatUtil();
        return _this;
    }
    Object.defineProperty(WebCodecAudioPlayer.prototype, "duration", {
        /**
         * 获取当前音频的总长度
         */
        get: function () {
            return this.player ? this.player.duration : 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebCodecAudioPlayer.prototype, "currentTime", {
        get: function () {
            return this.player ? this.player.currentTime : 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebCodecAudioPlayer.prototype, "volume", {
        get: function () {
            return this.player ? this.player.volume : 0;
        },
        set: function (value) {
            if (this.player) {
                this.player.volume = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebCodecAudioPlayer.prototype, "muted", {
        get: function () {
            return this.player ? this.player.muted : false;
        },
        set: function (value) {
            if (this.player) {
                this.player.muted = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    WebCodecAudioPlayer.prototype.pause = function () {
        if (this.player) {
            return this.player.pause();
        }
        return false;
    };
    Object.defineProperty(WebCodecAudioPlayer.prototype, "paused", {
        get: function () {
            if (this.player) {
                return this.player.paused;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    WebCodecAudioPlayer.prototype.resume = function () {
        if (this.player) {
            return this.player.resume();
        }
        else {
            return Promise.reject({
                code: -1,
                message: "no player"
            });
        }
    };
    WebCodecAudioPlayer.prototype.seek = function (value) {
        if (this.player) {
            return this.player.seek(value);
        }
        else {
            return false;
        }
    };
    WebCodecAudioPlayer.prototype.appendBuffer = function (buffer) {
        if (this.player) {
            this.player.appendBuffer(buffer);
            return true;
        }
        return false;
    };
    WebCodecAudioPlayer.prototype.play = function (buffer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.playerState = 1 /* PlayerState.Loading */;
            var data = new Uint8Array(buffer);
            var type = _this.format_util.checFormat(data);
            switch (type) {
                case 1 /* AudioFormatType.Wave */:
                case 3 /* AudioFormatType.Mp3 */:
                    _this.player = new wave_decoder_1.WaveDecoder();
                    _this.player.appendBuffer(buffer);
                    _this.player.play(type).then(function () {
                        _this.playerState = 3 /* PlayerState.Playing */;
                        resolve();
                    }).catch(function (err) {
                        reject(err);
                    });
                    break;
                case 2 /* AudioFormatType.AacAdts */:
                case 4 /* AudioFormatType.Opus */:
                    _this.player = new audio_decoder_1.WebcodecAudioDecoder();
                    _this.player.appendBuffer(buffer);
                    _this.player.play(type).then(function () {
                        _this.playerState = 3 /* PlayerState.Playing */;
                        resolve();
                    }).catch(function (err) {
                        reject(err);
                    });
                    break;
                case 4 /* AudioFormatType.Opus */:
                    break;
                default:
                    reject({
                        code: -1,
                        message: "not support audio format"
                    });
                    break;
            }
        });
    };
    return WebCodecAudioPlayer;
}(interface_1.Player));
exports.WebCodecAudioPlayer = WebCodecAudioPlayer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSwrREFBNEU7QUFFNUUsdURBQXFEO0FBQ3JELDBDQUFzQztBQUN0Qyx5REFBK0Q7QUFnQi9EO0lBQXlDLHVDQUFNO0lBWTdDO1FBQ0UsWUFBQSxNQUFLLFdBQUUsU0FBQztRQVhWLFFBQVE7UUFDRSxpQkFBVyw0QkFBaUM7UUFFdEQsWUFBWTtRQUNGLHdCQUFrQixtQ0FBNEM7UUFFOUQsaUJBQVcsR0FBb0IsSUFBSSxtQ0FBZSxFQUFFLENBQUM7O0lBTS9ELENBQUM7SUFLRCxzQkFBSSx5Q0FBUTtRQUhaOztXQUVHO2FBQ0g7WUFDRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEQsQ0FBQzs7O09BQUE7SUFFRCxzQkFBSSw0Q0FBVzthQUFmO1lBQ0UsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7OztPQUFBO0lBRUQsc0JBQUksdUNBQU07YUFNVjtZQUNFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QyxDQUFDO2FBUkQsVUFBVyxLQUFhO1lBQ3RCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7WUFDN0IsQ0FBQztRQUNILENBQUM7OztPQUFBO0lBTUQsc0JBQUksc0NBQUs7YUFNVDtZQUNFLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENB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QUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO3dCQUMxQixLQUFJLENBQUMsV0FBVyw4QkFBc0IsQ0FBQzt3QkFDdkMsT0FBTyxFQUFFLENBQUM7b0JBQ1osQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUMsR0FBRzt3QkFDWCxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2QsQ0FBQyxDQUFDLENBQUE7b0JBQ0YsTUFBTTtnQkFFUjtvQkFFRSxNQUFNO2dCQUVSO29CQUNFLE1BQU0sQ0FBQzt3QkFDTCxJQUFJLEVBQUUsQ0FBQyxDQUFDO3dCQUNSLE9BQU8sRUFBRSwwQkFBMEI7cUJBQ3BDLENBQUMsQ0FBQTtvQkFDRixNQUFNO1lBQ1YsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFBO0lBRUosQ0FBQztJQUNILDBCQUFDO0FBQUQsQ0FBQyxBQXBJRCxDQUF5QyxrQkFBTSxHQW9JOUM7QUFwSVksa0RBQW1CIiwic291cmNlc0NvbnRlbnQiOlsiXHJcbmltcG9ydCB7IEF1ZGlvRm9ybWF0VHlwZSwgQXVkaW9Gb3JtYXRVdGlsIH0gZnJvbSBcIi4vdXRpbHMvYXVkaW8tZm9ybWF0LXV0aWxcIlxyXG5pbXBvcnQgeyBEZWNvZGVyIH0gZnJvbSBcIi4vZGVjb2Rlci9kZWNvZGVyXCI7XHJcbmltcG9ydCB7IFdhdmVEZWNvZGVyIH0gZnJvbSBcIi4vZGVjb2Rlci93YXZlLWRlY29kZXJcIjtcclxuaW1wb3J0IHsgUGxheWVyIH0gZnJvbSBcIi4uL2ludGVyZmFjZVwiO1xyXG5pbXBvcnQgeyBXZWJjb2RlY0F1ZGlvRGVjb2RlciB9IGZyb20gXCIuL2RlY29kZXIvYXVkaW8tZGVjb2RlclwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IGVudW0gUGxheWVyU3RhdGUge1xyXG4gIC8qKiDmkq3mlL7lrozmiJDmiJbogIXov5jmsqHmnInmkq3mlL4gKi9cclxuICBTdG9wLFxyXG4gIExvYWRpbmcsXHJcbiAgU3VzcGVuZGVkLFxyXG4gIFBsYXlpbmcsXHJcbiAgUGF1c2VkLFxyXG4gIFdhaXRpbmcsXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBlbnVtIFdlYkNvZGVjQXVkaW9QbGF5ZXJFdmVudCB7XHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgV2ViQ29kZWNBdWRpb1BsYXllciBleHRlbmRzIFBsYXllciB7XHJcblxyXG4gIC8vIOaSreaUvuWZqOeKtuaAgVxyXG4gIHByb3RlY3RlZCBwbGF5ZXJTdGF0ZTogUGxheWVyU3RhdGUgPSBQbGF5ZXJTdGF0ZS5TdG9wO1xyXG5cclxuICAvLyDlvZPliY3mkq3mlL7nmoTpn7PpopHmoLzlvI9cclxuICBwcm90ZWN0ZWQgY3VycmVudEF1ZGlvRm9ybWF0OiBBdWRpb0Zvcm1hdFR5cGUgPSBBdWRpb0Zvcm1hdFR5cGUuVW5rbm93bjtcclxuXHJcbiAgcHJvdGVjdGVkIGZvcm1hdF91dGlsOiBBdWRpb0Zvcm1hdFV0aWwgPSBuZXcgQXVkaW9Gb3JtYXRVdGlsKCk7XHJcblxyXG4gIHByb3RlY3RlZCBwbGF5ZXI/OiBEZWNvZGVyO1xyXG5cclxuICBjb25zdHJ1Y3RvciAoKSB7XHJcbiAgICBzdXBlcigpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog6I635Y+W5b2T5YmN6Z+z6aKR55qE5oC76ZW/5bqmXHJcbiAgICovXHJcbiAgZ2V0IGR1cmF0aW9uICgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucGxheWVyID8gdGhpcy5wbGF5ZXIuZHVyYXRpb24gOiAwO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGN1cnJlbnRUaW1lICgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucGxheWVyID8gdGhpcy5wbGF5ZXIuY3VycmVudFRpbWUgOiAwO1xyXG4gIH1cclxuXHJcbiAgc2V0IHZvbHVtZSh2YWx1ZTogbnVtYmVyKSB7XHJcbiAgICBpZiAodGhpcy5wbGF5ZXIpIHtcclxuICAgICAgdGhpcy5wbGF5ZXIudm9sdW1lID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXQgdm9sdW1lICgpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIHRoaXMucGxheWVyID8gdGhpcy5wbGF5ZXIudm9sdW1lIDogMDtcclxuICB9XHJcblxyXG4gIHNldCBtdXRlZCAodmFsdWU6IGJvb2xlYW4pIHtcclxuICAgIGlmICh0aGlzLnBsYXllcikge1xyXG4gICAgICB0aGlzLnBsYXllci5tdXRlZCA9IHZhbHVlO1xyXG4gICAgfSBcclxuICB9XHJcblxyXG4gIGdldCBtdXRlZCAoKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdGhpcy5wbGF5ZXIgPyB0aGlzLnBsYXllci5tdXRlZCA6IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBhdXNlICgpOiBib29sZWFuIHtcclxuICAgIGlmICh0aGlzLnBsYXllcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5wbGF5ZXIucGF1c2UoKTtcclxuICAgIH1cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIGdldCBwYXVzZWQgKCk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKHRoaXMucGxheWVyKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnBsYXllci5wYXVzZWQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgcmVzdW1lICgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGlmICh0aGlzLnBsYXllcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5wbGF5ZXIucmVzdW1lKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3Qoe1xyXG4gICAgICAgIGNvZGU6IC0xLFxyXG4gICAgICAgIG1lc3NhZ2U6IFwibm8gcGxheWVyXCJcclxuICAgICAgfSk7IFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHVibGljIHNlZWsgKHZhbHVlOiBudW1iZXIpOiBib29sZWFuIHtcclxuICAgIGlmICh0aGlzLnBsYXllcikge1xyXG4gICAgICByZXR1cm4gdGhpcy5wbGF5ZXIuc2Vlayh2YWx1ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgYXBwZW5kQnVmZmVyIChidWZmZXI6IEFycmF5QnVmZmVyKTogYm9vbGVhbiB7XHJcbiAgICBpZiAodGhpcy5wbGF5ZXIpIHtcclxuICAgICAgdGhpcy5wbGF5ZXIuYXBwZW5kQnVmZmVyKGJ1ZmZlcik7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIHBsYXkgKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMucGxheWVyU3RhdGUgPSBQbGF5ZXJTdGF0ZS5Mb2FkaW5nO1xyXG4gICAgICBsZXQgZGF0YTogVWludDhBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcbiAgICAgIGxldCB0eXBlOiBBdWRpb0Zvcm1hdFR5cGUgPSB0aGlzLmZvcm1hdF91dGlsLmNoZWNGb3JtYXQoZGF0YSk7XHJcbiAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgIGNhc2UgQXVkaW9Gb3JtYXRUeXBlLldhdmU6XHJcbiAgICAgICAgY2FzZSBBdWRpb0Zvcm1hdFR5cGUuTXAzOlxyXG4gICAgICAgICAgdGhpcy5wbGF5ZXIgPSBuZXcgV2F2ZURlY29kZXIoKTtcclxuICAgICAgICAgIHRoaXMucGxheWVyLmFwcGVuZEJ1ZmZlcihidWZmZXIpO1xyXG4gICAgICAgICAgdGhpcy5wbGF5ZXIucGxheSh0eXBlKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wbGF5ZXJTdGF0ZSA9IFBsYXllclN0YXRlLlBsYXlpbmc7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcclxuICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY2FzZSBBdWRpb0Zvcm1hdFR5cGUuQWFjQWR0czpcclxuICAgICAgICBjYXNlIEF1ZGlvRm9ybWF0VHlwZS5PcHVzOlxyXG4gICAgICAgICAgdGhpcy5wbGF5ZXIgPSBuZXcgV2ViY29kZWNBdWRpb0RlY29kZXIoKTtcclxuICAgICAgICAgIHRoaXMucGxheWVyLmFwcGVuZEJ1ZmZlcihidWZmZXIpO1xyXG4gICAgICAgICAgdGhpcy5wbGF5ZXIucGxheSh0eXBlKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5wbGF5ZXJTdGF0ZSA9IFBsYXllclN0YXRlLlBsYXlpbmc7XHJcbiAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcclxuICAgICAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY2FzZSBBdWRpb0Zvcm1hdFR5cGUuT3B1czpcclxuICAgICAgICAgIFxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgXHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHJlamVjdCh7XHJcbiAgICAgICAgICAgIGNvZGU6IC0xLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBcIm5vdCBzdXBwb3J0IGF1ZGlvIGZvcm1hdFwiXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgIH0pXHJcbiAgICBcclxuICB9XHJcbn0iXX0=

/***/ }),

/***/ "./src/audio/player/audiocontext-player.ts":
/*!*************************************************!*\
  !*** ./src/audio/player/audiocontext-player.ts ***!
  \*************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AudioContextPlayer = void 0;
var event_emitter_1 = __webpack_require__(/*! ../../utils/event-emitter */ "./src/utils/event-emitter.ts");
/**
 * 音频播放器
 * 使用AudioContext播放声音
 */
var AudioContextPlayer = /** @class */ (function (_super) {
    __extends(AudioContextPlayer, _super);
    function AudioContextPlayer() {
        var _this = _super.call(this) || this;
        _this.audioMuted = false;
        _this.audioVolume = 1;
        _this.audioContext = new AudioContext();
        _this.gainNode = _this.audioContext.createGain();
        _this.playSuccessTimer = 0;
        _this.audioInfo = {
            duration: 0,
            sampleRate: 0,
            channels: 0,
        };
        _this.init();
        return _this;
    }
    Object.defineProperty(AudioContextPlayer.prototype, "duration", {
        get: function () {
            return this.audioInfo.duration;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AudioContextPlayer.prototype, "currentTime", {
        get: function () {
            return this.audioContext.currentTime;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AudioContextPlayer.prototype, "volume", {
        get: function () {
            return this.audioVolume;
        },
        set: function (value) {
            if (undefined === value || Number.isNaN(value)) {
                return;
            }
            value = value < 0 ? 0 : value;
            value = value > 1 ? 1 : value;
            this.audioVolume = value;
            if (!this.audioMuted) {
                this.gainNode.gain.value = value;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AudioContextPlayer.prototype, "muted", {
        get: function () {
            return this.audioMuted;
        },
        set: function (value) {
            if (value !== this.audioMuted) {
                this.audioMuted = value;
                if (value) {
                    this.gainNode.gain.value = 0;
                }
                else {
                    this.gainNode.gain.value = this.audioVolume;
                }
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AudioContextPlayer.prototype, "paused", {
        get: function () {
            return this.audioContext.state === "suspended";
        },
        enumerable: false,
        configurable: true
    });
    AudioContextPlayer.prototype.pause = function () {
        switch (this.audioContext.state) {
            case 'running':
                this.audioContext.suspend();
                return true;
            case 'suspended':
                return true;
            default:
                return false;
        }
    };
    AudioContextPlayer.prototype.resume = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.audioContext.state === 'running') {
                resolve();
            }
            else if (_this.audioContext.state === 'suspended') {
                _this.audioContext.resume();
                _this.checkPlaySuccess().then(function () {
                    resolve();
                }).catch(function () {
                    reject();
                });
            }
            else {
                reject({
                    code: -1,
                    message: 'player stopped'
                });
            }
        });
    };
    AudioContextPlayer.prototype.seek = function (value) {
        if (this.audioSource && value >= 0 && value <= this.audioInfo.duration) {
            this.audioSource.start(value);
        }
        return false;
    };
    /**
     * 开始播放
     * @param buffer
     * @param needDecod
     * @returns
     */
    AudioContextPlayer.prototype.play = function (buffer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.audioContext.decodeAudioData(buffer).then(function (audioBuffer) {
                _this.audioInfo = {
                    sampleRate: audioBuffer.sampleRate,
                    channels: audioBuffer.numberOfChannels,
                    duration: audioBuffer.duration,
                };
                _this.emit("AudioInfo", _this.audioInfo);
                _this.excutePlay(audioBuffer);
                _this.checkPlaySuccess().then(function () {
                    resolve();
                }).catch(function () {
                    reject();
                });
            }).catch(function (err) {
                console.log("decode err:", err);
                reject({
                    code: -3,
                    message: "decode audio data error"
                });
            });
        });
    };
    AudioContextPlayer.prototype.init = function () {
        var _this = this;
        console.log("state change:", this.audioContext.state);
        this.audioContext.addEventListener("statechange", function (event) {
            console.log("state change:", _this.audioContext.state);
        });
    };
    AudioContextPlayer.prototype.excutePlay = function (audioBuffer) {
        var _this = this;
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = audioBuffer;
        this.audioSource.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        this.audioSource.start();
        this.audioSource.onended = function (event) {
            _this.emit("AudioEnd");
        };
    };
    AudioContextPlayer.prototype.checkPlaySuccess = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (0 === _this.playSuccessTimer) {
                var index_1 = 0;
                _this.playSuccessTimer = window.setInterval(function () {
                    ++index_1;
                    if (_this.audioContext.state === "running") {
                        window.clearInterval(_this.playSuccessTimer);
                        _this.playSuccessTimer = 0;
                        resolve();
                    }
                    else if (3 === index_1) {
                        window.clearInterval(_this.playSuccessTimer);
                        _this.playSuccessTimer = 0;
                        reject();
                    }
                }, 100);
            }
        });
    };
    return AudioContextPlayer;
}(event_emitter_1.EventEmitter));
exports.AudioContextPlayer = AudioContextPlayer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaW9jb250ZXh0LXBsYXllci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF1ZGlvY29udGV4dC1wbGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsMkRBQXlEO0FBY3pEOzs7R0FHRztBQUNIO0lBQXdDLHNDQUFxQztJQW9CM0U7UUFDRSxZQUFBLE1BQUssV0FBRSxTQUFDO1FBbkJBLGdCQUFVLEdBQVksS0FBSyxDQUFDO1FBRTVCLGlCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBRXhCLGtCQUFZLEdBQWlCLElBQUksWUFBWSxFQUFFLENBQUM7UUFFaEQsY0FBUSxHQUFhLEtBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLENBQUM7UUFJcEQsc0JBQWdCLEdBQVcsQ0FBQyxDQUFDO1FBRTdCLGVBQVMsR0FBYztZQUMvQixRQUFRLEVBQUUsQ0FBQztZQUNYLFVBQVUsRUFBRSxDQUFDO1lBQ2IsUUFBUSxFQUFFLENBQUM7U0FDWixDQUFBO1FBSUMsS0FBSSxDQUFDLElBQUksRUFBRSxDQUFDOztJQUNkLENBQUM7SUFFRCxzQkFBSSx3Q0FBUTthQUFaO1lBQ0UsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUNqQyxDQUFDOzs7T0FBQTtJQUVELHNCQUFJLDJDQUFXO2FBQWY7WUFDRSxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDO1FBQ3ZDLENBQUM7OztPQUFBO0lBRUQsc0JBQUksc0NBQU07YUFZVjtZQUNFLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUMxQixDQUFDO2FBZEQsVUFBVyxLQUFhO1lBQ3RCLElBQUksU0FBUyxLQUFLLEtBQUssSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLE9BQU87WUFDVCxDQUFDO1lBQ0QsS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxD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QUFFLENBQUM7d0JBQ3ZCLE1BQU0sQ0FBQyxhQUFhLENBQUMsS0FBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7d0JBQzVDLEtBQUksQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUM7d0JBQzFCLE1BQU0sRUFBRSxDQUFDO29CQUNYLENBQUM7Z0JBQ0gsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1lBQ1QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVILHlCQUFDO0FBQUQsQ0FBQyxBQXhMRCxDQUF3Qyw0QkFBWSxHQXdMbkQ7QUF4TFksZ0RBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcIi4uLy4uL3V0aWxzL2V2ZW50LWVtaXR0ZXJcIjtcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEF1ZGlvQ29udGV4dFBsYXllckV2ZW50IHtcclxuICAnQXVkaW9JbmZvJzogKGluZm86IEF1ZGlvSW5mbykgPT4gdm9pZDtcclxuICAnQXVkaW9FbmQnOiAoKSA9PiB2b2lkO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEF1ZGlvSW5mbyB7XHJcbiAgZHVyYXRpb246IG51bWJlcjtcclxuICBzYW1wbGVSYXRlOiBudW1iZXI7XHJcbiAgY2hhbm5lbHM6IG51bWJlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIOmfs+mikeaSreaUvuWZqFxyXG4gKiDkvb/nlKhBdWRpb0NvbnRleHTmkq3mlL7lo7Dpn7NcclxuICovXHJcbmV4cG9ydCBjbGFzcyBBdWRpb0NvbnRleHRQbGF5ZXIgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8QXVkaW9Db250ZXh0UGxheWVyRXZlbnQ+IHtcclxuXHJcbiAgcHJvdGVjdGVkIGF1ZGlvTXV0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgcHJvdGVjdGVkIGF1ZGlvVm9sdW1lOiBudW1iZXIgPSAxO1xyXG5cclxuICBwcm90ZWN0ZWQgYXVkaW9Db250ZXh0OiBBdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XHJcblxyXG4gIHByb3RlY3RlZCBnYWluTm9kZTogR2Fpbk5vZGUgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVHYWluKCk7XHJcblxyXG4gIHByb3RlY3RlZCBhdWRpb1NvdXJjZT86IEF1ZGlvQnVmZmVyU291cmNlTm9kZTtcclxuXHJcbiAgcHJvdGVjdGVkIHBsYXlTdWNjZXNzVGltZXI6IG51bWJlciA9IDA7XHJcblxyXG4gIHByb3RlY3RlZCBhdWRpb0luZm86IEF1ZGlvSW5mbyA9IHtcclxuICAgIGR1cmF0aW9uOiAwLFxyXG4gICAgc2FtcGxlUmF0ZTogMCxcclxuICAgIGNoYW5uZWxzOiAwLFxyXG4gIH1cclxuXHJcbiAgY29uc3RydWN0b3IgKCkge1xyXG4gICAgc3VwZXIoKTtcclxuICAgIHRoaXMuaW5pdCgpO1xyXG4gIH1cclxuXHJcbiAgZ2V0IGR1cmF0aW9uKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5hdWRpb0luZm8uZHVyYXRpb247XHJcbiAgfVxyXG5cclxuICBnZXQgY3VycmVudFRpbWUgKCk6IG51bWJlciB7XHJcbiAgICByZXR1cm4gdGhpcy5hdWRpb0NvbnRleHQuY3VycmVudFRpbWU7XHJcbiAgfVxyXG5cclxuICBzZXQgdm9sdW1lKHZhbHVlOiBudW1iZXIpIHtcclxuICAgIGlmICh1bmRlZmluZWQgPT09IHZhbHVlIHx8IE51bWJlci5pc05hTih2YWx1ZSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFsdWUgPSB2YWx1ZSA8IDAgPyAwIDogdmFsdWU7XHJcbiAgICB2YWx1ZSA9IHZhbHVlID4gMSA/IDEgOiB2YWx1ZTtcclxuICAgIHRoaXMuYXVkaW9Wb2x1bWUgPSB2YWx1ZTtcclxuICAgIGlmICghdGhpcy5hdWRpb011dGVkKSB7XHJcbiAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IHZhbHVlO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0IHZvbHVtZSAoKTogbnVtYmVyIHtcclxuICAgIHJldHVybiB0aGlzLmF1ZGlvVm9sdW1lO1xyXG4gIH1cclxuXHJcbiAgc2V0IG11dGVkICh2YWx1ZTogYm9vbGVhbikge1xyXG4gICAgaWYgKHZhbHVlICE9PSB0aGlzLmF1ZGlvTXV0ZWQpIHtcclxuICAgICAgdGhpcy5hdWRpb011dGVkID0gdmFsdWU7XHJcbiAgICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIHRoaXMuZ2Fpbk5vZGUuZ2Fpbi52YWx1ZSA9IDA7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5nYWluTm9kZS5nYWluLnZhbHVlID0gdGhpcy5hdWRpb1ZvbHVtZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0IG11dGVkICgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmF1ZGlvTXV0ZWQ7XHJcbiAgfVxyXG5cclxuICBnZXQgcGF1c2VkICgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmF1ZGlvQ29udGV4dC5zdGF0ZSA9PT0gXCJzdXNwZW5kZWRcIjtcclxuICB9XHJcblxyXG4gIHB1YmxpYyBwYXVzZSAoKTogYm9vbGVhbiB7XHJcbiAgICBzd2l0Y2ggKHRoaXMuYXVkaW9Db250ZXh0LnN0YXRlKSB7XHJcbiAgICAgIGNhc2UgJ3J1bm5pbmcnOlxyXG4gICAgICAgIHRoaXMuYXVkaW9Db250ZXh0LnN1c3BlbmQoKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgIGNhc2UgJ3N1c3BlbmRlZCc6XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXN1bWUgKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgaWYgKHRoaXMuYXVkaW9Db250ZXh0LnN0YXRlID09PSAncnVubmluZycpIHtcclxuICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5hdWRpb0NvbnRleHQuc3RhdGUgPT09ICdzdXNwZW5kZWQnKSB7XHJcbiAgICAgICAgdGhpcy5hdWRpb0NvbnRleHQucmVzdW1lKCk7XHJcbiAgICAgICAgdGhpcy5jaGVja1BsYXlTdWNjZXNzKCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xyXG4gICAgICAgICAgcmVqZWN0KCk7XHJcbiAgICAgICAgfSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZWplY3Qoe1xyXG4gICAgICAgICAgY29kZTogLTEsXHJcbiAgICAgICAgICBtZXNzYWdlOiAncGxheWVyIHN0b3BwZWQnXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzZWVrICh2YWx1ZTogbnVtYmVyKTogYm9vbGVhbiB7XHJcbiAgICBpZiAodGhpcy5hdWRpb1NvdXJjZSAmJiB2YWx1ZSA+PSAwICYmIHZhbHVlIDw9IHRoaXMuYXVkaW9JbmZvLmR1cmF0aW9uKSB7XHJcbiAgICAgIHRoaXMuYXVkaW9Tb3VyY2Uuc3RhcnQodmFsdWUpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICog5byA5aeL5pKt5pS+XHJcbiAgICogQHBhcmFtIGJ1ZmZlciBcclxuICAgKiBAcGFyYW0gbmVlZERlY29kIFxyXG4gICAqIEByZXR1cm5zIFxyXG4gICAqL1xyXG4gIHB1YmxpYyBwbGF5IChidWZmZXI6IEFycmF5QnVmZmVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoYnVmZmVyKS50aGVuKChhdWRpb0J1ZmZlcjogQXVkaW9CdWZmZXIpID0+IHtcclxuICAgICAgICB0aGlzLmF1ZGlvSW5mbyA9IHtcclxuICAgICAgICAgIHNhbXBsZVJhdGU6IGF1ZGlvQnVmZmVyLnNhbXBsZVJhdGUsXHJcbiAgICAgICAgICBjaGFubmVsczogYXVkaW9CdWZmZXIubnVtYmVyT2ZDaGFubmVscyxcclxuICAgICAgICAgIGR1cmF0aW9uOiBhdWRpb0J1ZmZlci5kdXJhdGlvbixcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lbWl0KFwiQXVkaW9JbmZvXCIsIHRoaXMuYXVkaW9JbmZvKTtcclxuICAgICAgICB0aGlzLmV4Y3V0ZVBsYXkoYXVkaW9CdWZmZXIpO1xyXG4gICAgICAgIHRoaXMuY2hlY2tQbGF5U3VjY2VzcygpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHtcclxuICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgIH0pXHJcbiAgICAgIH0pLmNhdGNoKChlcnIpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcImRlY29kZSBlcnI6XCIsIGVycik7XHJcbiAgICAgICAgcmVqZWN0KHtcclxuICAgICAgICAgIGNvZGU6IC0zLFxyXG4gICAgICAgICAgbWVzc2FnZTogXCJkZWNvZGUgYXVkaW8gZGF0YSBlcnJvclwiXHJcbiAgICAgICAgfSlcclxuICAgICAgfSlcclxuICAgIH0pXHJcbiAgfVxyXG5cclxuICBwcm90ZWN0ZWQgaW5pdCAoKTogdm9pZCB7XHJcbiAgICBjb25zb2xlLmxvZyhcInN0YXRlIGNoYW5nZTpcIiwgdGhpcy5hdWRpb0NvbnRleHQuc3RhdGUpXHJcbiAgICB0aGlzLmF1ZGlvQ29udGV4dC5hZGRFdmVudExpc3RlbmVyKFwic3RhdGVjaGFuZ2VcIiwgKGV2ZW50OiBFdmVudCkgPT4ge1xyXG4gICAgICBjb25zb2xlLmxvZyhcInN0YXRlIGNoYW5nZTpcIiwgdGhpcy5hdWRpb0NvbnRleHQuc3RhdGUpXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbiAgcHJvdGVjdGVkIGV4Y3V0ZVBsYXkgKGF1ZGlvQnVmZmVyOiBBdWRpb0J1ZmZlcik6IHZvaWQge1xyXG4gICAgdGhpcy5hdWRpb1NvdXJjZSA9IHRoaXMuYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG5cclxuICAgIHRoaXMuYXVkaW9Tb3VyY2UuYnVmZmVyID0gYXVkaW9CdWZmZXI7XHJcblxyXG4gICAgdGhpcy5hdWRpb1NvdXJjZS5jb25uZWN0KHRoaXMuZ2Fpbk5vZGUpO1xyXG4gICAgXHJcbiAgICB0aGlzLmdhaW5Ob2RlLmNvbm5lY3QodGhpcy5hdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xyXG5cclxuICAgIHRoaXMuYXVkaW9Tb3VyY2Uuc3RhcnQoKTtcclxuXHJcbiAgICB0aGlzLmF1ZGlvU291cmNlLm9uZW5kZWQgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XHJcbiAgICAgIHRoaXMuZW1pdChcIkF1ZGlvRW5kXCIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBjaGVja1BsYXlTdWNjZXNzICgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIGlmICgwID09PSB0aGlzLnBsYXlTdWNjZXNzVGltZXIpIHtcclxuICAgICAgICBsZXQgaW5kZXg6IG51bWJlciA9IDA7XHJcbiAgICAgICAgdGhpcy5wbGF5U3VjY2Vzc1RpbWVyID0gd2luZG93LnNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAgICsraW5kZXg7XHJcblxyXG4gICAgICAgICAgaWYgKHRoaXMuYXVkaW9Db250ZXh0LnN0YXRlID09PSBcInJ1bm5pbmdcIikge1xyXG4gICAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLnBsYXlTdWNjZXNzVGltZXIpO1xyXG4gICAgICAgICAgICB0aGlzLnBsYXlTdWNjZXNzVGltZXIgPSAwO1xyXG4gICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKDMgPT09IGluZGV4KSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMucGxheVN1Y2Nlc3NUaW1lcik7XHJcbiAgICAgICAgICAgIHRoaXMucGxheVN1Y2Nlc3NUaW1lciA9IDA7XHJcbiAgICAgICAgICAgIHJlamVjdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sIDEwMClcclxuICAgICAgfVxyXG4gICAgfSlcclxuICB9XHJcbiAgXHJcbn0iXX0=

/***/ }),

/***/ "./src/audio/utils/audio-format-util.ts":
/*!**********************************************!*\
  !*** ./src/audio/utils/audio-format-util.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AudioFormatUtil = void 0;
var aac_adts_1 = __webpack_require__(/*! ../format/aac-adts */ "./src/audio/format/aac-adts.ts");
var mp3_1 = __webpack_require__(/*! ../format/mp3 */ "./src/audio/format/mp3.ts");
var opus_1 = __webpack_require__(/*! ../format/opus */ "./src/audio/format/opus.ts");
var wave_1 = __webpack_require__(/*! ../format/wave */ "./src/audio/format/wave.ts");
var AudioFormatUtil = /** @class */ (function () {
    function AudioFormatUtil() {
        this.waveFormat = new wave_1.WaveFormat();
        this.aacAdtsFormat = new aac_adts_1.AacAdtsFormat();
        this.mp3Format = new mp3_1.Mp3Format();
        this.opusFormat = new opus_1.OggOpusFormat();
    }
    AudioFormatUtil.prototype.checFormat = function (data) {
        var format = 0 /* AudioFormatType.Unknown */;
        if (this.waveFormat.check(data)) {
            console.log('wave');
            format = 1 /* AudioFormatType.Wave */;
        }
        else if (this.aacAdtsFormat.check(data)) {
            console.log("aac-adts");
            format = 2 /* AudioFormatType.AacAdts */;
        }
        else if (this.mp3Format.check(data)) {
            console.log("mp3");
            format = 3 /* AudioFormatType.Mp3 */;
        }
        else if (this.opusFormat.check(data)) {
            format = 4 /* AudioFormatType.Opus */;
        }
        return format;
    };
    return AudioFormatUtil;
}());
exports.AudioFormatUtil = AudioFormatUtil;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXVkaW8tZm9ybWF0LXV0aWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhdWRpby1mb3JtYXQtdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQ0FBbUQ7QUFDbkQscUNBQTBDO0FBQzFDLHVDQUErQztBQUMvQyx1Q0FBNEM7QUFjNUM7SUFVRTtRQVJVLGVBQVUsR0FBZSxJQUFJLGlCQUFVLEVBQUUsQ0FBQztRQUUxQyxrQkFBYSxHQUFrQixJQUFJLHdCQUFhLEVBQUUsQ0FBQztRQUVuRCxjQUFTLEdBQWMsSUFBSSxlQUFTLEVBQUUsQ0FBQztRQUV2QyxlQUFVLEdBQWtCLElBQUksb0JBQWEsRUFBRSxDQUFDO0lBSTFELENBQUM7SUFFTSxvQ0FBVSxHQUFqQixVQUFtQixJQUFnQjtRQUNqQyxJQUFJLE1BQU0sa0NBQTJDLENBQUM7UUFDdEQsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDbkIsTUFBTSwrQkFBdUIsQ0FBQztRQUNoQyxDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEIsTUFBTSxrQ0FBMEIsQ0FBQztRQUNuQyxDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsTUFBTSw4QkFBc0IsQ0FBQztRQUMvQixDQUFDO2FBQU0sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3ZDLE1BQU0sK0JBQXVCLENBQUM7UUFDaEMsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFBQSxzQkFBQztBQUFELENBQUMsQUE3QkosSUE2Qkk7QUE3QlMsMENBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBYWNBZHRzRm9ybWF0IH0gZnJvbSBcIi4uL2Zvcm1hdC9hYWMtYWR0c1wiO1xyXG5pbXBvcnQgeyBNcDNGb3JtYXQgfSBmcm9tIFwiLi4vZm9ybWF0L21wM1wiO1xyXG5pbXBvcnQgeyBPZ2dPcHVzRm9ybWF0IH0gZnJvbSBcIi4uL2Zvcm1hdC9vcHVzXCI7XHJcbmltcG9ydCB7IFdhdmVGb3JtYXQgfSBmcm9tIFwiLi4vZm9ybWF0L3dhdmVcIjtcclxuXHJcbi8qKlxyXG4gKiDpn7PpopHmoLzlvI9cclxuICovXHJcbmV4cG9ydCBjb25zdCBlbnVtIEF1ZGlvRm9ybWF0VHlwZSB7XHJcbiAgLy8g5pyq55+l55qE5qC85byPXHJcbiAgVW5rbm93biA9IDAsXHJcbiAgV2F2ZSxcclxuICBBYWNBZHRzLFxyXG4gIE1wMyxcclxuICBPcHVzLFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXVkaW9Gb3JtYXRVdGlsIHtcclxuXHJcbiAgcHJvdGVjdGVkIHdhdmVGb3JtYXQ6IFdhdmVGb3JtYXQgPSBuZXcgV2F2ZUZvcm1hdCgpO1xyXG5cclxuICBwcm90ZWN0ZWQgYWFjQWR0c0Zvcm1hdDogQWFjQWR0c0Zvcm1hdCA9IG5ldyBBYWNBZHRzRm9ybWF0KCk7XHJcblxyXG4gIHByb3RlY3RlZCBtcDNGb3JtYXQ6IE1wM0Zvcm1hdCA9IG5ldyBNcDNGb3JtYXQoKTtcclxuXHJcbiAgcHJvdGVjdGVkIG9wdXNGb3JtYXQ6IE9nZ09wdXNGb3JtYXQgPSBuZXcgT2dnT3B1c0Zvcm1hdCgpO1xyXG5cclxuICBjb25zdHJ1Y3RvciAoKSB7XHJcblxyXG4gIH1cclxuXHJcbiAgcHVibGljIGNoZWNGb3JtYXQgKGRhdGE6IFVpbnQ4QXJyYXkpOiBBdWRpb0Zvcm1hdFR5cGUge1xyXG4gICAgbGV0IGZvcm1hdDogQXVkaW9Gb3JtYXRUeXBlID0gQXVkaW9Gb3JtYXRUeXBlLlVua25vd247XHJcbiAgICBpZiAodGhpcy53YXZlRm9ybWF0LmNoZWNrKGRhdGEpKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCd3YXZlJylcclxuICAgICAgZm9ybWF0ID0gQXVkaW9Gb3JtYXRUeXBlLldhdmU7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMuYWFjQWR0c0Zvcm1hdC5jaGVjayhkYXRhKSkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcImFhYy1hZHRzXCIpO1xyXG4gICAgICBmb3JtYXQgPSBBdWRpb0Zvcm1hdFR5cGUuQWFjQWR0cztcclxuICAgIH0gZWxzZSBpZiAodGhpcy5tcDNGb3JtYXQuY2hlY2soZGF0YSkpIHtcclxuICAgICAgY29uc29sZS5sb2coXCJtcDNcIik7XHJcbiAgICAgIGZvcm1hdCA9IEF1ZGlvRm9ybWF0VHlwZS5NcDM7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B1c0Zvcm1hdC5jaGVjayhkYXRhKSkge1xyXG4gICAgICBmb3JtYXQgPSBBdWRpb0Zvcm1hdFR5cGUuT3B1cztcclxuICAgIH1cclxuICAgIHJldHVybiBmb3JtYXQ7XHJcbiAgfX0iXX0=

/***/ }),

/***/ "./src/interface/index.ts":
/*!********************************!*\
  !*** ./src/interface/index.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Player = void 0;
/**
 * 播放器基类
 * AudioPlayer和VideoPlayer都继承这个基类
 */
var Player = /** @class */ (function () {
    function Player() {
    }
    return Player;
}());
exports.Player = Player;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQTs7O0dBR0c7QUFDSDtJQUFBO0lBWUEsQ0FBQztJQUFELGFBQUM7QUFBRCxDQUFDLEFBWkQsSUFZQztBQVpxQix3QkFBTSIsInNvdXJjZXNDb250ZW50IjpbIlxyXG4vKipcclxuICog5pKt5pS+5Zmo5Z+657G7XHJcbiAqIEF1ZGlvUGxheWVy5ZKMVmlkZW9QbGF5ZXLpg73nu6fmib/ov5nkuKrln7rnsbtcclxuICovXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBQbGF5ZXIge1xyXG5cclxuICBhYnN0cmFjdCBnZXQgcGF1c2VkICgpOiBib29sZWFuO1xyXG5cclxuICBwdWJsaWMgYWJzdHJhY3QgcGF1c2UgKCk6IGJvb2xlYW47XHJcblxyXG4gIHB1YmxpYyBhYnN0cmFjdCByZXN1bWUgKCk6IFByb21pc2U8dm9pZD47XHJcblxyXG4gIHB1YmxpYyBhYnN0cmFjdCBzZWVrICh2YWx1ZTogbnVtYmVyKTogYm9vbGVhbjtcclxuXHJcbiAgcHVibGljIGFic3RyYWN0IHBsYXkgKGJ1ZmZlcjogQXJyYXlCdWZmZXIpOiBQcm9taXNlPHZvaWQ+O1xyXG5cclxufSJdfQ==

/***/ }),

/***/ "./src/utils/event-emitter.ts":
/*!************************************!*\
  !*** ./src/utils/event-emitter.ts ***!
  \************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventEmitter = void 0;
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.eventMap = {};
    }
    EventEmitter.prototype.listeners = function (type) {
        return this.eventMap[type] || [];
    };
    EventEmitter.prototype.emit = function (type) {
        var _this = this;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var cbs = this.eventMap[type];
        if (Array.isArray(cbs)) {
            cbs.forEach(function (fn) { return fn.apply(_this, args); });
            return true;
        }
        return false;
    };
    EventEmitter.prototype.off = function (type, fn) {
        var cbs = this.eventMap[type];
        if (Array.isArray(cbs)) {
            this.eventMap[type] = cbs.filter(function (v) { return v !== fn; });
        }
        return this;
    };
    EventEmitter.prototype.on = function (type, fn) {
        if (this.eventMap[type]) {
            this.eventMap[type].push(fn);
        }
        else {
            this.eventMap[type] = [fn];
        }
        return this;
    };
    EventEmitter.prototype.once = function (type, fn) {
        var _this = this;
        var callback = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.off(type, callback);
            fn.apply(_this, args);
        };
        this.on(type, callback);
        return this;
    };
    EventEmitter.prototype.removeAllListeners = function (type) {
        if (undefined === type) {
            this.eventMap = {};
        }
        else if (this.eventMap[type]) {
            this.eventMap[type].splice(0);
        }
        return this;
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtZW1pdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV2ZW50LWVtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBUUE7SUFBQTtRQUVZLGFBQVEsR0FBMkIsRUFBMkIsQ0FBQztJQWlEM0UsQ0FBQztJQS9DUSxnQ0FBUyxHQUFoQixVQUFvQyxJQUFPO1FBQ3pDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbkMsQ0FBQztJQUVNLDJCQUFJLEdBQVgsVUFBK0IsSUFBTztRQUF0QyxpQkFPQztRQVB1QyxjQUFjO2FBQWQsVUFBYyxFQUFkLHFCQUFjLEVBQWQsSUFBYztZQUFkLDZCQUFjOztRQUNwRCxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3ZCLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFhLElBQUssT0FBQSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUksRUFBRSxJQUFJLENBQUMsRUFBcEIsQ0FBb0IsQ0FBQyxDQUFDO1lBQ3JELE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUNELE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLDBCQUFHLEdBQVYsVUFBOEIsSUFBTyxFQUFFLEVBQVE7UUFDN0MsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN2QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBQyxDQUFDLElBQUssT0FBQSxDQUFDLEtBQUssRUFBRSxFQUFSLENBQVEsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSx5QkFBRSxHQUFULFVBQTZCLElBQU8sRUFBRSxFQUFRO1FBQzVDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9CLENBQUM7YUFBTSxDQUFDO1lBQ04sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSwyQkFBSSxHQUFYLFVBQStCLElBQU8sRUFBRSxFQUFRO1FBQWhELGlCQU9DO1FBTkMsSUFBTSxRQUFRLEdBQUc7WUFBQyxjQUFjO2lCQUFkLFVBQWMsRUFBZCxxQkFBYyxFQUFkLElBQWM7Z0JBQWQseUJBQWM7O1lBQzlCLEtBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLFFBQWdCLENBQUMsQ0FBQztZQUNqQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2QixDQUFDLENBQUE7UUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxRQUFnQixDQUFDLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRU0seUNBQWtCLEdBQXpCLFVBQTZDLElBQVE7UUFDbkQsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFLENBQUM7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFTLENBQUM7UUFDNUIsQ0FBQzthQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQy9CLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDSCxtQkFBQztBQUFELENBQUMsQUFuREQsSUFtREM7QUFuRFksb0NBQVkiLCJzb3VyY2VzQ29udGVudCI6WyJ0eXBlIElDYWxsYmFjayA9ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55O1xyXG5cclxuaW50ZXJmYWNlIElMaXN0ZW5lck1hcCB7XHJcbiAgW3M6IHN0cmluZ106IGFueTtcclxufVxyXG5cclxudHlwZSBNYXBUb0xpc3Q8VCwgViBleHRlbmRzIGtleW9mIFQ+ID0geyBbSyBpbiBWXTogVFtLXVtdfTtcclxuXHJcbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXI8VCBleHRlbmRzIElMaXN0ZW5lck1hcD4ge1xyXG5cclxuICBwcm90ZWN0ZWQgZXZlbnRNYXA6IE1hcFRvTGlzdDxULCBrZXlvZiBUPiAgPSB7fSBhcyBNYXBUb0xpc3Q8VCwga2V5b2YgVD47XHJcblxyXG4gIHB1YmxpYyBsaXN0ZW5lcnM8SyBleHRlbmRzIGtleW9mIFQ+KHR5cGU6IEspOiBUW0tdW10ge1xyXG4gICAgcmV0dXJuIHRoaXMuZXZlbnRNYXBbdHlwZV0gfHwgW107XHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZW1pdDxLIGV4dGVuZHMga2V5b2YgVD4odHlwZTogSywgLi4uYXJnczogYW55W10pOiBib29sZWFuIHtcclxuICAgIGNvbnN0IGNicyA9IHRoaXMuZXZlbnRNYXBbdHlwZV07XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShjYnMpKSB7XHJcbiAgICAgIGNicy5mb3JFYWNoKChmbjogSUNhbGxiYWNrKSA9PiBmbi5hcHBseSh0aGlzLCBhcmdzKSk7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG9mZjxLIGV4dGVuZHMga2V5b2YgVD4odHlwZTogSywgZm46IFRbS10pOiBFdmVudEVtaXR0ZXI8VD4ge1xyXG4gICAgY29uc3QgY2JzID0gdGhpcy5ldmVudE1hcFt0eXBlXTtcclxuICAgIGlmIChBcnJheS5pc0FycmF5KGNicykpIHtcclxuICAgICAgdGhpcy5ldmVudE1hcFt0eXBlXSA9IGNicy5maWx0ZXIoKHYpID0+IHYgIT09IGZuKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIG9uPEsgZXh0ZW5kcyBrZXlvZiBUPih0eXBlOiBLLCBmbjogVFtLXSk6IEV2ZW50RW1pdHRlcjxUPiB7XHJcbiAgICBpZiAodGhpcy5ldmVudE1hcFt0eXBlXSkge1xyXG4gICAgICB0aGlzLmV2ZW50TWFwW3R5cGVdLnB1c2goZm4pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5ldmVudE1hcFt0eXBlXSA9IFtmbl07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIHB1YmxpYyBvbmNlPEsgZXh0ZW5kcyBrZXlvZiBUPih0eXBlOiBLLCBmbjogVFtLXSk6IEV2ZW50RW1pdHRlcjxUPiB7XHJcbiAgICBjb25zdCBjYWxsYmFjayA9ICguLi5hcmdzOiBhbnlbXSkgPT4ge1xyXG4gICAgICB0aGlzLm9mZih0eXBlLCBjYWxsYmFjayBhcyBUW0tdKTtcclxuICAgICAgZm4uYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLm9uKHR5cGUsIGNhbGxiYWNrIGFzIFRbS10pO1xyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZW1vdmVBbGxMaXN0ZW5lcnM8SyBleHRlbmRzIGtleW9mIFQ+KHR5cGU/OiBLKTogRXZlbnRFbWl0dGVyPFQ+IHtcclxuICAgIGlmICh1bmRlZmluZWQgPT09IHR5cGUpIHtcclxuICAgICAgdGhpcy5ldmVudE1hcCA9IHt9IGFzIGFueTtcclxuICAgIH0gZWxzZSBpZiAodGhpcy5ldmVudE1hcFt0eXBlXSkge1xyXG4gICAgICB0aGlzLmV2ZW50TWFwW3R5cGVdLnNwbGljZSgwKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH1cclxufVxyXG4iXX0=

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebCodecAudioPlayer = void 0;
var audio_1 = __webpack_require__(/*! ./audio */ "./src/audio/index.ts");
Object.defineProperty(exports, "WebCodecAudioPlayer", ({ enumerable: true, get: function () { return audio_1.WebCodecAudioPlayer; } }));
if (window) {
    window.WebcodecAudioPlayer = audio_1.WebCodecAudioPlayer;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBOEM7QUFrQnJDLG9HQWxCQSwyQkFBbUIsT0FrQkE7QUFMNUIsSUFBSSxNQUFNLEVBQUUsQ0FBQztJQUNYLE1BQU0sQ0FBQyxtQkFBbUIsR0FBRywyQkFBbUIsQ0FBQztJQUNqRCxNQUFNLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLElBQUksTUFBTSxDQUFDLGtCQUFrQixDQUFDO0FBQ3pFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBXZWJDb2RlY0F1ZGlvUGxheWVyIH0gZnJvbSBcIi4vYXVkaW9cIjtcclxuXHJcblxyXG5cclxuZGVjbGFyZSBnbG9iYWwge1xyXG4gIGludGVyZmFjZSBXaW5kb3cge1xyXG4gICAgV2ViY29kZWNBdWRpb1BsYXllcjogYW55O1xyXG4gICAgQXVkaW9Db250ZXh0OiBhbnk7XHJcbiAgICB3ZWJraXRBdWRpb0NvbnRleHQ6IGFueTtcclxuICB9XHJcbiAgXHJcbn1cclxuXHJcbmlmICh3aW5kb3cpIHtcclxuICB3aW5kb3cuV2ViY29kZWNBdWRpb1BsYXllciA9IFdlYkNvZGVjQXVkaW9QbGF5ZXI7XHJcbiAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcclxufVxyXG5cclxuZXhwb3J0IHsgV2ViQ29kZWNBdWRpb1BsYXllciB9O1xyXG4iXX0=
})();

/******/ })()
;
//# sourceMappingURL=webcodec-player.js.map