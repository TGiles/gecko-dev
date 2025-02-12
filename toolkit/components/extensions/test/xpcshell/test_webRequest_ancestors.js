"use strict";

var { WebRequest } = ChromeUtils.importESModule(
  "resource://gre/modules/WebRequest.sys.mjs"
);
var { ExtensionParent } = ChromeUtils.importESModule(
  "resource://gre/modules/ExtensionParent.sys.mjs"
);

const server = createHttpServer({ hosts: ["example.com"] });
server.registerDirectory("/data/", do_get_file("data"));

add_task(async function setup() {
  // When WebRequest.jsm is used directly instead of through ext-webRequest.js,
  // ExtensionParent.apiManager is not automatically initialized. Do it here.
  await ExtensionParent.apiManager.lazyInit();
});

add_task(async function test_ancestors_exist() {
  let deferred = Promise.withResolvers();
  function onBeforeRequest(details) {
    info(`onBeforeRequest ${details.url}`);
    Assert.strictEqual(
      typeof details.frameAncestors,
      "object",
      `ancestors exists [${typeof details.frameAncestors}]`
    );
    deferred.resolve();
  }

  WebRequest.onBeforeRequest.addListener(
    onBeforeRequest,
    { urls: new MatchPatternSet(["http://example.com/*"]) },
    ["blocking"]
  );

  let contentPage = await ExtensionTestUtils.loadContentPage(
    "http://example.com/data/file_sample.html"
  );
  await deferred.promise;
  await contentPage.close();

  WebRequest.onBeforeRequest.removeListener(onBeforeRequest);
});

add_task(async function test_ancestors_null() {
  let deferred = Promise.withResolvers();
  function onBeforeRequest(details) {
    info(`onBeforeRequest ${details.url}`);
    Assert.strictEqual(
      details.frameAncestors,
      undefined,
      "ancestors do not exist"
    );
    deferred.resolve();
  }

  WebRequest.onBeforeRequest.addListener(onBeforeRequest, null, ["blocking"]);

  function fetch(url) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.mozBackgroundRequest = true;
      xhr.open("GET", url);
      xhr.onload = () => {
        resolve(xhr.responseText);
      };
      xhr.onerror = () => {
        reject(xhr.status);
      };
      // use a different contextId to avoid auth cache.
      xhr.setOriginAttributes({ userContextId: 1 });
      xhr.send();
    });
  }

  await fetch("http://example.com/data/file_sample.html");
  await deferred.promise;

  WebRequest.onBeforeRequest.removeListener(onBeforeRequest);
});
