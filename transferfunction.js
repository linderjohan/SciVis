const currentPoint = null;
const CUTOFF = 35;

function renderHistogram(histogramData) {
    //What data do we neeeeed
    //Max of histogram data is really big, lets normalize it with log and a magic number
    histogramData = histogramData.map(item => Math.log(item/2000));
    let max = 0;
    // let max = Math.max(...histogramData);

    //Find the max, to normalize later. Skipping the CUTOFFs with noise
    histogramData.map((item, index) => {
        if(index >= CUTOFF && item > max) max = item;
    });

    //Get the svg element
    const svg = document.getElementById("svg");

    //Insert the first point, skipping the CUTOFFs
    let points = (`${(CUTOFF/255) * svg.clientWidth * 0.95}, ${svg.clientHeight}`);

    histogramData.forEach((item, index) => {
        //Insert the rest of the points at the bottom
        if(index > CUTOFF){
            points = points + (`
                                ${Math.round((index/255) * svg.clientWidth * 0.95)}, ${Math.round(svg.clientHeight - (item*255/max) * 0.95)}
                            `);
                            //This ugly but ye
        }
    });

    //Last point so we can fill in under the graph
    //Oklart varför jag gjort såhär men den kanske ska ändras någon gång eller något :ppppp
    const lastPoint = {
        x: svg.clientWidth * 0.95,
        y: svg.clientHeight
    }
    //Add the last point
    points = points + `${lastPoint.x}, ${lastPoint.y}`;

    //Draw the line
    let line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("style", "fill: rgb(250, 250, 250); stroke: rgb(150, 150, 150); stroke-width: 3;");
    line.setAttribute("id", "histogram");
    line.setAttribute("points", `${points}`);

    svg.appendChild(line);


}

function resize() {
  let canvas = document.getElementById("glCanvas");
  let svg = document.getElementById("svg");
  console.log(canvas.style);
  //canvas.width = window.clientWidth * 0.5 + "px";
  svg.style.width = window.clientWidth * 0.5 + "px";
}

function renderSVG(intensities) {
  const svg = document.getElementById("svg");
  let svgChildren = [ ...svg.childNodes ];

  svgChildren.forEach((item, i) => {
      if(item.id != "histogram" ) item.parentNode.removeChild(item);
  });

  intensities.forEach((item, i) => {
    let line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("style", "fill: none; stroke: black; stroke-width: 3;");
    line.setAttribute("points",
      `
        ${(item.min/255) * svg.clientWidth * 0.95}, ${svg.clientHeight - 7}
        ${(item.peak/255) * svg.clientWidth * 0.95}, ${svg.clientHeight - item.alphaC * 0.95}
        ${(item.max/255) * svg.clientWidth * 0.95}, ${svg.clientHeight - 7}
      `
    );
    line.addEventListener("mousedown", () => {currentPoint = i;});
    svg.appendChild(line);

    let peakcircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    peakcircle.setAttribute("r", "7");
    peakcircle.setAttribute("cx", (item.peak/255) * svg.clientWidth * 0.95);
    peakcircle.setAttribute("cy", svg.clientHeight - item.alphaC * 0.95);
    peakcircle.setAttribute("fill", `rgba(${item.redC}, ${item.greenC}, ${item.blueC}, ${1})`);
    peakcircle.setAttribute("stroke", "black");
    peakcircle.addEventListener("mousedown", () => {currentPoint = i;});
    svg.appendChild(peakcircle);

    let leftcircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    leftcircle.setAttribute("r", "7");
    leftcircle.setAttribute("cx", (item.min/255) * svg.clientWidth * 0.95);
    leftcircle.setAttribute("cy", svg.clientHeight - 7);
    leftcircle.setAttribute("fill", "black");
    leftcircle.addEventListener("mousedown", () => {currentPoint = i;});
    svg.appendChild(leftcircle);

    let rightcircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    rightcircle.setAttribute("r", "7");
    rightcircle.setAttribute("cx", (item.max/255) * svg.clientWidth * 0.95);
    rightcircle.setAttribute("cy", svg.clientHeight - 7);
    rightcircle.setAttribute("fill", "black");
    rightcircle.addEventListener("mousedown", () => {currentPoint = i;});
    svg.appendChild(rightcircle);
  });
}

