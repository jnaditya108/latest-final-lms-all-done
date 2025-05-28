// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Login from './components/Login';
import EducatorDashboard from './components/EducatorDashboard';
import StudentDashboard from './components/StudentDashboard';
import Home from './components/Home';
import QuestionManager from './components/QuestionManager';
import Register from './components/Register';
import CourseStudentsPage from './components/CourseStudentsPage';
import CourseDetailsPage from './components/CourseDetailsPage';
import StudentAssessment from './components/StudentAssessment';
import CourseContent from './components/CourseContent';
import CourseStudents from './components/CourseStudents';
import './App.css';

// ---------- PRIVATE ROUTE ----------
function PrivateRoute({ children, allowedRoles }) {
    const isAuthenticated = () => {
        return localStorage.getItem('token') !== null;
    };

    const getUserRole = () => {
        return localStorage.getItem('role');
    };

    const auth = isAuthenticated();
    const userRole = getUserRole();

    if (!auth || (allowedRoles && !allowedRoles.includes(userRole))) {
        return <Navigate to="/" />;
    }

    return children;
}

// ---------- WRAPPERS ----------
const QuestionManagerWrapper = () => {
    const { assessmentId } = useParams();
    return <QuestionManager assessmentId={parseInt(assessmentId, 10)} />;
};

const CourseDetailsWrapper = () => {
    const { courseId } = useParams();
    return <CourseDetailsPage courseId={parseInt(courseId, 10)} />;
};

const CourseStudentsWrapper = () => {
    const { courseId } = useParams();
    return <CourseStudentsPage courseId={parseInt(courseId, 10)} />;
};

// ---------- MAIN APP ----------
function App() {
    return (
        <Router>
            <div className="App" style={appStyle}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Student Routes */}
                    <Route
                        path="/student"
                        element={
                            <PrivateRoute allowedRoles={['Student']}>
                                <StudentDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/student/courses/:courseId"
                        element={
                            <PrivateRoute allowedRoles={['Student']}>
                                <CourseContent />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/student/assessments/:assessmentId"
                        element={
                            <PrivateRoute allowedRoles={['Student']}>
                                <StudentAssessment />
                            </PrivateRoute>
                        }
                    />

                    {/* Protected Educator Routes */}
                    <Route
                        path="/educator"
                        element={
                            <PrivateRoute allowedRoles={['Educator']}>
                                <EducatorDashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/course/:courseId/students"
                        element={
                            <PrivateRoute allowedRoles={['Educator']}>
                                <CourseStudents />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/educator/assessments/:assessmentId/questions"
                        element={
                            <PrivateRoute allowedRoles={['Educator']}>
                                <QuestionManagerWrapper />
                            </PrivateRoute>
                        }
                    />

                    {/* Catch-all Fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </Router>
    );
}

// Global styling
const appStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom right, #E0FFFF, #FFDAB9)',
    padding: '20px 0',
};

export default App;
