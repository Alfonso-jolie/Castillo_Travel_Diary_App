declare module 'react-native-masonry-layout' {
  import { Component } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  interface MasonryListProps<T> {
    data: T[];
    renderItem: ({ item }: { item: T }) => React.ReactElement;
    columns?: number;
    spacing?: number;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
  }

  export default class MasonryList<T> extends Component<MasonryListProps<T>> {}
} 