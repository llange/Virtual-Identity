/* ***** BEGIN LICENSE BLOCK *****
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

    The Original Code is the Virtual Identity Extension.

    The Initial Developer of the Original Code is Rene Ejury.
    Portions created by the Initial Developer are Copyright (C) 2011
    the Initial Developer. All Rights Reserved.

    Contributor(s):
 * ***** END LICENSE BLOCK ***** */

var EXPORTED_SYMBOLS = ["signatureSwitch"]

const {classes: Cc, interfaces: Ci, utils: Cu, results : Cr} = Components;
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://v_identity/vI_prefs.js");
Cu.import("resource://v_identity/vI_log.js");
let Log = setupLogging("virtualIdentity.signatureSwitch");

currentWindow = Cc["@mozilla.org/appshell/window-mediator;1"]
  .getService(Ci.nsIWindowMediator)
  .getMostRecentWindow(null);

function signatureSwitch(existingIdentity) {
  if (!signatureSwitchInstalled) return;
  
  // always try to initialize Security/Enigmail-Options
  try { setSecuritySettings(1); enigSetMenuSettings(''); } catch(vErr) { };
  
  if (!existingIdentity) {
    Log.debug("signatureSwitch hide/remove signatures\n");
    
    // code to hide the text signature
    if (vIprefs.get("hide_signature") && ss_signature.length == 0) {
      Log.debug("hide text/html signature");
      ss_main.signatureSwitch()
    }
    
    // code to hide the sMime signature
    if (vIprefs.get("hide_sMime_messageSignature")) {
      var element = currentWindow.document.getElementById("menu_securitySign1");
      if (element && element.getAttribute("checked") == "true") {
        Log.debug("signatureSwitch hide_sMime_messageSignature with doCommand\n");
        element.doCommand();
      }
    }

    // code to hide the openGPG signature
    if (vIprefs.get("hide_openPGP_messageSignature")) {
      var element = currentWindow.document.getElementById("enigmail_signed_send");
      if (element && element.getAttribute("checked") == "true") {
        var skipChangeGPGsign = false;
        // sometimes GPG delays changing with dialog, so don't act if EnigmailAlertWindow is open to prevent double changes
        var windows = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
          .getService(Components.interfaces.nsIWindowWatcher).getWindowEnumerator();
        while (windows.hasMoreElements()) {
          var window = windows.getNext();
          skipChangeGPGsign = skipChangeGPGsign || (window.document.title == EnigGetString("enigAlert"));
        }
        if (skipChangeGPGsign)
          Log.debug("signatureSwitch skip hide_openPGP_messageSignature - EnigMail AlertWindow open\n");
        else {
          Log.debug("signatureSwitch hide_openPGP_messageSignature with doCommand\n");
          element.doCommand();
        }
      }
    }
  }
  else {
    Log.debug("signatureSwitch restore signature\n");
    // code to show the text signature
    if (ss_signature.length > 0) {
      Log.debug("show text/html signature");
      ss_main.signatureSwitch()
    }
    // sMime and openGPG signature will not be re-added automatically
  }
}

let signatureSwitchInstalled = false;
// check for signature_switch extension
AddonManager.getAddonByID("{2ab1b709-ba03-4361-abf9-c50b964ff75d}", function(addon) {
  signatureSwitchInstalled = (addon && !addon.userDisabled && !addon.appDisable);
  if (signatureSwitchInstalled)
    Log.debug("Virtual Identity plugin for signatureSwitch Extension loaded!");
  else
    Log.debug("virtualIdentity is ready for signatureSwitch, but you don't use it\n");
  });