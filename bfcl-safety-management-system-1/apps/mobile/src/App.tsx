import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import IncidentReportScreen from './screens/IncidentReportScreen';
import AuditScreen from './screens/AuditScreen';
import RiskAssessmentScreen from './screens/RiskAssessmentScreen';
import TrainingScreen from './screens/TrainingScreen';
import PermitsScreen from './screens/PermitsScreen';
import EquipmentScreen from './screens/EquipmentScreen';
import ReportsScreen from './screens/ReportsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Incident Report" component={IncidentReportScreen} />
        <Stack.Screen name="Audits" component={AuditScreen} />
        <Stack.Screen name="Risk Assessment" component={RiskAssessmentScreen} />
        <Stack.Screen name="Training" component={TrainingScreen} />
        <Stack.Screen name="Permits" component={PermitsScreen} />
        <Stack.Screen name="Equipment" component={EquipmentScreen} />
        <Stack.Screen name="Reports" component={ReportsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;