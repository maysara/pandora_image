// vi:si:et:sw=4:sts=4:ts=4
// GPL2+/MIT 2012
'use strict';
/*
 Usage:
  pandora.chunkupload({
      file: file,
      url: '/add',
      data: {'name': file.name}
 }).bindEvent({
      progress: function(data) {
        console.log(data.progress);
      },
      done: function(result) {
          if (result.progress == 1) {
              var response = JSON.parse(result.responseText);
              if (response.resultUrl) {
                document.location.href = response.resultUrl;
              } else {
                alert(response.status;
              }
          } else {
              alert('!!!');
          }
      }
  });
*/
pandora.chunkupload = function(options) {
    var chunkSize = options.size || 1024 * 1024,
        chunkURL,
        file = options.file,
        maxRetry = -1,
        nextChunkId,
        paused = false,
        retries = 0,
        request,
        that = Ox.Element();

    options.data = options.data || {};

    initUpload();

    function done() {
        that.triggerEvent('done', {
          status: that.status,
          progress: that.progress,
          responseText: that.responseText
        });
    }

    function initUpload() {
        // request upload slot from server
        that.status = 'requesting chunk upload';
        that.progress = 0;
        request = new XMLHttpRequest();
        request.addEventListener('load', function (evt) {
            var response = {};
            that.responseText = evt.target.responseText;
            try {
                response = JSON.parse(evt.target.responseText);
            } catch(e) {
                response = {};
                that.status = 'failed to parse response';
                that.progress = -1;
                done();
            }
            if (response.maxRetry) {
                maxRetry = response.maxRetry;
            }
            chunkURL = response.uploadUrl;
            if (document.location.protocol == 'https:') {
                chunkURL = chunkURL.replace(/http:\/\//, 'https://');
            }
            if (chunkURL) {
                that.status = 'uploading';
                that.progress = 0.0;
                // start upload
                uploadChunk(0);
            } else {
                that.status = 'upload failed, no upload url provided';
                that.progress = -1;
                done();
            }
        }, false);
        request.addEventListener('error', function (evt) {
            that.status = 'uplaod failed';
            that.progress = -1;
            that.responseText = evt.target.responseText;
            done();
        }, false);
        request.addEventListener('abort', function (evt) {
            that.status = 'aborted';
            that.progress = -1;
            done();
        }, false);
        var formData = new FormData();
        
        Object.keys(options.data).forEach(function(key) {
            formData.append(key, options.data[key]);
        });
        request.open('POST', options.url);
        request.send(formData);
    }

    function progress(p) {
        that.progress = p;
        that.triggerEvent('progress', {
            progress: that.progress,
            status: that.status
        });
    }

    function uploadChunk(chunkId) {
        var bytesAvailable = file.size,
            chunk,
            chunkOffset = chunkId * chunkSize;

        if (file.mozSlice) {
            chunk = file.mozSlice(chunkOffset, chunkOffset+chunkSize, file.type);
        } else if (file.webkitSlice) {
            chunk = file.webkitSlice(chunkOffset, chunkOffset+chunkSize, file.type);
        } else if (file.slice) {
            chunk = file.slice(chunkOffset, chunkOffset+chunkSize, file.type);
        } else {
            that.status = Ox._('Sorry, your browser is currently not supported.');
            done();
        }

        progress(parseFloat(chunkOffset)/bytesAvailable);

        request = new XMLHttpRequest();
        request.addEventListener('load', function (evt) {
            var response;
            that.responseText = evt.target.responseText;
            try {
                response = JSON.parse(evt.target.responseText);
            } catch(e) {
                response = {};
            }
            if (response.done == 1) {
                //upload finished
                that.resultUrl = response.resultUrl;
                that.progress = 1;
                that.status = 'done';
                done();
            } else if (response.result == 1) {
                // reset retry counter
                retries = 0;
                // start uploading next chunk
                if (paused) {
                    nextChunkId = chunkId + 1;
                    that.triggerEvent('paused', {next: nextChunkId});
                } else {
                    uploadChunk(chunkId + 1);
                }
            } else {
                // failed to upload, try again in 5 second
                retries++;
                if (maxRetry > 0 && retries > maxRetry) {
                    that.status = 'uplaod failed';
                    that.progress = -1;
                    done();
                } else {
                    setTimeout(function() {
                        if (paused) {
                            nextChunkId = chunkId;
                            that.triggerEvent('paused', {next: nextChunkId});
                        } else {
                            uploadChunk(chunkId);
                        }
                    }, 5000);
                }
            }
        }, false);
        request.addEventListener('error', function (evt) {
            // failed to upload, try again in 3 second
            retries++;
            if (maxRetry > 0 && retries > maxRetry) {
                that.status = 'uplaod failed';
                that.progress = -1;
                done();
            } else {
                setTimeout(function() {
                    if (paused) {
                        nextChunkId = chunkId;
                        that.triggerEvent('paused', {next: nextChunkId});
                    } else {
                        uploadChunk(chunkId);
                    }
                }, 3000);
            }
        }, false);
        request.upload.addEventListener('progress', function (evt) {
            if (evt.lengthComputable) {
                progress(parseFloat(chunkOffset + evt.loaded) / bytesAvailable);
            }
        }, false);
        request.addEventListener('abort', function (evt) {
            that.status = 'aborted';
            that.progress = -1;
            done();
        }, false);

        var formData = new FormData();
        Object.keys(options.data).forEach(function(key) {
            formData.append(key, options.data[key]);
        });
        formData.append('chunkId', chunkId);
        if (bytesAvailable <= chunkOffset + chunkSize) {
            formData.append('done', 1);
        }
        formData.append('chunk', chunk);
        request.open('POST', chunkURL, true);
        request.send(formData);
    }

    that.abort = function() {
        if (request) {
            request.abort();
            request = null;
        }
        return that;
    };
    that.pause = function() {
        paused = true;
        return that;
    };
    that.resume = function() {
        if (paused) {
            paused = false;
            if (nextChunkId) {
                uploadChunk(nextChunkId);
                nextChunkId = null;
            }
        }
        return that;
    };

    return that;

};
