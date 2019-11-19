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
  let data = new Uint8Array(256 * 4);


  ////////////////////////////////////////////////////////////////////////////////////////
  /// Beginning of the provided transfer function

  // The provided transfer function that you'll replace with your own solution is a
  // relatively simple ramp with the first 50 values being set to 0 to reduce the noise in
  // the image.  The remainder of the ramp is just using different angles for the color
  // components

  const cutoff = 50;

  const interval = 25;

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

  for (let i = 0; i < cutoff * 4; i += 4) {
    // Set RGBA all to 0
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
  }

  // For now, just create a linear ramp from 0 to 1. We start at the cutoff value and fill
  // the rest of the array
  const black = {
      redC: 0,
      greenC: 0,
      blueC: 0,
      alphaC: 0
  };

  for (let i = cutoff * 4; i < 256 * 4; i += 4) {
    // convert i into a value [0, 256] and set it
    let it = i / 4;
    let result = {red: 0, green: 0, blue: 0, alpha: 0};

    intensities.forEach(item => {
      if(it > item.min && it < item.peak){
        let width = item.peak - item.min;
        let a = Math.abs(item.peak - it)/ width;
        let b = Math.abs(it - item.min)/ width;

        result.red = result.red + item.redC * b + black.redC * a;
        result.green = result.green + item.greenC * b + black.greenC * a;
        result.blue = result.blue + item.blueC * b + black.blueC * a;
        result.alpha = result.alpha + item.alphaC * b + black.alphaC * a;
      }
      else if(it == item.peak){
          result.red = result.red + item.redC;
          result.green = result.green + item.greenC;
          result.blue = result.blue + item.blueC;
          result.alpha = result.alpha + item.alphaC;
      }
      else if(it < item.max && it > item.peak){
          let width = item.max - item.peak;
          let a = Math.abs(it - item.peak)/ width;
          let b = Math.abs(item.max - it)/ width;

          result.red = result.red + item.redC * b + black.redC * a;
          result.green = result.green + item.greenC * b + black.greenC * a;
          result.blue = result.blue + item.blueC * b + black.blueC * a;
          result.alpha = result.alpha + item.alphaC * b + black.alphaC * a;
      }

    });
    if(result.alpha > 0.0) {
      data[i] = result.red;
      data[i + 1] = result.green;
      data[i + 2] = result.blue;
      data[i + 3] = result.alpha;
    }
  }

  /// End of the provided transfer function
  ////////////////////////////////////////////////////////////////////////////////////////

  // @TODO:  Replace the transfer function specification above with your own transfer
  //         function editor result

  // Upload the new data to the texture
  console.log(117, "Updating the transfer function texture");
  gl.bindTexture(gl.TEXTURE_2D, transferFunction);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
}
