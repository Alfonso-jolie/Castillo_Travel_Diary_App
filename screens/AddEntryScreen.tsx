import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext.tsx';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  AddEntry: undefined;
  Home: undefined;
};

type AddEntryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AddEntry'>;
};

const AddEntryScreen: React.FC<AddEntryScreenProps> = ({ navigation }) => {
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const isFocused = useIsFocused();

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (!isFocused) {
      // Clear form when screen loses focus
      setImage(null);
      setLocation(null);
      setAddress('');
      setTitle('');
      setDescription('');
    }
  }, [isFocused]);

  const requestPermissions = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      
      if (cameraStatus !== 'granted' || locationStatus !== 'granted' || notificationStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera, location, and notification permissions are required for this feature.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const pickImage = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        await getLocation();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
      console.error('Error picking image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        await getLocation();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
      console.error('Error taking picture:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocation = async () => {
    try {
      setIsLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      
      if (addressResponse && addressResponse.length > 0) {
        const addr = addressResponse[0];
        const formattedAddress = [
          addr.street,
          addr.city,
          addr.region,
          addr.country
        ].filter(Boolean).join(', ');
        setAddress(formattedAddress);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location. Please try again.');
      console.error('Error getting location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!image || !title.trim() || !description.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields and take a picture');
      return;
    }

    try {
      setIsLoading(true);
      const newEntry = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        image,
        location,
        address,
        date: new Date().toISOString(),
      };

      const existingEntriesStr = await AsyncStorage.getItem('travelEntries');
      const existingEntries = existingEntriesStr ? JSON.parse(existingEntriesStr) : [];
      const updatedEntries = [...existingEntries, newEntry];
      
      await AsyncStorage.setItem('travelEntries', JSON.stringify(updatedEntries));

      // Configure notification handler
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      // Schedule the notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Travel Entry Saved! 📸',
          body: `Your entry "${title}" has been saved successfully!`,
          data: { screen: 'Home' },
        },
        trigger: null, // null means show immediately
      });

      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
      console.error('Error saving entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333333' : '#dbdbdb' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={28} color={isDarkMode ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            New Post
          </Text>
          <TouchableOpacity onPress={toggleTheme} style={styles.headerButton}>
            <Ionicons 
              name={isDarkMode ? "sunny" : "moon"} 
              size={24} 
              color={isDarkMode ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={() => setImage(null)}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePickerContainer}>
              <View style={[
                styles.imagePlaceholder, 
                { backgroundColor: isDarkMode ? '#333333' : '#f5f5f5' }
              ]}>
                <Ionicons 
                  name="images-outline" 
                  size={64} 
                  color={isDarkMode ? '#ffffff' : '#000000'} 
                />
                <Text style={[
                  styles.placeholderText, 
                  { color: isDarkMode ? '#ffffff' : '#000000' }
                ]}>
                  No Photo Selected
                </Text>
              </View>
              
              <View style={styles.imagePickerButtons}>
                <TouchableOpacity 
                  style={[styles.pickButton, { backgroundColor: '#0095f6' }]} 
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={20} color="#ffffff" />
                  <Text style={styles.pickButtonText}>Choose from Gallery</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.pickButton, { backgroundColor: '#0095f6' }]} 
                  onPress={takePicture}
                >
                  <Ionicons name="camera" size={20} color="#ffffff" />
                  <Text style={styles.pickButtonText}>Take Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.form}>
            <TextInput
              style={[
                styles.input,
                { 
                  color: isDarkMode ? '#ffffff' : '#000000',
                  backgroundColor: isDarkMode ? '#333333' : '#f5f5f5',
                }
              ]}
              placeholder="Add a title..."
              placeholderTextColor={isDarkMode ? '#888888' : '#999999'}
              value={title}
              onChangeText={setTitle}
            />

            {address && (
              <View style={[
                styles.locationContainer,
                { backgroundColor: isDarkMode ? '#333333' : '#f5f5f5' }
              ]}>
                <Ionicons name="location" size={20} color="#0095f6" />
                <Text style={[styles.locationText, { color: isDarkMode ? '#ffffff' : '#666666' }]}>
                  {address}
                </Text>
              </View>
            )}

            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
                { 
                  color: isDarkMode ? '#ffffff' : '#000000',
                  backgroundColor: isDarkMode ? '#333333' : '#f5f5f5',
                }
              ]}
              placeholder="Write a caption..."
              placeholderTextColor={isDarkMode ? '#888888' : '#999999'}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.saveButton,
              { 
                opacity: isLoading || !image ? 0.5 : 1,
                backgroundColor: '#0095f6'
              }
            ]} 
            onPress={saveEntry}
            disabled={isLoading || !image}
          >
            <Text style={styles.saveButtonText}>Share</Text>
          </TouchableOpacity>
        </ScrollView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0095f6" />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  imagePickerContainer: {
    marginBottom: 24,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  imagePickerButtons: {
    gap: 12,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  pickButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  descriptionInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  saveButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddEntryScreen;
