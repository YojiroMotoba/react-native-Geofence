// import { Text, View } from 'react-native';

// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>Edit app/index.tsx to edit this screen.</Text>
//     </View>
//   );
// }

import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const GEOFENCE_TASK_NAME = 'GEOFENCE_TASK_NAME';

export default function Index() {
  const [status, setStatus] = useState('ジオフェンスの設定待ち...');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStatus('位置情報の許可が得られませんでした。');
        return;
      }

      await setupGeofencing();
    })();
  }, []);

  const setupGeofencing = async () => {
    // ジオフェンスの地点を設定
    const geofenceRegion = [
      {
        identifier: 'TokyoTower',
        latitude: 35.658581,
        longitude: 139.745433,
        radius: 100, // メートル単位
      },
    ];

    // ジオフェンスを開始
    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, geofenceRegion);
    setStatus('ジオフェンスを監視中...');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
    </View>
  );
}

TaskManager.defineTask(
  GEOFENCE_TASK_NAME,
  ({ data: { eventType, region }, error }) => {
    if (error) {
      console.error(error);
      return;
    }
    if (eventType === Location.GeofencingEventType.Enter) {
      console.log(`ジオフェンス内に入りました: ${region.identifier}`);
    } else if (eventType === Location.GeofencingEventType.Exit) {
      console.log(`ジオフェンス外に出ました: ${region.identifier}`);
    }
  }
);

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
