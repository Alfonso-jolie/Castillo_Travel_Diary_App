declare module '@react-native-async-storage/async-storage' {
  export async function getItem(key: string): Promise<string | null>;
  export async function setItem(key: string, value: string): Promise<void>;
  export async function removeItem(key: string): Promise<void>;
  export async function clear(): Promise<void>;
} 