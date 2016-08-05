/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PermissionsAndroid
 * @flow
 */
'use strict';

const DialogManagerAndroid = require('NativeModules').DialogManagerAndroid;
const AndroidPermissions = require('NativeModules').AndroidPermissions;

/**
 * `PermissionsAndroid` provides access to Android M's new permissions model.
 * Some permissions are granted by default when the application is installed
 * so long as they appear in `AndroidManifest.xml`. However, "dangerous"
 * permissions require a dialog prompt. You should use this module for those
 * permissions.
 *
 * On devices before SDK version 23, the permissions are automatically granted
 * if they appear in the manifest, so `checkPermission` and `requestPermission`
 * should always be true.
 *
 * If a user has previously turned off a permission that you prompt for, the OS
 * will advise your app to show a rationale for needing the permission. The
 * `requestPermissionWithRationale` method will show a dialog prompt only if
 * necessary - otherwise the normal permission prompt will appear.
 *
 * ### Example
 * ```
 * async function requestCameraPermission() {
 *   try {
 *     let granted = await AndroidPermissions.requestPermissionWithRationale(
 *       AndroidPermissions.PERMISSIONS.CAMERA,
 *       'Cool Photo App Camera Permission',
 *       'Cool Photo App needs access to your camera ' +
 *       'so you can take awesome pictures.'
 *     )
 *     if (granted) {
 *       console.log("You can use the camera")
 *     } else {
 *       console.log("Camera permission denied")
 *     }
 *   } catch (err) {
 *     console.warn(err)
 *   }
 * }
 *```
 *
 */

class PermissionsAndroid {
  /**
  * A list of specified "dangerous" permissions that require prompting the user
  */
  PERMISSIONS: Object = {
    READ_CALENDAR: 'android.permission.READ_CALENDAR',
    WRITE_CALENDAR: 'android.permission.WRITE_CALENDAR',
    CAMERA: 'android.permission.CAMERA',
    READ_CONTACTS: 'android.permission.READ_CONTACTS',
    WRITE_CONTACTS: 'android.permission.WRITE_CONTACTS',
    GET_ACCOUNTS:  'android.permission.GET_ACCOUNTS',
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    READ_PHONE_STATE: 'android.permission.READ_PHONE_STATE',
    CALL_PHONE: 'android.permission.CALL_PHONE',
    READ_CALL_LOG: 'android.permission.READ_CALL_LOG',
    WRITE_CALL_LOG: 'android.permission.WRITE_CALL_LOG',
    ADD_VOICEMAIL: 'com.android.voicemail.permission.ADD_VOICEMAIL',
    USE_SIP: 'android.permission.USE_SIP',
    PROCESS_OUTGOING_CALLS: 'android.permission.PROCESS_OUTGOING_CALLS',
    BODY_SENSORS:  'android.permission.BODY_SENSORS',
    SEND_SMS: 'android.permission.SEND_SMS',
    RECEIVE_SMS: 'android.permission.RECEIVE_SMS',
    READ_SMS: 'android.permission.READ_SMS',
    RECEIVE_WAP_PUSH: 'android.permission.RECEIVE_WAP_PUSH',
    RECEIVE_MMS: 'android.permission.RECEIVE_MMS',
    READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
    WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
  };

  /**
  * Returns a promise resolving to a boolean value as to whether the specified
  * permissions has been granted
  */
  checkPermission(permission: string) : Promise<boolean> {
    return new Promise((resolve, reject) => {
      AndroidPermissions.checkPermission(
        permission,
        (perm: string, result: boolean) => {
          resolve(result);
        },
        (error: string) => {
          reject(error);
        }
      );
    });
  }

  /**
  * Prompts the user to enable a permission and returns a promise resolving to a
  * boolean value indicating whether the user allowed or denied the request
  */
  requestPermission(permission: string) : Promise<boolean> {
    return new Promise((resolve, reject) => {
      AndroidPermissions.requestPermission(
        permission,
        (perm: string, result: boolean) => {
          resolve(result);
        },
        (error: string) => {
          reject(error);
        }
      );
    });
  }

  /**
  * Checks with the OS whether it is necessary to show a dialog explaining why
  * the permission is needed, and then either shows the dialog and then requests
  * the specified permissions or just requests it immediately. Returns a promise
  * that resolves to a boolean indicating whether the user allowed or denied the
  * request.
  *
  * https://developer.android.com/training/permissions/requesting.html#explain
  */
  requestPermissionWithRationale(permission: string, title: string, message: string) : Promise<boolean> {
    return new Promise((resolve, reject) => {
      let requestPermission = () => {
        this.requestPermission(permission)
          .then((granted) => resolve(granted))
          .catch((err) => reject(err));
      };

      AndroidPermissions.shouldShowRequestPermissionRationale(
        permission,
        (perm: string, shouldShow: boolean) => {
          if (shouldShow) {
            DialogManagerAndroid.showAlert(
              {
                title: title,
                message: message,
              },
              () => {
                DialogManagerAndroid.showAlert({message: 'Error Requesting Permissions'}, {}, {});
                reject();
              },
              requestPermission
            );
          } else {
            requestPermission();
          }
        },
        (error: string) => {
          reject(error);
        }
      );
    });
  }
}

PermissionsAndroid = new PermissionsAndroid();

module.exports = PermissionsAndroid;
