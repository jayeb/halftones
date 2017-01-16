window.Halftoner = (function setupApp(window, document) {
  var MAX_RADIUS = 2,
      SVG_NS = 'http://www.w3.org/2000/svg',
      SVG_TEMPLATE,
      App;

  function readFile(file) {
    if (!file) {
      return Promise.reject('No file provided');
    }

    return new Promise(function readThatShit(resolve, reject) {
      var fileReader = new FileReader();

      fileReader.onload = function onLoad() {
        resolve(fileReader.result);
      };

      fileReader.onError = reject;

      fileReader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    if (!src) {
      return Promise.reject('No image source provided');
    }

    return new Promise(function loadThatShit(resolve, reject) {
      $('<img/>', {
        one: {
            load: function () {
                resolve(this);
              },
            error: reject
          },
        src: src
      });
    });
  }

  function getDataFromImage(image, canvasWidth) {
    var canvasEl = document.createElement('canvas'),
        context;

    canvasEl.width = (canvasWidth) + 1;
    canvasEl.height = ((canvasWidth / image.width) * image.height) + 1;

    context = canvasEl.getContext('2d');

    context.drawImage(image, 0, 0, canvasEl.width, canvasEl.height);

    return context.getImageData(0, 0, canvasEl.width, canvasEl.height);
  }

  function getLumaValuesFromImageData(imageData) {
    return _.chain(imageData.data)
      .chunk(4)
      .map(_.spread(function calculateLuma(r, g, b, a) {
          return (r * 0.299) + (g * 0.587) + (b * 0.114);
        }))
      .chunk(imageData.width)
      .value();
  }

  function drawCircles(lumaValues, grid) {
    var groupEl = document.createElementNS(SVG_NS, 'g');

    _.each(lumaValues, function forRow(lumeValueRow, row) {
      _.each(lumeValueRow, function forColumn(lumaValue, column) {
        var radius,
            shapeEl;

        if (((column % 2) - (row % 2)) % 2) {
          radius = ((255 - lumaValue) / 255) * MAX_RADIUS * (grid / 2);

          // Round radius values to tenths
          radius = Math.round(radius * 10) / 10;

          if (!!radius) {
            shapeEl = document.createElementNS(SVG_NS, 'circle');

            shapeEl.setAttribute('cx', column * grid);
            shapeEl.setAttribute('cy', row * grid);
            shapeEl.setAttribute('r', radius);

            groupEl.appendChild(shapeEl);
          }
        }
      });
    });

    return groupEl;
  }

  function buildFileFromSVG($svg, compressed) {
    var groupHTML,
        fileContents;

    if (!$svg) {
      return Promise.reject('No SVG element provided');
    }

    groupHTML = $svg.find('g').get(0).outerHTML;

    groupHTML = '  ' + groupHTML;
    groupHTML = groupHTML.replace(/<circle/g, '\n    <circle');
    groupHTML = groupHTML.replace(/><\/circle>/g, '/>');
    groupHTML = groupHTML.replace(/<\/g>/g, '\n  </g>');

    fileContents = SVG_TEMPLATE({
      width: $svg.width(),
      height: $svg.height(),
      output: groupHTML
    });

    if (!!compressed) {
      fileContents = fileContents.replace(/\n\s*/g, '');
    }

    return new File([fileContents], 'halftone.svg', {
      type: 'image/svg+xml'
    });
  }

  SVG_TEMPLATE = _.template(
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
    'width="<%= width %>" height="<%= height %>" viewBox="0 0 <%= width %> <%= height %>">\n' +
    '<%= output %>\n' +
    '</svg>'
  );

  App = new Vue({
    el: '#app',
    data: {
        file: undefined,
        dotSize: 3,
        svgWidth: 480,
        imageData: undefined,
        halftoneFile: undefined
      },
    computed: {
        hasSVG: function () {
            return !!this.$svg;
          },
        svgGrid: function () {
            return this.svgWidth / this.dotSize;
          },
        halftoneFileSize: function () {
          var size = _.get(this, 'halftoneFile.size');

          if (!size) {
            return;
          }

          return Math.round(size / 1024) + ' KB';
        }
      },
    methods: {
        setFile: function (event) {
            if (event && event.target) {
              this.file = event.target.files[0];
            }
          },
        renderSVG: function () {
            var th = this,
                $svg;

            if (!!event) {
              event.preventDefault();
            }

            if (this.$svg) {
              this.$svg.detach().empty();
            }

            return readFile(this.file)
              .then(loadImage)
              .then(function afterLoad(image) {
                  var svgEl;

                  // Setup SVG element
                  svgEl = document.createElementNS(SVG_NS, 'svg');

                  th.$svg = $(svgEl).appendTo('#svg-container')
                    .width(th.svgWidth)
                    .height(Math.floor((th.svgWidth / image.width) * image.height));

                  return getDataFromImage(image, th.svgGrid);
                })
              .then(getLumaValuesFromImageData)
              .then(_.partialRight(drawCircles, th.dotSize))
              .then(function appendToSVG(groupEl) {
                  return th.$svg.append(groupEl);
                })
              .then(function buildFile($svg) {
                  th.halftoneFile = buildFileFromSVG($svg);
                });
          },
        downloadSVG: function () {
            saveAs(this.halftoneFile);
          }
      }
  });
})(window, document);
