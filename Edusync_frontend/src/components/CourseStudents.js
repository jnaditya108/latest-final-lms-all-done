import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import dataApi from '../services/dataApi';
import './CourseStudents.css';

const CourseStudents = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsResponse, courseResponse] = await Promise.all([
                    dataApi.get(`/courses/${courseId}/students`),
                    dataApi.get(`/courses/${courseId}`)
                ]);
                
                setStudents(studentsResponse.data.students);
                setCourse(courseResponse.data);
            } catch (err) {
                console.error('Error fetching students:', err);
                setError('Failed to load students data');
                if (err.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [courseId, navigate]);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="students-container">
                    <div className="loading">Loading students data...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="students-container">
                    <div className="error-message">{error}</div>
                    <button className="button button-secondary" onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="students-container">
                <div className="students-header">
                    <h2>{course?.title} - Enrolled Students</h2>
                    <button className="button button-secondary" onClick={() => navigate(-1)}>
                        Back to Dashboard
                    </button>
                </div>

                {students.length === 0 ? (
                    <div className="empty-state">
                        No students enrolled in this course yet.
                    </div>
                ) : (
                    <div className="students-grid">
                        {students.map(student => (
                            <div key={student.id} className="student-card">
                                <div className="student-info">
                                    <h3>{student.username}</h3>
                                    <p>{student.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default CourseStudents; 