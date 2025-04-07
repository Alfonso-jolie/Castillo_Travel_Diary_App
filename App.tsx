import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './context/ThemeContext.tsx';
import HomeScreen from './screens/HomeScreen.tsx';
import AddEntryScreen from './screens/AddEntryScreen.tsx';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, View, ActivityIndicator, Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();

type RootStackParamList = {
  Home: undefined;
  AddEntry: undefined;
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAndRequestPermissions();
  }, []);

  async function checkAndRequestPermissions() {
    try {
      // Check if this is the first launch
      const isFirstLaunch = await AsyncStorage.getItem('isFirstLaunch');
      
      if (!isFirstLaunch) {
        // Show welcome message and request permissions
        Alert.alert(
          'Welcome to Aljo\'s Travel Diary!',
          'To provide the best experience, we need to request some permissions:',
          [
            {
              text: 'Continue',
              onPress: async () => {
                await requestPermissions();
                await AsyncStorage.setItem('isFirstLaunch', 'false');
              }
            }
          ]
        );
      } else {
        // Just check permissions without showing the welcome message
        await requestPermissions();
      }
    } catch (error) {
      console.error('Error checking first launch:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function requestPermissions() {
    try {
      // Request Camera permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert(
          'Camera Access Required',
          'Camera access is needed to take photos for your travel memories. Please enable camera access in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
      }

      // Request Location permissions
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert(
          'Location Access Required',
          'Location access is needed to tag your travel memories with location data. Please enable location access in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
      }

      // Request Notification permissions
      if (Platform.OS === 'ios') {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Notifications Required',
            'Notifications are needed to remind you about your travel memories. Please enable notifications in your device settings to use this feature.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // For Android, we need to create a channel first
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Notifications Required',
            'Notifications are needed to remind you about your travel memories. Please enable notifications in your device settings to use this feature.',
            [{ text: 'OK' }]
          );
        }
      }

      // Initialize AsyncStorage
      try {
        const existingEntries = await AsyncStorage.getItem('travelEntries');
        if (!existingEntries) {
          await AsyncStorage.setItem('travelEntries', JSON.stringify([]));
        }
      } catch (error) {
        console.error('Error initializing AsyncStorage:', error);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0095f6" />
      </View>
  );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AddEntry" 
            component={AddEntryScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
