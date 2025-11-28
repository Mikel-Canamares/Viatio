import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { RootTabs } from '@/navigation';
import { ErrorBoundary } from '@/components';

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <RootTabs />
        <StatusBar style="auto" />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
