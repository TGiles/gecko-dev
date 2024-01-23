/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env node */

const StyleDictionary = require("style-dictionary");
const { fileHeader } = StyleDictionary.formatHelpers;

/**
 * CSS formatter that converts tokens that have a light and dark value
 * to a light-dark() function. If we try to use the built-in CSS formatter,
 * we will lose the "darkValue" or any other property that isn't "value".
 */
function lightDarkFormatter(args) {
  let dictionary = args.dictionary;
  let modifiedDictionary = dictionary.allTokens.map(token => {
    // the `dictionary` object now has `usesReference()` and
    // `getReferences()` methods. `usesReference()` will return true if
    // the value has a reference in it. `getReferences()` will return
    // an array of references to the whole tokens so that you can access their
    // names or any other attributes.
    if (token.original.dark) {
      // Note: make sure to use `token.original.value` because
      // `token.value` is already resolved at this point.
      const lightRefs = dictionary.getReferences(token.original.value);
      const darkRefs = dictionary.getReferences(token.original.dark);
      if (lightRefs.length > 0 || darkRefs.length > 0) {
        for (let i = 0; i < darkRefs.length; i++) {
          let currentLightName = lightRefs[i]?.name;
          let currentDarkName = darkRefs[i]?.name;
          let lightValue = currentLightName ? 
          `var(--${currentLightName})` : `${token.original.value}`;
          let darkValue = currentDarkName ?
          `var(--${currentDarkName})` : `${token.original.dark}`;
          token.value = `light-dark(${lightValue}, ${darkValue})`
        }
      } else {
        value = `light-dark(${token.original.value}, ${token.original.dark})`;
        token.value = value;
      }
    }
    return token;
  });
  dictionary.allTokens = modifiedDictionary;
  return StyleDictionary.format["css/variables"]({...args, dictionary});
}

module.exports = {
  source: ["design-tokens.json"],
  format: {
    "css/variables/light-dark": lightDarkFormatter,
  },
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "build/css/",
      files: [{
        destination: "light-dark.css",
        format: "css/variables/light-dark",
        options: {
          outputReferences: true,
        }
      }]
    }
  }
}
