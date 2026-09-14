
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import AusbildungsfortschrittScreen from './screens/student/AusbildungsfortschrittScreen';
import MeineTermineScreen from './screens/student/MeineTermineScreen';
import StudentDashboardScreen from './screens/student/StudentDashboardScreen';
import TerminAnfragenScreen from './screens/student/TerminAnfragenScreen';
import TerminDetailsScreen from './screens/student/TerminDetailsScreen';

export default function App() {
  return <TerminAnfragenScreen />;
}
/*

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';

export default function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log('Supabase connection test:', error ? 'FAILED' : 'OK', error ?? data);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text>RS Fahrschule App — Phase 2 setup</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});*/