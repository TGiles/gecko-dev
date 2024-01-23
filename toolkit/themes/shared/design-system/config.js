/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* eslint-env node */

const StyleDictionary = require("style-dictionary");
const { fileHeader, sortByReference } = StyleDictionary.formatHelpers;

/**
 * CSS formatter that converts tokens that have a light and dark value
 * to a light-dark() function. If we try to use the built-in CSS formatter,
 * we will lose the "dark" value or any other property that isn't "value".
 */
function lightDarkFormatter(args) {
  let dictionary = args.dictionary;
  let indentation = args.indentation ? args.indentation : "  ";
  let file = args.file;
  let selector = args.selector ? args.selector : `:root`;
  // Sort references after their definition
  dictionary.allTokens = [...dictionary.allTokens].sort(sortByReference(dictionary));
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
      let currentLightName = lightRefs[0]?.name;
      let currentDarkName = darkRefs[0]?.name;
      let lightValue = currentLightName ?
        `var(--${currentLightName})` : `${token.original.value}`;
      let darkValue = currentDarkName ?
        `var(--${currentDarkName})` : `${token.original.dark}`;
      token.value = `light-dark(${lightValue}, ${darkValue})`
    }
    return token;
  });
  dictionary.allTokens = modifiedDictionary;

  // We have to manually format the generated tokens into the file.
  // If we try to use the formattedVariables() helper with the CSS format
  // and outputReferences: true, then we will lose our light-dark() function.
  let mappedValues = modifiedDictionary.map(element => {
    let joinedValue = `${indentation}--${element.name}: ${element.value};`
    return joinedValue;
  }).join("\n");
  return `${fileHeader({ file })}\n${selector} {\n${mappedValues}\n}`;
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
