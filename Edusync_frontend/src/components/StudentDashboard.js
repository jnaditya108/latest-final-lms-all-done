// src/components/StudentDashboard.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ProfileCard from './ProfileCard';
import { getStudentAssessments, getEnrolledCourses, getCourses, enrollInCourse, toggleCourseCompletion } from '../services/dataApi';
import './StudentDashboard.css';

function StudentDashboard() {
    const navigate = useNavigate();
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [availableCourses, setAvailableCourses] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const joinDate = localStorage.getItem('joinDate') || new Date().toISOString();

    const calculateStats = () => {
        const completedCourses = enrolledCourses.filter(course => calculateProgress(course).percentage === 100);
        const upcomingAssessments = assessments.filter(assessment => {
            const now = new Date();
            const start = new Date(assessment.startDate);
            return !assessment.isCompleted && now < start;
        });

        return [
            {
                label: 'Enrolled Courses',
                value: enrolledCourses.length
            },
            {
                label: 'Completed',
                value: completedCourses.length
            },
            {
                label: 'In Progress',
                value: enrolledCourses.length - completedCourses.length
            },
            {
                label: 'Upcoming Tests',
                value: upcomingAssessments.length
            }
        ];
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const enrolledResponse = await getEnrolledCourses(userId);
                setEnrolledCourses(enrolledResponse.data);

                const coursesResponse = await getCourses();
                const availableCourses = coursesResponse.data.filter(course => 
                    !enrolledResponse.data.some(enrolled => enrolled.id === course.id)
                );
                setAvailableCourses(availableCourses);

                const assessmentsResponse = await getStudentAssessments(userId);
                setAssessments(assessmentsResponse.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                const errorMessage = err.response?.data?.message || 'Failed to load dashboard data. Please try again.';
                setError(errorMessage);
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId, navigate]);

    const handleViewCourseClick = (courseId) => {
        navigate(`/student/courses/${courseId}`);
    };

    const handleEnrollClick = async (courseId) => {
        try {
            const enrollmentResponse = await enrollInCourse({
                userId: parseInt(userId),
                courseId: courseId
                // Note: We don't need to send enrollmentDate as it's set by the backend
            });

            if (enrollmentResponse.status === 200) {
                // Refresh enrolled courses
                const response = await getEnrolledCourses(userId);
                setEnrolledCourses(response.data);
                
                // Update available courses
                const allCoursesResponse = await getCourses();
                const availableCourses = allCoursesResponse.data.filter(course => 
                    !response.data.some(enrolled => enrolled.id === course.id)
                );
                setAvailableCourses(availableCourses);

                setMessage(enrollmentResponse.data.message || 'Successfully enrolled in the course!');
                setError(null); // Clear any previous errors
            }
        } catch (err) {
            console.error('Error enrolling in course:', err);
            let errorMessage = 'Failed to enroll in the course. Please try again.';
            
            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = 'Please log in to enroll in courses.';
                    localStorage.clear();
                    navigate('/login');
                } else if (err.response.status === 400) {
                    errorMessage = err.response.data.message || 'Invalid enrollment request.';
                } else if (err.response.status === 404) {
                    errorMessage = 'Course not found.';
                }
            }
            
            setError(errorMessage);
            setMessage(''); // Clear any success message
        }
    };

    const handleViewAssessmentClick = (assessmentId) => {
        navigate(`/student/assessments/${assessmentId}`);
    };

    const formatDueDate = (dueDate) => {
        if (!dueDate) return 'No due date';
        const date = new Date(dueDate);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getAssessmentStatusClass = (assessment) => {
        if (!assessment.startDate || !assessment.endDate) return 'status-pending';
        const now = new Date();
        const start = new Date(assessment.startDate);
        const end = new Date(assessment.endDate);

        if (assessment.isCompleted) return 'status-completed';
        if (now < start) return 'status-upcoming';
        if (now >= start && now <= end) return 'status-active';
        return 'status-expired';
    };

    const getAssessmentStatusText = (assessment) => {
        if (!assessment.startDate || !assessment.endDate) return 'Pending';
        const now = new Date();
        const start = new Date(assessment.startDate);
        const end = new Date(assessment.endDate);

        if (assessment.isCompleted) return 'Completed';
        if (now < start) return 'Upcoming';
        if (now >= start && now <= end) return 'Active';
        return 'Expired';
    };

    const calculateProgress = (course) => {
        // This is a placeholder calculation. You'll need to implement the actual logic
        // based on your course completion tracking system
        const completed = course.completedLessons || 0;
        const total = course.totalLessons || 10;
        const percentage = (completed / total) * 100;
        return {
            completed,
            total,
            percentage
        };
    };

    const handleToggleCompletion = async (enrollmentId) => {
        try {
            const response = await toggleCourseCompletion(enrollmentId);
            if (response.status === 200) {
                // Refresh enrolled courses
                const enrolledResponse = await getEnrolledCourses(userId);
                setEnrolledCourses(enrolledResponse.data);
                setMessage(response.data.message);
            }
        } catch (err) {
            console.error('Error toggling course completion:', err);
            setError('Failed to update course completion status. Please try again.');
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="dashboard-container">
                    <div className="loading-spinner">Loading student dashboard...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="dashboard-container">
                    <p className="error-message">{error}</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="dashboard-container">
                <ProfileCard 
                    user={{
                        username,
                        email,
                        role: 'Student',
                        joinDate
                    }}
                    stats={calculateStats()}
                />

                {message && <div className="message">{message}</div>}

                {/* Enrolled Courses Section */}
                <div className="section">
                    <h3 className="section-header">Your Enrolled Courses</h3>
                    {enrolledCourses.length === 0 ? (
                        <p className="empty-state">You haven't enrolled in any courses yet.</p>
                    ) : (
                        <div className="course-grid">
                            {enrolledCourses.map(course => (
                                <div key={course.id} className="course-card">
                                    <div className="course-media">
                                        {course.thumbnailUrl && (
                                            <img
                                                alt={course.title}
                                                src={`http://localhost:5121${course.thumbnailUrl}`}
                                                className="course-thumbnail"
                                            />
                                        )}
                                        <div className="course-progress-indicator">
                                            <div 
                                                className={`progress-circle ${course.isCompleted ? 'completed' : ''}`}
                                                style={{
                                                    background: course.isCompleted 
                                                        ? '#4caf50' 
                                                        : `conic-gradient(#2196f3 ${calculateProgress(course).percentage * 3.6}deg, #f0f0f0 0deg)`
                                                }}
                                            >
                                                {course.isCompleted ? (
                                                    <i className="fas fa-check"></i>
                                                ) : (
                                                    <span>{Math.round(calculateProgress(course).percentage)}%</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="course-content">
                                        <h3 className="course-title">{course.title}</h3>
                                        <p className="course-description">{course.description}</p>
                                        
                                        {course.assessments && course.assessments.length > 0 && (
                                            <div className="assessment-list">
                                                {course.assessments.map(assessment => (
                                                    <div key={assessment.id} className="assessment-item">
                                                        <div className="assessment-info">
                                                            <div className="assessment-title">{assessment.title}</div>
                                                            <div className="assessment-date">
                                                                Due: {new Date(assessment.endDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="assessment-button"
                                                            onClick={() => handleViewAssessmentClick(assessment.id)}
                                                        >
                                                            Take Assessment
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="course-footer">
                                        <div className="course-actions">
                                            <button
                                                className="action-button primary"
                                                onClick={() => handleViewCourseClick(course.id)}
                                            >
                                                View Course
                                            </button>
                                            <button
                                                className="action-button secondary"
                                                onClick={() => handleToggleCompletion(course.enrollmentId)}
                                            >
                                                {course.isCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Courses Section */}
                <div className="section">
                    <h3 className="section-header">Available Courses</h3>
                    {availableCourses.length === 0 ? (
                        <p className="empty-state">No new courses available for enrollment.</p>
                    ) : (
                        <div className="course-grid">
                            {availableCourses.map(course => (
                                <div key={course.id} className="course-card">
                                    <div className="course-media">
                                        {course.thumbnailUrl && (
                                            <img
                                                alt={course.title}
                                                src={`http://localhost:5121${course.thumbnailUrl}`}
                                                className="course-thumbnail"
                                            />
                                        )}
                                    </div>
                                    <div className="course-content">
                                        <h4 className="course-title">{course.title}</h4>
                                        <p className="course-description">{course.description}</p>
                                        <div className="course-meta">
                                            <p className="instructor-info">
                                                Instructor: {course.instructorUsername}
                                            </p>
                                            <p className="course-stats">
                                                {course.totalLessons || 10} lessons
                                            </p>
                                        </div>
                                    </div>
                                    <div className="course-actions">
                                        <button 
                                            className="button button-secondary"
                                            onClick={() => handleEnrollClick(course.id)}
                                        >
                                            Enroll Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Assessments Section */}
                <div className="section">
                    <h3 className="section-header">Your Assessments</h3>
                    {assessments.length === 0 ? (
                        <p className="empty-state">No assessments available yet.</p>
                    ) : (
                        <div className="assessment-grid">
                            {assessments.map((assessment) => (
                                <div key={assessment.id} className="assessment-card">
                                    <div className="assessment-header">
                                        <h4>{assessment.title}</h4>
                                        <span className={`status-badge ${getAssessmentStatusClass(assessment)}`}>
                                            {getAssessmentStatusText(assessment)}
                                        </span>
                                    </div>
                                    <div className="assessment-content">
                                        <p>{assessment.description}</p>
                                        <div className="assessment-meta">
                                            <p>Course: {assessment.course?.title || 'N/A'}</p>
                                            <div className="assessment-dates">
                                                <p>Start: {formatDueDate(assessment.startDate)}</p>
                                                <p>End: {formatDueDate(assessment.endDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="assessment-actions">
                                        <button
                                            className={`button ${assessment.isCompleted ? 'button-secondary' : 'button-primary'}`}
                                            onClick={() => handleViewAssessmentClick(assessment.id)}
                                            disabled={getAssessmentStatusClass(assessment) !== 'status-active'}
                                        >
                                            {assessment.isCompleted ? 'View Results' : 'Take Assessment'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default StudentDashboard;
