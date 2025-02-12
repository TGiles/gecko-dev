/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Default implementation of the helper class to assist in deleting the firefox protocols.
 * See maybeDeleteBridgeProtocolRegistryEntries for more info.
 */
class DeleteBridgeProtocolRegistryEntryHelperImplementation {
  getApplicationPath() {
    return Services.dirsvc.get("XREExeF", Ci.nsIFile).path;
  }

  openRegistryRoot() {
    const wrk = Cc["@mozilla.org/windows-registry-key;1"].createInstance(
      Ci.nsIWindowsRegKey
    );

    wrk.open(wrk.ROOT_KEY_CURRENT_USER, "Software\\Classes", wrk.ACCESS_ALL);

    return wrk;
  }

  deleteChildren(start) {
    // Recursively delete all of the children of the children
    // Go through the list in reverse order, so that shrinking
    // the list doesn't rearrange things while iterating
    for (let i = start.childCount; i > 0; i--) {
      const childName = start.getChildName(i - 1);
      const child = start.openChild(childName, start.ACCESS_ALL);
      this.deleteChildren(child);
      child.close();

      start.removeChild(childName);
    }
  }

  deleteRegistryTree(root, toDeletePath) {
    var start = root.openChild(toDeletePath, root.ACCESS_ALL);
    this.deleteChildren(start);
    start.close();

    root.removeChild(toDeletePath);
  }
}

