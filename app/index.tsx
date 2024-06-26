import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const GEOFENCE_TASK_NAME = 'EXAMPLE_APP_GEOFENCE_TASK';

TaskManager.defineTask(
  GEOFENCE_TASK_NAME,
  ({ data: { eventType, region }, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (eventType === Location.GeofencingEventType.Enter) {
      console.log(`ジオフェンス内に入りました: ${region.identifier}`);
      sendNotification(`ジオフェンス内に入りました: ${region.identifier}`);
      DeviceEventEmitter.emit('geofenceChange', {
        status: 'フェンスの中にいます',
        region,
      });
    } else if (eventType === Location.GeofencingEventType.Exit) {
      console.log(`ジオフェンス外に出ました: ${region.identifier}`);
      sendNotification(`ジオフェンス外に出ました: ${region.identifier}`);
      DeviceEventEmitter.emit('geofenceChange', {
        status: 'フェンスの外にいます',
        region,
      });
    }
  }
);

export default function Index() {
  const [status, setStatus] = useState('ジオフェンスの設定待ち...');
  const [geoStatus, setGeoStatus] = useState(
    'フェンスの外なのか中なのか分からない。。！'
  );

  async function setupNotifications() {
    // 通知のパーミッションをリクエスト
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Androidの場合は通知チャンネルを設定
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('geofence-channel', {
        name: 'Geofence Channel',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    return true;
  }

  async function requestLocationPermissions() {
    // フォアグラウンドでの位置情報アクセス許可をリクエスト
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.log('Foreground location permission not granted');
      return false;
    }

    // バックグラウンドでの位置情報アクセス許可をリクエスト
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.log('Background location permission not granted');
      return false;
    }

    const setupResult = await setupNotifications();
    if (!setupResult) {
      return false;
    }
    return true;
  }

  useEffect(() => {
    (async () => {
      const hasPermissions = await requestLocationPermissions();
      if (!hasPermissions) {
        setStatus('位置情報の許可が得られませんでした。');
        return;
      }

      await setupGeofencing();

      const subscription = DeviceEventEmitter.addListener(
        'geofenceChange',
        (data) => {
          setGeoStatus(`${data.region.identifier}の${data.status}`);
        }
      );

      return () => subscription.remove();
    })();
  }, []);

  const setupGeofencing = async () => {
    // ジオフェンスの地点を設定
    const geofenceRegion = [
      {
        identifier: 'リバスタ',
        latitude: 35.652147041268194,
        longitude: 139.79803325129706,
        radius: 50,
      },
    ];

    // ジオフェンスを開始
    try {
      console.log('Location.startGeofencingAsync');
      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, geofenceRegion);
    } catch (e) {
      console.error(JSON.stringify(e));
    }
    setStatus('ジオフェンスを監視中...');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
      <Text style={styles.text}>{geoStatus}</Text>
    </View>
  );
}

async function sendNotification(message: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Geofence Alert',
      body: message,
      data: { data: 'goes here' },
    },
    trigger: null, // すぐに通知
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});
