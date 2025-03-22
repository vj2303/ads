// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login';
import FacebookRedirect from './FacebookRedirect';

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/redirect" element={<FacebookRedirect />} />
            </Routes>
        </Router>
    );
};

export default App;
