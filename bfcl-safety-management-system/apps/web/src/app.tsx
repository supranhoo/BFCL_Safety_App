import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from './reducers'; // Assuming you have a rootReducer defined
import HomePage from './pages/HomePage'; // Example page component
import IncidentPage from './pages/IncidentPage'; // Example page component
import AuditPage from './pages/AuditPage'; // Example page component
import RiskAssessmentPage from './pages/RiskAssessmentPage'; // Example page component
import TrainingPage from './pages/TrainingPage'; // Example page component
import PermitPage from './pages/PermitPage'; // Example page component
import EquipmentPage from './pages/EquipmentPage'; // Example page component
import NotificationPage from './pages/NotificationPage'; // Example page component
import UserPage from './pages/UserPage'; // Example page component
import ReportPage from './pages/ReportPage'; // Example page component

const store = createStore(rootReducer);

const App = () => {
    return (
        <Provider store={store}>
            <Router>
                <Switch>
                    <Route path="/" exact component={HomePage} />
                    <Route path="/incidents" component={IncidentPage} />
                    <Route path="/audits" component={AuditPage} />
                    <Route path="/risk-assessment" component={RiskAssessmentPage} />
                    <Route path="/training" component={TrainingPage} />
                    <Route path="/permits" component={PermitPage} />
                    <Route path="/equipment" component={EquipmentPage} />
                    <Route path="/notifications" component={NotificationPage} />
                    <Route path="/users" component={UserPage} />
                    <Route path="/reports" component={ReportPage} />
                </Switch>
            </Router>
        </Provider>
    );
};

export default App;