import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext.tsx';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const numColumns = 3;
const gap = 1;
const itemWidth = (width - (numColumns + 1) * gap) / numColumns;

type TravelEntry = {
  id: string;
  title: string;
  description: string;
  image: string;
  address: string;
  date: string;
};

type RenderItemProps = {
  item: TravelEntry;
  index: number;
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleTheme } = useTheme();
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const [savedPosts, setSavedPosts] = useState<{ [key: string]: boolean }>({});
  const [commentedPosts, setCommentedPosts] = useState<{ [key: string]: boolean }>({});
  const [sharedPosts, setSharedPosts] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadEntries();
    loadActionStates();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const entriesStr = await AsyncStorage.getItem('travelEntries');
      
      if (entriesStr) {
        try {
          const parsedEntries = JSON.parse(entriesStr);
          // Ensure we have valid entries with required properties
          const validEntries = parsedEntries.filter((entry: TravelEntry) => 
            entry.id && entry.title && entry.description && entry.image
          );
          setEntries(validEntries);
        } catch (error) {
          console.error('Error parsing entries:', error);
          setEntries([]);
        }
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      Alert.alert('Error', 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  };

  const loadActionStates = async () => {
    try {
      const [liked, commented, shared, saved] = await Promise.all([
        AsyncStorage.getItem('likedPosts'),
        AsyncStorage.getItem('commentedPosts'),
        AsyncStorage.getItem('sharedPosts'),
        AsyncStorage.getItem('savedPosts'),
      ]);

      if (liked) setLikedPosts(JSON.parse(liked));
      if (commented) setCommentedPosts(JSON.parse(commented));
      if (shared) setSharedPosts(JSON.parse(shared));
      if (saved) setSavedPosts(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading action states:', error);
    }
  };

  const removeEntry = async (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedEntries = entries.filter(entry => entry.id !== id);
              await AsyncStorage.setItem('travelEntries', JSON.stringify(updatedEntries));
              setEntries(updatedEntries);
            } catch (error) {
              console.error('Error removing entry:', error);
              Alert.alert('Error', 'Failed to remove entry');
            }
          },
        },
      ]
    );
  };

  const toggleAction = async (id: string, type: 'like' | 'comment' | 'share' | 'save') => {
    try {
      let newState: { [key: string]: boolean } = {};
      let storageKey = '';

      switch (type) {
        case 'like':
          newState = { ...likedPosts, [id]: !likedPosts[id] };
          setLikedPosts(newState);
          storageKey = 'likedPosts';
          break;
        case 'comment':
          newState = { ...commentedPosts, [id]: !commentedPosts[id] };
          setCommentedPosts(newState);
          storageKey = 'commentedPosts';
          break;
        case 'share':
          newState = { ...sharedPosts, [id]: !sharedPosts[id] };
          setSharedPosts(newState);
          storageKey = 'sharedPosts';
          break;
        case 'save':
          newState = { ...savedPosts, [id]: !savedPosts[id] };
          setSavedPosts(newState);
          storageKey = 'savedPosts';
          break;
      }

      await AsyncStorage.setItem(storageKey, JSON.stringify(newState));
    } catch (error) {
      console.error('Error toggling action:', error);
    }
  };

  const renderPost = ({ item }: { item: TravelEntry }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <View style={styles.profileImage}>
            <Ionicons name="person-circle" size={40} color={isDarkMode ? '#ffffff' : '#000000'} />
          </View>
          <View>
            <Text style={[styles.username, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              Aljo's Travel Diary
            </Text>
            <Text style={[styles.location, { color: isDarkMode ? '#999999' : '#666666' }]}>
              {item.address}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => removeEntry(item.id)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
      </View>

      <Image
        source={{ uri: item.image }}
        style={styles.postImage}
        resizeMode="cover"
      />

      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => toggleAction(item.id, 'like')}
          >
            <Ionicons 
              name={likedPosts[item.id] ? "heart" : "heart-outline"} 
              size={28} 
              color={likedPosts[item.id] ? '#ff3040' : isDarkMode ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => toggleAction(item.id, 'comment')}
          >
            <Ionicons 
              name={commentedPosts[item.id] ? "chatbubble" : "chatbubble-outline"} 
              size={24} 
              color={commentedPosts[item.id] ? '#0095f6' : isDarkMode ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => toggleAction(item.id, 'share')}
          >
            <Ionicons 
              name={sharedPosts[item.id] ? "paper-plane" : "paper-plane-outline"} 
              size={24} 
              color={sharedPosts[item.id] ? '#0095f6' : isDarkMode ? '#ffffff' : '#000000'} 
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => toggleAction(item.id, 'save')}
        >
          <Ionicons 
            name={savedPosts[item.id] ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={savedPosts[item.id] ? '#0095f6' : isDarkMode ? '#ffffff' : '#000000'} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.postContent}>
        <Text style={[styles.postTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          {item.title}
        </Text>
        <Text style={[styles.postDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
          {item.description}
        </Text>
        <Text style={[styles.postDate, { color: isDarkMode ? '#888888' : '#999999' }]}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderStory = ({ item }: { item: TravelEntry }) => (
    <TouchableOpacity style={styles.storyContainer}>
      <View style={styles.storyImageContainer}>
        <Image source={{ uri: item.image }} style={styles.storyImage} />
      </View>
      <Text style={[styles.storyTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]} numberOfLines={1}>
        {item.title}
      </Text>
        </TouchableOpacity>
  );

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
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    headerRight: {
      flexDirection: 'row',
    alignItems: 'center',
      gap: 16,
    },
    headerButton: {
      padding: 4,
    },
    storiesContainer: {
      borderBottomWidth: 0.5,
      borderBottomColor: '#dbdbdb',
      paddingVertical: 8,
    },
    storyContainer: {
    alignItems: 'center',
      marginHorizontal: 8,
      width: 80,
    },
    storyImageContainer: {
      width: 68,
      height: 68,
      borderRadius: 34,
      borderWidth: 2,
      borderColor: '#ff8501',
      padding: 2,
    },
    storyImage: {
      width: '100%',
      height: '100%',
      borderRadius: 32,
    },
    storyTitle: {
      fontSize: 12,
      marginTop: 4,
      textAlign: 'center',
    },
    addStoryContainer: {
      alignItems: 'center',
      marginHorizontal: 8,
      width: 80,
    },
    addStoryButton: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
      alignItems: 'center',
    },
    postContainer: {
      marginBottom: 16,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    padding: 12,
    },
    postHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f5f5f5',
      justifyContent: 'center',
    alignItems: 'center',
    },
    username: {
      fontSize: 14,
      fontWeight: '600',
    },
    location: {
      fontSize: 12,
    },
    moreButton: {
      padding: 4,
    },
    postImage: {
      width,
      height: width,
    },
    postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
      padding: 12,
    },
    postActionsLeft: {
      flexDirection: 'row',
      gap: 16,
    },
    actionButton: {
      padding: 4,
    },
    postContent: {
      padding: 12,
      paddingTop: 0,
    },
    postTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    postDescription: {
    fontSize: 14,
      marginBottom: 4,
  },
    postDate: {
      fontSize: 12,
      marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
      height: 400,
  },
  emptyText: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
    textAlign: 'center',
  },
    emptySubText: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
    },
  });

  // Add useEffect to reload entries when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadEntries();
    });

    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#0095f6'} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#ffffff' }]}>
      <View style={[styles.header, { borderBottomColor: isDarkMode ? '#333333' : '#dbdbdb' }]}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Aljo's Travel Diary
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={toggleTheme}>
            <Ionicons name={isDarkMode ? "sunny" : "moon"} size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('AddEntry')}>
            <Ionicons name="add-circle-outline" size={28} color={isDarkMode ? '#ffffff' : '#000000'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={entries}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <FlatList
            data={entries}
            renderItem={renderStory}
            keyExtractor={(item) => `story-${item.id}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.storiesContainer}
            ListHeaderComponent={() => (
              <TouchableOpacity 
                style={styles.addStoryContainer}
                onPress={() => navigation.navigate('AddEntry')}
              >
                <View style={[styles.addStoryButton, { backgroundColor: isDarkMode ? '#333333' : '#f5f5f5' }]}>
                  <Ionicons name="add" size={28} color="#0095f6" />
                </View>
                <Text style={[styles.storyTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                  Your story
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color={isDarkMode ? '#ffffff' : '#666666'} />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#ffffff' : '#666666' }]}>
              No Entries yet
            </Text>
            <Text style={[styles.emptySubText, { color: isDarkMode ? '#cccccc' : '#999999' }]}>
              Your travel memories will appear here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
