import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import ProfileCard from './ProfileCard';
import CourseForm from './CourseForm';
import AssessmentForm from './AssessmentForm';
import dataApi from '../services/dataApi';
import './EducatorDashboard.css';

function EducatorDashboard() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [allAssessments, setAllAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const [showCourseForm, setShowCourseForm] = useState(false);
    const [courseToEdit, setCourseToEdit] = useState(null);

    const [showAssessmentForm, setShowAssessmentForm] = useState(false);
    const [assessmentToEdit, setAssessmentToEdit] = useState(null);
    const [currentCourseIdForAssessment, setCurrentCourseIdForAssessment] = useState(null);

    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('email');
    const joinDate = localStorage.getItem('joinDate') || new Date().toISOString();

    const calculateStats = () => {
        const totalStudents = courses.reduce((sum, course) => sum + course.enrollmentsCount, 0);

        const totalAssessments = allAssessments.length;
        const activeAssessments = allAssessments.filter(assessment => {
            const now = new Date();
            const start = new Date(assessment.startDate);
            const end = new Date(assessment.endDate);
            return now >= start && now <= end;
        }).length;

        return [
            {
                label: 'Total Courses',
                value: courses.length
            },
            {
                label: 'Total Students',
                value: totalStudents
            },
            {
                label: 'Total Assessments',
                value: totalAssessments
            },
            {
                label: 'Active Assessments',
                value: activeAssessments
            }
        ];
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const coursesResponse = await dataApi.get('/courses');
                const educatorsCourses = coursesResponse.data.filter(course =>
                    course.instructorId === parseInt(userId)
                );
                setCourses(educatorsCourses);

                const assessmentsResponse = await dataApi.get('/assessments');
                setAllAssessments(assessmentsResponse.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load dashboard data.');
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

    const handleCreateCourse = () => {
        setCourseToEdit(null);
        setShowCourseForm(true);
    };

    const handleEditCourse = (course) => {
        setCourseToEdit(course);
        setShowCourseForm(true);
    };

    const handleCreateAssessment = (courseId) => {
        setAssessmentToEdit(null);
        setCurrentCourseIdForAssessment(courseId);
        setShowAssessmentForm(true);
    };

    const handleEditAssessment = (assessment) => {
        setAssessmentToEdit(assessment);
        setCurrentCourseIdForAssessment(assessment.courseId);
        setShowAssessmentForm(true);
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            try {
                await dataApi.delete(`/courses/${courseId}`);
                setCourses(prev => prev.filter(course => course.id !== courseId));
                setMessage('Course deleted successfully!');
            } catch (err) {
                console.error('Failed to delete course:', err);
                setError('Failed to delete course. Please try again.');
            }
        }
    };

    const handleCourseSaved = async () => {
        setShowCourseForm(false);
        setCourseToEdit(null);
        try {
            const coursesResponse = await dataApi.get('/courses');
            const educatorsCourses = coursesResponse.data.filter(course =>
                course.instructorId === parseInt(userId)
            );
            setCourses(educatorsCourses);
            setMessage('Course saved successfully!');
        } catch (err) {
            console.error('Error refreshing courses:', err);
            setError('Failed to refresh course list.');
        }
    };

    const handleAssessmentSaved = async () => {
        setShowAssessmentForm(false);
        setAssessmentToEdit(null);
        setCurrentCourseIdForAssessment(null);
        try {
            const assessmentsResponse = await dataApi.get('/assessments');
            setAllAssessments(assessmentsResponse.data);
            setMessage('Assessment saved successfully!');
        } catch (err) {
            console.error('Error refreshing assessments:', err);
            setError('Failed to refresh assessment list.');
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="dashboard-container">
                    <div className="loading-spinner">Loading educator dashboard...</div>
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
                        role: 'Educator',
                        joinDate
                    }}
                    stats={calculateStats()}
                />

                {message && <div className="message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <div className="actions-bar">
                    <button className="button button-primary" onClick={handleCreateCourse}>
                        Create New Course
                    </button>
                </div>

                {/* Courses Section */}
                <div className="section">
                    <h3 className="section-header">Your Courses</h3>
                    {courses.length === 0 ? (
                        <p className="empty-state">You haven't created any courses yet.</p>
                    ) : (
                        <div className="course-grid">
                            {courses.map(course => (
                                <div key={course.id} className="course-card">
                                    <div className="course-media">
                                        {course.thumbnailUrl && (
                                            <img
                                                alt={course.title}
                                                src={`http://localhost:5121${course.thumbnailUrl}`}
                                                className="course-thumbnail"
                                            />
                                        )}
                                        <div className="course-stats-badge">
                                            {course.enrollmentsCount} enrolled
                                        </div>
                                    </div>
                                    <div className="course-content">
                                        <h4 className="course-title">{course.title}</h4>
                                        <p className="course-description">{course.description}</p>
                                        <div className="course-meta">
                                            <div className="meta-info">
                                                <span>{course.assessmentsCount} assessments</span>
                                                <span>Created: {new Date(course.createdAt).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="course-actions">
                                        <div className="action-row">
                                            <button 
                                                className="button button-primary"
                                                onClick={() => handleCreateAssessment(course.id)}
                                            >
                                                Add Assessment
                                            </button>
                                            <button 
                                                className="button button-secondary"
                                                onClick={() => handleEditCourse(course)}
                                            >
                                                Edit Course
                                            </button>
                                        </div>
                                        <div className="action-row">
                                            <button 
                                                className="button button-info"
                                                onClick={() => navigate(`/course/${course.id}/students`)}
                                            >
                                                Students ({course.enrollmentsCount || 0})
                                            </button>
                                            <button 
                                                className="button button-danger"
                                                onClick={() => handleDeleteCourse(course.id)}
                                            >
                                                Delete Course
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Forms */}
                {showCourseForm && (
                    <CourseForm
                        course={courseToEdit}
                        onSave={handleCourseSaved}
                        onCancel={() => {
                            setShowCourseForm(false);
                            setCourseToEdit(null);
                        }}
                    />
                )}

                {showAssessmentForm && (
                    <AssessmentForm
                        assessment={assessmentToEdit}
                        courseId={currentCourseIdForAssessment}
                        onSave={handleAssessmentSaved}
                        onCancel={() => {
                            setShowAssessmentForm(false);
                            setAssessmentToEdit(null);
                            setCurrentCourseIdForAssessment(null);
                        }}
                    />
                )}
            </div>
        </>
    );
}

export default EducatorDashboard;