export const FirefoxBridgeExtensionUtils = {
  /**
   * In Firefox 122, we enabled the firefox and firefox-private protocols.
   * We switched over to using firefox-bridge and firefox-private-bridge,
   *
   * but we want to clean up the use of the other protocols.
   *
   * deleteBridgeProtocolRegistryEntryHelper handles everything outside of the logic needed for
   * this method so that the logic in maybeDeleteBridgeProtocolRegistryEntries can be unit tested
   *
   * We only delete the entries for the firefox and firefox-private protocols if
   * they were set up to use this install and in the format that Firefox installed
   * them with. If the entries are changed in any way, it is assumed that the user
   * mucked with them manually and knows what they are doing.
   */
  maybeDeleteBridgeProtocolRegistryEntries(
    deleteBridgeProtocolRegistryEntryHelper = new DeleteBridgeProtocolRegistryEntryHelperImplementation()
  ) {
    try {
      var wrk = deleteBridgeProtocolRegistryEntryHelper.openRegistryRoot();
      const path = deleteBridgeProtocolRegistryEntryHelper.getApplicationPath();

      const maybeDeleteRegistryKey = (protocol, protocolCommand) => {
        const openCommandPath = protocol + "\\shell\\open\\command";
        if (wrk.hasChild(openCommandPath)) {
          let deleteProtocolEntry = false;

          try {
            var openCommandKey = wrk.openChild(
              openCommandPath,
              wrk.ACCESS_READ
            );
            if (openCommandKey.valueCount == 1) {
              const defaultKeyName = "";
              if (openCommandKey.getValueName(0) == defaultKeyName) {
                if (
                  openCommandKey.getValueType(defaultKeyName) ==
                  Ci.nsIWindowsRegKey.TYPE_STRING
                ) {
                  const val = openCommandKey.readStringValue(defaultKeyName);
                  if (val == protocolCommand) {
                    deleteProtocolEntry = true;
                  }
                }
              }
            }
          } finally {
            openCommandKey.close();
          }

          if (deleteProtocolEntry) {
            deleteBridgeProtocolRegistryEntryHelper.deleteRegistryTree(
              wrk,
              protocol
            );
          }
        }
      };

      maybeDeleteRegistryKey("firefox", `\"${path}\" -osint -url \"%1\"`);
      maybeDeleteRegistryKey(
        "firefox-private",
        `\"${path}\" -osint -private-window \"%1\"`
      );
    } catch (err) {
      console.error(err);
    } finally {
      wrk.close();
    }
  },

  /**
   * Registers the firefox-bridge and firefox-private-bridge protocols
   * on the Windows platform.
   */
  maybeRegisterFirefoxBridgeProtocols() {
    const FIREFOX_BRIDGE_HANDLER_NAME = "firefox-bridge";
    const FIREFOX_PRIVATE_BRIDGE_HANDLER_NAME = "firefox-private-bridge";
    const path = Services.dirsvc.get("XREExeF", Ci.nsIFile).path;
    let wrk = Cc["@mozilla.org/windows-registry-key;1"].createInstance(
      Ci.nsIWindowsRegKey
    );
    try {
      wrk.open(wrk.ROOT_KEY_CLASSES_ROOT, "", wrk.ACCESS_READ);
      let FxSet = wrk.hasChild(FIREFOX_BRIDGE_HANDLER_NAME);
      let FxPrivateSet = wrk.hasChild(FIREFOX_PRIVATE_BRIDGE_HANDLER_NAME);
      wrk.close();
      if (FxSet && FxPrivateSet) {
        return;
      }
      wrk.open(wrk.ROOT_KEY_CURRENT_USER, "Software\\Classes", wrk.ACCESS_ALL);
      const maybeUpdateRegistry = (isSetAlready, handler, protocolName) => {
        if (isSetAlready) {
          return;
        }
        let FxKey = wrk.createChild(handler, wrk.ACCESS_ALL);
        try {
          // Write URL protocol key
          FxKey.writeStringValue("", protocolName);
          FxKey.writeStringValue("URL Protocol", "");
          FxKey.close();
          // Write defaultIcon key
          FxKey.create(
            FxKey.ROOT_KEY_CURRENT_USER,
            "Software\\Classes\\" + handler + "\\DefaultIcon",
            FxKey.ACCESS_ALL
          );
          FxKey.open(
            FxKey.ROOT_KEY_CURRENT_USER,
            "Software\\Classes\\" + handler + "\\DefaultIcon",
            FxKey.ACCESS_ALL
          );
          FxKey.writeStringValue("", `\"${path}\",1`);
          FxKey.close();
          // Write shell\\open\\command key
          FxKey.create(
            FxKey.ROOT_KEY_CURRENT_USER,
            "Software\\Classes\\" + handler + "\\shell",
            FxKey.ACCESS_ALL
          );
          FxKey.create(
            FxKey.ROOT_KEY_CURRENT_USER,
            "Software\\Classes\\" + handler + "\\shell\\open",
            FxKey.ACCESS_ALL
          );
          FxKey.create(
            FxKey.ROOT_KEY_CURRENT_USER,
            "Software\\Classes\\" + handler + "\\shell\\open\\command",
            FxKey.ACCESS_ALL
          );
          FxKey.open(
            FxKey.ROOT_KEY_CURRENT_USER,
            "Software\\Classes\\" + handler + "\\shell\\open\\command",
            FxKey.ACCESS_ALL
          );
          if (handler == FIREFOX_PRIVATE_BRIDGE_HANDLER_NAME) {
            FxKey.writeStringValue(
              "",
              `\"${path}\" -osint -private-window \"%1\"`
            );
          } else {
            FxKey.writeStringValue("", `\"${path}\" -osint -url \"%1\"`);
          }
        } catch (ex) {
          console.error(ex);
        } finally {
          FxKey.close();
        }
      };

      try {
        maybeUpdateRegistry(
          FxSet,
          FIREFOX_BRIDGE_HANDLER_NAME,
          "URL:Firefox Bridge Protocol"
        );
      } catch (ex) {
        console.error(ex);
      }

      try {
        maybeUpdateRegistry(
          FxPrivateSet,
          FIREFOX_PRIVATE_BRIDGE_HANDLER_NAME,
          "URL:Firefox Private Bridge Protocol"
        );
      } catch (ex) {
        console.error(ex);
      }
    } catch (ex) {
      console.error(ex);
    } finally {
      wrk.close();
    }
  },
};
