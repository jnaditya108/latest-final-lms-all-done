import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dataApi from '../services/dataApi';
import Navbar from './Navbar';
import CourseForm from './CourseForm';
import AssessmentForm from './AssessmentForm';

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

    // --- Data Fetching Functions ---
    const fetchCourses = async () => {
        try {
            const coursesResponse = await dataApi.get('/courses');
            const educatorsCourses = coursesResponse.data.filter(course =>
                course.instructorId === parseInt(userId) || (course.instructor && course.instructor.id === parseInt(userId))
            );
            setCourses(educatorsCourses);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Failed to load courses.');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.clear();
                navigate('/login');
            }
        }
    };

    const fetchAllAssessments = async () => {
        try {
            const assessmentsResponse = await dataApi.get('/assessments');
            setAllAssessments(assessmentsResponse.data);
        } catch (err) {
            console.error('Error fetching assessments:', err);
            setError('Failed to load assessments.');
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.clear();
                navigate('/login');
            }
        }
    };

    // --- useEffect for Initial Data Load ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setMessage('');
            await fetchCourses();
            await fetchAllAssessments();
            setLoading(false);
        };
        fetchData();
    }, [userId, navigate]);

    // --- Handlers for Course Operations ---
    const handleCreateCourseClick = () => {
        setCourseToEdit(null);
        setShowCourseForm(true);
        setShowAssessmentForm(false);
        setMessage('');
    };

    const handleEditCourseClick = (course) => {
        console.log('Editing course:', course);
        setCourseToEdit(course);
        setShowCourseForm(true);
        setShowAssessmentForm(false);
        setMessage('');
    };

    const handleDeleteCourse = async (courseId) => {
        if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            try {
                console.log(`Attempting to delete course with ID: ${courseId}`);
                const response = await dataApi.delete(`/courses/${courseId}`);
                console.log('Delete course response:', response);
                
                if (response.status === 200) {
                    setMessage('Course deleted successfully!');
                    await fetchCourses();
                } else {
                    throw new Error(response.data?.message || 'Failed to delete course');
                }
            } catch (err) {
                console.error('Failed to delete course:', err);
                console.error('Error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                });
                
                if (err.response?.status === 401) {
                    localStorage.clear();
                    navigate('/login');
                    return;
                }
                
                if (err.response?.status === 403) {
                    setError('You are not authorized to delete this course.');
                    return;
                }
                
                const errorMessage = err.response?.data?.message || 'Failed to delete course.';
                setError(errorMessage);
                setMessage('');
            }
        }
    };

    const handleCourseSaved = async () => {
        console.log('Course saved callback triggered');
        setShowCourseForm(false);
        setCourseToEdit(null);
        await fetchCourses();
        setMessage('Course saved successfully!');
    };

    const handleCancelCourseForm = () => {
        setShowCourseForm(false);
        setCourseToEdit(null);
        setMessage('');
    };

    // --- Handlers for Assessment Operations ---
    const handleCreateAssessmentClick = (courseId) => {
        setAssessmentToEdit(null);
        setCurrentCourseIdForAssessment(courseId);
        setShowAssessmentForm(true);
        setShowCourseForm(false);
        setMessage('');
    };

    const handleEditAssessmentClick = (assessment) => {
        setAssessmentToEdit(assessment);
        setCurrentCourseIdForAssessment(assessment.courseId);
        setShowAssessmentForm(true);
        setShowCourseForm(false);
        setMessage('');
    };

    const handleDeleteAssessment = async (assessmentId) => {
        if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
            try {
                await dataApi.delete(`/assessments/${assessmentId}`);
                setMessage('Assessment deleted successfully!');
                await fetchAllAssessments();
            } catch (err) {
                console.error('Failed to delete assessment:', err);
                const errorMessage = err.response?.data?.message || 'Failed to delete assessment.';
                setError(errorMessage);
                setMessage('');
            }
        }
    };

    const handleAssessmentSaved = async () => {
        setShowAssessmentForm(false);
        setAssessmentToEdit(null);
        setCurrentCourseIdForAssessment(null);
        await fetchAllAssessments();
        setMessage('Assessment saved successfully!');
    };

    const handleCancelAssessmentForm = () => {
        setShowAssessmentForm(false);
        setAssessmentToEdit(null);
        setCurrentCourseIdForAssessment(null);
        setMessage('');
    };

    // --- NEW: Handler for "Manage Questions" button ---
    const handleManageQuestionsClick = (assessmentId) => {
        navigate(`/educator/assessments/${assessmentId}/questions`);
    };

    // Placeholder handler for "View Students" button (implement as needed)
    const handleViewStudentsClick = (courseId) => {
        navigate(`/educator/courses/${courseId}/students`);
    };

    // --- Loading and Error Display ---
    if (loading) {
        return <div style={dashboardContainerStyle}>Loading educator dashboard...</div>;
    }

    if (error) {
        return <div style={dashboardContainerStyle}><p style={{ color: 'red' }}>{error}</p></div>;
    }

    return (
        <>
            <Navbar />
            <div style={dashboardContainerStyle}>
                <div style={welcomeHeaderStyle}>
                    <h2 style={welcomeTitleStyle}>Welcome, {username}!</h2>
                    <p style={welcomeSubtitleStyle}>Manage your courses and assessments here</p>
                </div>

                {message && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '20px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '5px'
                    }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '20px',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '5px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Course Form */}
                {showCourseForm && (
                    <CourseForm
                        courseToEdit={courseToEdit}
                        onCourseSaved={handleCourseSaved}
                        onCancel={() => {
                            setShowCourseForm(false);
                            setCourseToEdit(null);
                            setMessage('');
                        }}
                    />
                )}

                {/* Course List */}
                {!showCourseForm && !showAssessmentForm && (
                    <div style={coursesContainerStyle}>
                        <button 
                            onClick={() => {
                                setCourseToEdit(null);
                                setShowCourseForm(true);
                            }}
                            style={createButtonStyle}
                        >
                            Create New Course
                        </button>

                        <div style={courseGridStyle}>
                            {courses.map(course => (
                                <div key={course.id} style={courseCardStyle}>
                                    {course.thumbnailUrl && (
                                        <img
                                            src={`http://localhost:5121${course.thumbnailUrl}`}
                                            alt={course.title}
                                            style={courseImageStyle}
                                        />
                                    )}
                                    <div style={courseContentStyle}>
                                        <h3 style={courseTitleStyle}>{course.title}</h3>
                                        <p style={courseDescriptionStyle}>{course.description}</p>
                                        <div style={courseActionsStyle}>
                                            <button
                                                onClick={() => handleEditCourseClick(course)}
                                                style={editButtonStyle}
                                            >
                                                Edit Course
                                            </button>
                                            <button
                                                onClick={() => handleCreateAssessmentClick(course.id)}
                                                style={assessmentButtonStyle}
                                            >
                                                Add Assessment
                                            </button>
                                            <button
                                                onClick={() => handleViewStudentsClick(course.id)}
                                                style={{
                                                    ...buttonBaseStyle,
                                                    backgroundColor: '#9b59b6',
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: '#8e44ad'
                                                    }
                                                }}
                                            >
                                                View Students
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCourse(course.id)}
                                                style={deleteButtonStyle}
                                            >
                                                Delete Course
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

// Styles

const dashboardContainerStyle = {
    maxWidth: '1200px',
    margin: '30px auto',
    padding: '0 20px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
};

const welcomeHeaderStyle = {
    background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    color: 'white',
    padding: '30px',
    borderRadius: '15px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
};

const welcomeTitleStyle = {
    fontSize: '2.2rem',
    marginBottom: '10px',
    fontWeight: '600'
};

const welcomeSubtitleStyle = {
    fontSize: '1.1rem',
    opacity: '0.9'
};

const messageStyle = {
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
};

const errorMessageStyle = {
    ...messageStyle,
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
};

const courseCardStyle = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    border: '1px solid #e1e8ed',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    }
};

const courseHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '15px'
};

const courseThumbnailStyle = {
    width: '120px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px'
};

const courseInfoStyle = {
    flex: 1
};

const courseTitleStyle = {
    fontSize: '1.4rem',
    color: '#2c3e50',
    marginBottom: '5px'
};

const courseDescriptionStyle = {
    color: '#666',
    fontSize: '1rem',
    marginBottom: '15px'
};

const actionButtonsStyle = {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
};

const buttonBaseStyle = {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease'
};

const primaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#3498db',
    color: 'white',
    '&:hover': {
        backgroundColor: '#2980b9'
    }
};

const secondaryButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#2ecc71',
    color: 'white',
    '&:hover': {
        backgroundColor: '#27ae60'
    }
};

const dangerButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: '#e74c3c',
    color: 'white',
    '&:hover': {
        backgroundColor: '#c0392b'
    }
};

const assessmentSectionStyle = {
    marginTop: '15px',
    borderTop: '1px solid #eee',
    paddingTop: '15px'
};

const assessmentHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
};

const assessmentTitleStyle = {
    fontSize: '1.1rem',
    color: '#34495e',
    fontWeight: '500'
};

const assessmentListStyle = {
    display: 'grid',
    gap: '10px'
};

const assessmentItemStyle = {
    background: '#f8f9fa',
    padding: '12px',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const coursesContainerStyle = {
    marginBottom: '20px'
};

const createButtonStyle = {
    ...primaryButtonStyle,
    marginBottom: '20px',
    padding: '12px 24px',
    fontSize: '1rem'
};

const courseGridStyle = {
    display: 'grid',
    gap: '20px'
};

const courseImageStyle = {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px'
};

const courseContentStyle = {
    flex: 1
};

const courseActionsStyle = {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
};

const editButtonStyle = {
    ...secondaryButtonStyle
};

const assessmentButtonStyle = {
    ...primaryButtonStyle
};

const deleteButtonStyle = {
    ...dangerButtonStyle
};

export default EducatorDashboard;