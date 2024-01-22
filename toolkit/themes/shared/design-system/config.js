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
  let file = args.file;
  const selector = args.options.selector ? args.options.selector : `:root`;
  const indentation = args.options.indentation ? args.options.indentation: 2;
  let modifiedDictionary = dictionary.allTokens.map(token => {
    let value = JSON.stringify(token.value);
    // the `dictionary` object now has `usesReference()` and
    // `getReferences()` methods. `usesReference()` will return true if
    // the value has a reference in it. `getReferences()` will return
    // an array of references to the whole tokens so that you can access their
    // names or any other attributes.
    if (dictionary.usesReference(token.original.value) && token.original.darkValue) {
      // Note: make sure to use `token.original.value` because
      // `token.value` is already resolved at this point.
      const lightRefs = dictionary.getReferences(token.original.value);
      const darkRefs = dictionary.getReferences(token.original.darkValue);
      for (let i = 0; i < darkRefs.length; i++) {
        let currentLight = lightRefs[i].name;
        let currentDark = darkRefs[i].name;
        value = `light-dark(var(--${currentLight}), var(--${currentDark}))`;
        token.value = value;
      }
    }
    return token;
  });
  dictionary.allTokens = modifiedDictionary;
  let mappedValues = modifiedDictionary.map(element => {
    let joinedValue = `${" ".repeat(indentation)}--${element.name}: ${element.value};`
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
      }]
    }
  }
}