// / This function is called when the transfer function texture on the GPU should be
// / updated.  Whether the transfer function values are computed here or just retrieved
// / from somewhere else is up to decide for the implementation.
//
// @param gl the OpenGL context
// @param transferFunction the texture object that is updated by this function
function updateTransferFunction(gl, transferFunction) {
  // Create a new array that holds the values for the transfer function.  The width of 256
  // is also hard-coded further down where the transferFunctionTexture OpenGL object is
  // created, so if you want to change it here, you have to change it there as well.  We
  // multiply the value by 4 as we have RGBA for each pixel.
  // Also we created the transfer function texture using the UNSIGNED_BYTE type, which
  // means that every value in the transfer function has to be between [0, 255]

  // This data should, at the end of your code, contain the information for the transfer
  // function.  Each value is stored sequentially (RGBA,RGBA,RGBA,...) for 256 values,
  // which get mapped to [0, 1] by OpenGL
  //let data = new Uint8Array(256 * 4);
  let data = new Uint8Array(256*4).fill(0);

  // for (let i = 0; i < CUTOFF * 4; i += 4) {
  //   // Set RGBA all to 0
  //   data[i] = 0;
  //   data[i + 1] = 0;
  //   data[i + 2] = 0;
  //   data[i + 3] = 0;
  // }

  ////////////////////////////////////////////////////////////////////////////////////////
  /// Beginning of the provided transfer function

  // The provided transfer function that you'll replace with your own solution is a
  // relatively simple ramp with the first 50 values being set to 0 to reduce the noise in
  // the image.  The remainder of the ramp is just using different angles for the color
  // components

  window.addEventListener('resize', resize);

  let color = document.querySelectorAll(".color");
  let intensityInterval = document.querySelectorAll(".intensityInterval");
  let alphaChannel = document.querySelectorAll(".alphaChannel");
  let width = document.querySelectorAll(".width");

  const intensities = [];
  intensityInterval.forEach((item, i) => {
    intensities.push({
      min: parseInt(item.value) - parseInt(width[i].value),
      max: parseInt(item.value) + parseInt(width[i].value),
      peak: parseInt(item.value),
      redC: parseInt(color[i].childNodes[1].value),
      greenC: parseInt(color[i].childNodes[3].value),
      blueC: parseInt(color[i].childNodes[5].value),
      alphaC: parseInt(alphaChannel[i].value),
    });
  });

  //Black color to interpolate to
  const black = {
      redC: 0,
      greenC: 0,
      blueC: 0,
      alphaC: 0
  };

  for (let i = CUTOFF * 4; i < 256 * 4; i += 4) {
    // convert i into a value [0, 256] and set it
    let it = i / 4;
    let result = {red: 0, green: 0, blue: 0, alpha: 0};

    intensities.forEach(item => {
        if(item.alphaC < 1.0) return;

        if(it > item.min && it < item.max) {
            let procentBlack, procentColor;
            if(it == item.peak){
                procentBlack = 0;
                procentColor = 1;
            }
            else {
                let width = item.peak - item.min;
                procentBlack = Math.abs(item.peak - it) / width;
                procentColor = Math.min(Math.abs(it - item.min), Math.abs(item.max - it)) / width;
            }
            result.red = result.red + item.redC * procentColor + black.redC * procentBlack;
            result.green = result.green + item.greenC * procentColor + black.greenC * procentBlack;
            result.blue = result.blue + item.blueC * procentColor + black.blueC * procentBlack;
            result.alpha = result.alpha + item.alphaC * procentColor + black.alphaC * procentBlack;
        }
    });
    if(result.alpha > 0.0) {
      data[i] = result.red;
      data[i + 1] = result.green;
      data[i + 2] = result.blue;
      data[i + 3] = result.alpha;
    }
  }

  renderSVG(intensities);

  /// End of the provided transfer function
  ////////////////////////////////////////////////////////////////////////////////////////

  // @TODO:  Replace the transfer function specification above with your own transfer
  //         function editor result

  // Upload the new data to the texture
  console.log(117, "Updating the transfer function texture");
  gl.bindTexture(gl.TEXTURE_2D, transferFunction);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
}
